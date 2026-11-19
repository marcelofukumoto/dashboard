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
      ['test-k3s', ['eu-staging', 'eu-mirror', PUSH_ENTRY]],
      ['created-dashboard-2', ['eu-mirror', PUSH_ENTRY]],
      ['longhorn', ['apac-mirror', PUSH_ENTRY]],
      ['harvester-11-2', [PUSH_ENTRY]],
    ])('%s gets every matching set in order, then the push registry', (name, expected) => {
      expect(pullOrder(secret(data, FALLBACK_SECRET), cluster(data, name)).map((e) => e.name)).toStrictEqual(expected);
    });

    it('follows the order of the sets in the secret', () => {
      const fallback = secret(data, FALLBACK_SECRET);

      fallback.credentialSets.reverse();

      expect(pullOrder(fallback, cluster(data, 'test-k3s')).map((e) => e.name)).toStrictEqual(['eu-mirror', 'eu-staging', PUSH_ENTRY]);
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
      ['payments-api', 'created-dashboard-2', 'ready', 'eu-mirror'],
      ['payments-api', 'longhorn', 'fallback', PUSH_ENTRY],
      ['payments-api', 'rolestest', 'fallback', PUSH_ENTRY],
      ['monitoring-stack', 'test-k3s', 'fallback', 'eu-mirror'],
      ['monitoring-stack', 'longhorn', 'ready', 'apac-mirror'],
      ['store-pos', 'harvester-11-2', 'retrying', null],
      ['store-pos', 'harvester-118', 'failed', null],
      ['store-pos', 'harvester-test', 'failed', null],
      ['lab-experiments', 'test-k3s', 'failed', null],
    ])('%s on %s is %s, pulled from %s', (gitRepo, clusterName, state, pulledFrom) => {
      const status = deployment(data, gitRepo, clusterName);

      expect(status.state).toBe(state);
      expect(status.pulledFrom?.name ?? null).toBe(pulledFrom);
    });

    it('reports a missing artifact as not found, not as a replication state', () => {
      const status = deployment(data, 'payments-api', 'longhorn');

      expect(status.attempts.map((a) => [a.entry.name, a.result])).toStrictEqual([['apac-mirror', 'notFound'], [PUSH_ENTRY, 'ok']]);
      expect(status.firstFailure?.result).toBe('notFound');
    });

    it('tells credentials apart per set on the same host', () => {
      const status = deployment(data, 'monitoring-stack', 'test-k3s');

      expect(status.attempts.map((a) => [a.entry.name, a.result])).toStrictEqual([['eu-staging', 'auth'], ['eu-mirror', 'ok'], [PUSH_ENTRY, null]]);
    });

    it('retries with back-off while no entry has the artifact', () => {
      const status = deployment(data, 'store-pos', 'harvester-11-2');

      expect(status.attempts.map((a) => a.result)).toStrictEqual(['notFound', 'unreachable']);
      expect(status.retry).toStrictEqual(backoff(20));
    });

    it('never treats the push registry as missing the artifact', () => {
      const status = deployment(data, 'payments-api', 'longhorn');

      status.bundle.missingOn['harbor.corp.example.com'] = 1;

      expect(deployment(data, 'payments-api', 'longhorn').attempts[1].result).toBe('ok');
    });
  });

  describe('resolveSecret', () => {
    it.each([
      [FALLBACK_SECRET, 'active', true, ['payments-api', 'monitoring-stack']],
      ['stores-oci', 'active', false, ['store-pos']],
      ['lab-oci', 'active', false, ['lab-experiments']],
      ['quay-legacy', 'unused', false, []],
    ])('%s is %s', (name, state, isDefault, gitRepos) => {
      const status = resolveSecret(data, secret(data, name));

      expect(status.state).toBe(state);
      expect(status.isDefault).toBe(isDefault);
      expect(status.gitRepos).toStrictEqual(gitRepos);
    });

    it('stays active while its deployments fail, because their state belongs to the workloads', () => {
      expect(resolveDeployments(data).filter((d) => d.secret.name === 'stores-oci' && d.state === 'failed')).toHaveLength(2);
      expect(resolveSecret(data, secret(data, 'stores-oci')).state).toBe('active');
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
