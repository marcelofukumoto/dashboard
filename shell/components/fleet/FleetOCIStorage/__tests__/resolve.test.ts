import { scenarioData } from '@shell/components/fleet/FleetOCIStorage/mock';
import {
  backoff,
  FALLBACK_SECRET,
  PUSH_ENTRY,
  pullOrder,
  resolveDeployment,
  resolveDeployments,
  resolveSecret,
  secretFor,
  setMatches,
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import { CredentialSet, DeploymentStatus, OCICluster, OCIStorageData } from '@shell/components/fleet/FleetOCIStorage/types';

function cluster(data: OCIStorageData, name: string): OCICluster {
  return data.clusters.find((c) => c.name === name) as OCICluster;
}

function deployment(data: OCIStorageData, gitRepoName: string, clusterName: string): DeploymentStatus {
  const gitRepo = data.gitRepos.find((g) => g.name === gitRepoName)!;

  return resolveDeployment(data, gitRepo, gitRepo.bundles[0], cluster(data, clusterName)) as DeploymentStatus;
}

function secret(data: OCIStorageData, name: string) {
  return data.secrets.find((s) => s.name === name)!;
}

describe('fleet OCI storage credential sets', () => {
  let data: OCIStorageData;

  beforeEach(() => {
    data = scenarioData();
  });

  describe('setMatches', () => {
    const target: OCICluster = {
      name: 'c1', labels: { region: 'eu' }, groups: ['g1'], reach: {}, defaultReach: 'ok', lastPullMinutesAgo: 1
    };
    const set = {
      name: 's', host: 'h', namespace: '', agentUsername: '', hasAgentPassword: false, tlsMode: 'system', caBundle: '', basicHTTP: false, clusterNames: [], clusterGroups: [], selectors: []
    } as CredentialSet;

    it.each([
      ['cluster name', { clusterNames: ['c1'] }, true],
      ['cluster group', { clusterGroups: ['g1'] }, true],
      ['label', { selectors: [{ matchLabels: { region: 'eu' } }] }, true],
      ['other label', { selectors: [{ matchLabels: { region: 'us' } }] }, false],
      ['nothing filled in', {}, false],
      ['empty selector row', { selectors: [{ key: 1 }] }, false],
    ])('%s', (_, fields, expected) => {
      expect(setMatches({ ...set, ...fields } as CredentialSet, target)).toBe(expected);
    });
  });

  describe('pullOrder', () => {
    it.each([
      ['eu-staging-01', ['eu-staging', 'eu-mirror', PUSH_ENTRY]],
      ['eu-prod-01', ['eu-mirror', PUSH_ENTRY]],
      ['apac-prod-01', ['apac-mirror', PUSH_ENTRY]],
      ['mgmt-tools', [PUSH_ENTRY]],
    ])('%s gets every matching set in order, then the push registry', (name, expected) => {
      expect(pullOrder(secret(data, FALLBACK_SECRET), cluster(data, name)).map((e) => e.name)).toStrictEqual(expected);
    });

    it('follows the order of the sets in the secret', () => {
      const fallback = secret(data, FALLBACK_SECRET);

      fallback.credentialSets.reverse();

      expect(pullOrder(fallback, cluster(data, 'eu-staging-01')).map((e) => e.name)).toStrictEqual(['eu-mirror', 'eu-staging', PUSH_ENTRY]);
    });
  });

  describe('secretFor', () => {
    it('uses the secret a GitRepo names', () => {
      expect(secretFor(data, data.gitRepos.find((g) => g.name === 'store-pos')!)?.name).toBe('stores-oci');
    });

    it('falls back to the secret called ocistorage', () => {
      expect(secretFor(data, data.gitRepos.find((g) => g.name === 'payments-api')!)?.name).toBe(FALLBACK_SECRET);
    });

    it('returns nothing without that secret, so the bundle stays in etcd', () => {
      data.secrets = data.secrets.filter((s) => s.name !== FALLBACK_SECRET);

      expect(secretFor(data, data.gitRepos.find((g) => g.name === 'payments-api')!)).toBeNull();
      expect(resolveDeployments(data).some((d) => d.gitRepo.name === 'payments-api')).toBe(false);
    });
  });

  describe('resolveDeployment', () => {
    it.each([
      ['payments-api', 'eu-prod-01', 'ready', 'eu-mirror'],
      ['payments-api', 'apac-prod-01', 'fallback', PUSH_ENTRY],
      ['payments-api', 'us-prod-02', 'fallback', PUSH_ENTRY],
      ['monitoring-stack', 'eu-staging-01', 'fallback', 'eu-mirror'],
      ['monitoring-stack', 'mgmt-tools', 'ready', PUSH_ENTRY],
      ['store-pos', 'edge-store-0142', 'retrying', null],
      ['store-pos', 'edge-store-0187', 'failed', null],
      ['store-pos', 'edge-store-0203', 'failed', null],
      ['lab-experiments', 'lab-sandbox', 'failed', null],
    ])('%s on %s is %s, pulled from %s', (gitRepo, clusterName, state, pulledFrom) => {
      const status = deployment(data, gitRepo, clusterName);

      expect(status.state).toBe(state);
      expect(status.pulledFrom?.name ?? null).toBe(pulledFrom);
    });

    it('reports a missing artifact as not found, not as a replication state', () => {
      const status = deployment(data, 'payments-api', 'apac-prod-01');

      expect(status.attempts.map((a) => [a.entry.name, a.result])).toStrictEqual([['apac-mirror', 'notFound'], [PUSH_ENTRY, 'ok']]);
      expect(status.firstFailure?.result).toBe('notFound');
    });

    it('tells credentials apart per set on the same host', () => {
      const status = deployment(data, 'monitoring-stack', 'eu-staging-01');

      expect(status.attempts.map((a) => [a.entry.name, a.result])).toStrictEqual([['eu-staging', 'auth'], ['eu-mirror', 'ok'], [PUSH_ENTRY, null]]);
    });

    it('retries with back-off while no entry has the artifact', () => {
      const status = deployment(data, 'store-pos', 'edge-store-0142');

      expect(status.attempts.map((a) => a.result)).toStrictEqual(['notFound', 'unreachable']);
      expect(status.retry).toStrictEqual(backoff(20));
    });

    it('never treats the push registry as missing the artifact', () => {
      const status = deployment(data, 'payments-api', 'apac-prod-01');

      status.bundle.missingOn['harbor.corp.example.com'] = 1;

      expect(deployment(data, 'payments-api', 'apac-prod-01').attempts[1].result).toBe('ok');
    });
  });

  describe('resolveSecret', () => {
    it.each([
      [FALLBACK_SECRET, 'active', true, ['payments-api', 'monitoring-stack', 'security-baseline', 'ingress-core']],
      ['stores-oci', 'error', false, ['store-pos']],
      ['lab-oci', 'error', false, ['lab-experiments']],
      ['quay-legacy', 'unused', false, []],
    ])('%s is %s', (name, state, isDefault, gitRepos) => {
      const status = resolveSecret(data, secret(data, name), resolveDeployments(data));

      expect(status.state).toBe(state);
      expect(status.isDefault).toBe(isDefault);
      expect(status.gitRepos).toStrictEqual(gitRepos);
    });

    it('counts the deployments that can\'t pull from anything', () => {
      expect(resolveSecret(data, secret(data, 'stores-oci'), resolveDeployments(data)).failing).toBe(2);
    });
  });

  describe('backoff', () => {
    it.each([
      [0.5, 1, 1],
      [4, 3, 4],
      [20, 5, 12],
    ])('after %s min it is on attempt %s, next in %s min', (minutes, attempt, nextMinutes) => {
      expect(backoff(minutes)).toStrictEqual({ attempt, nextMinutes });
    });
  });
});
