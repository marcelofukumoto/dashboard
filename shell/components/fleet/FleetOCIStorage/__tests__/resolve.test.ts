import { scenarioData } from '@shell/components/fleet/FleetOCIStorage/mock';
import { backoff } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import {
  connectionChecks,
  resolveArtifact,
  resolveCluster,
  resolveRegistry,
  routeMatches,
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import { ClusterStatus, OCICluster, OCIStorageData } from '@shell/components/fleet/FleetOCIStorage/types';

function allStatuses(data: OCIStorageData): ClusterStatus[] {
  return data.clusters.map((c) => resolveCluster(data, c));
}

function statusOf(data: OCIStorageData, name: string): ClusterStatus {
  return resolveCluster(data, data.clusters.find((c) => c.name === name)!);
}

describe('fleet OCI storage routing', () => {
  let data: OCIStorageData;

  beforeEach(() => {
    data = scenarioData();
    data.clusters.forEach((cluster) => {
      cluster.appliedPrimary = cluster.appliedPrimary || resolveCluster(data, cluster).chain[0] || null;
    });
  });

  describe('routeMatches', () => {
    const cluster: OCICluster = {
      name: 'c1', labels: { region: 'eu' }, groups: ['g1'], access: {}, defaultAccess: 'ok', lastPullMinutesAgo: 1, appliedPrimary: null
    };
    const route = {
      name: 'r', description: '', clusterNames: [] as string[], clusterGroups: [] as string[], selectors: [] as object[], registries: [], replicationWaitMinutes: 1
    };

    it.each([
      ['cluster name', { clusterNames: ['c1'] }, true],
      ['cluster group', { clusterGroups: ['g1'] }, true],
      ['label', { selectors: [{ matchLabels: { region: 'eu' } }] }, true],
      ['other label', { selectors: [{ matchLabels: { region: 'us' } }] }, false],
      ['nothing filled in', {}, false],
      ['empty selector row', { selectors: [{ key: 1 }] }, false],
    ])('%s', (_, fields, expected) => {
      expect(routeMatches({ ...route, ...fields } as never, cluster)).toBe(expected);
    });
  });

  describe('resolveCluster', () => {
    it.each([
      ['eu-prod-01', 'pulled', 'harbor-eu', 'eu-clusters'],
      ['us-prod-02', 'failover', 'harbor-central', 'us-clusters'],
      ['apac-prod-01', 'waiting', 'harbor-apac', 'apac-clusters'],
      ['eu-staging-01', 'updatePending', 'harbor-central', 'eu-clusters'],
      ['edge-store-0187', 'authFailed', null, 'air-gapped-stores'],
      ['edge-store-0203', 'tlsError', null, 'air-gapped-stores'],
      ['lab-sandbox', 'unreachable', null, 'lab-sandbox'],
      ['mgmt-tools', 'pulled', 'harbor-central', undefined],
    ])('%s is %s, pulling from %s', (name, state, pullingFrom, route) => {
      const status = statusOf(data, name);

      expect(status.state).toBe(state);
      expect(status.pullingFrom).toBe(pullingFrom);
      expect(status.route?.name).toBe(route);
    });

    it('uses the first matching route', () => {
      data.routes.unshift({
        name: 'first', description: '', clusterNames: ['eu-prod-01'], clusterGroups: [], selectors: [], registries: ['quay-us'], replicationWaitMinutes: 10
      });

      expect(statusOf(data, 'eu-prod-01').route?.name).toBe('first');
      expect(statusOf(data, 'eu-prod-02').route?.name).toBe('eu-clusters');
    });

    it('reports no route when nothing matches and the default route is empty', () => {
      data.defaultRegistries = [];

      expect(statusOf(data, 'mgmt-tools').state).toBe('noRoute');
    });

    it('fails over a missing artifact once the replication wait is over', () => {
      data.routes.find((r) => r.name === 'apac-clusters')!.replicationWaitMinutes = 2;

      const status = statusOf(data, 'apac-prod-01');

      expect(status.state).toBe('failover');
      expect(status.targetRegistry).toBe('harbor-central');
      expect(status.attempts[0]).toStrictEqual({
        registry: 'harbor-apac', outcome: 'failed', access: 'notReplicated'
      });
    });

    it('keeps waiting past the replication wait when there is nowhere else to try', () => {
      const route = data.routes.find((r) => r.name === 'apac-clusters')!;

      route.replicationWaitMinutes = 2;
      route.registries = ['harbor-apac'];

      expect(statusOf(data, 'apac-prod-01').state).toBe('waiting');
    });

    it('treats a routing change as pending until the next update', () => {
      data.routes.find((r) => r.name === 'eu-clusters')!.registries = ['harbor-central'];

      const status = statusOf(data, 'eu-prod-01');

      expect(status.state).toBe('updatePending');
      expect(status.pullingFrom).toBe('harbor-eu');
      expect(status.targetRegistry).toBe('harbor-central');
    });

    it('counts artifacts pushed after the last pull as not pulled', () => {
      const status = statusOf(data, 'edge-store-0187');

      expect(status.pulledCount).toBe(1);
      expect(status.pulls.find((p) => p.artifact.bundle === 'store-pos-app')?.state).toBe('failed');
    });
  });

  describe('resolveRegistry', () => {
    const stateOf = (name: string) => resolveRegistry(data, allStatuses(data), data.registries.find((r) => r.name === name)!).state;

    it.each([
      ['harbor-central', 'active'],
      ['harbor-eu', 'active'],
      ['harbor-apac', 'replicating'],
      ['quay-us', 'degraded'],
      ['zot-stores', 'degraded'],
      ['harbor-lab', 'error'],
    ])('%s is %s', (name, state) => {
      expect(stateOf(name)).toBe(state);
    });

    it('is unused when no route lists it', () => {
      data.registries.push({ ...data.registries[1], name: 'spare' });

      expect(stateOf('spare')).toBe('unused');
    });
  });

  describe('resolveArtifact', () => {
    const artifactOf = (bundle: string) => resolveArtifact(data, allStatuses(data), data.artifacts.find((a) => a.bundle === bundle)!);

    it('shows an artifact as replicating while a mirror is missing it', () => {
      const status = artifactOf('payments-api-deployment');

      expect(status.state).toBe('replicating');
      expect(status.registries.find((r) => r.registry === 'harbor-apac')).toStrictEqual({
        registry: 'harbor-apac', availability: 'pending', pulled: 0, total: 2, pendingMinutes: 4
      });
      expect(status.registries.find((r) => r.registry === 'harbor-central')?.availability).toBe('pushed');
    });

    it('shows an artifact as failed when a target can not pull it', () => {
      expect(artifactOf('store-pos-app').state).toBe('failed');
      expect(artifactOf('store-pos-app').pulledCount).toBe(3);
    });

    it('lists only the pinned registry for a pinned artifact', () => {
      const status = artifactOf('security-baseline-policies');

      expect(status.registries.map((r) => r.registry)).toStrictEqual(['harbor-central']);
      expect(status.state).toBe('available');
    });
  });

  describe('connectionChecks', () => {
    const source = () => data.registries.find((r) => r.name === 'harbor-central')!;
    const outcomes = (checks: ReturnType<typeof connectionChecks>) => Object.fromEntries(checks.map((c) => [c.key, c.outcome]));

    it('skips everything after a failed connection', () => {
      expect(outcomes(connectionChecks(source(), 'unreachable', 'controller', true))).toStrictEqual({
        connect: 'error', tls: 'skipped', agentAuth: 'skipped', agentReadOnly: 'skipped', pushAuth: 'skipped', namespace: 'skipped'
      });
    });

    it('warns when agents would receive the push credentials', () => {
      expect(outcomes(connectionChecks({ ...source(), agentUsername: '' }, 'ok', 'controller', true)).agentHasPush).toBe('warning');
    });

    it('reports a rejected login', () => {
      expect(outcomes(connectionChecks(source(), 'auth', 'c1', false)).agentAuth).toBe('error');
    });

    it('does not check push rights from a downstream cluster', () => {
      expect(outcomes(connectionChecks(source(), 'ok', 'c1', false)).pushAuth).toBeUndefined();
    });
  });
});

describe('backoff', () => {
  it.each([
    [1, 1, 1],
    [4, 3, 4],
    [16, 5, 16],
  ])('after %d minutes it is on attempt %d, %d minutes from the next retry', (minutes, attempt, nextMinutes) => {
    expect(backoff(minutes)).toStrictEqual({ attempt, nextMinutes });
  });
});
