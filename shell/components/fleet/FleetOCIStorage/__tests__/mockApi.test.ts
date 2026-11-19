import { scenarioData } from '@shell/components/fleet/FleetOCIStorage/mock';
import {
  labelCluster, mockDetail, mockFleetObjects, parsePath, patchResponse
} from '@shell/components/fleet/FleetOCIStorage/mockApi';
import type { SteveObject } from '@shell/components/fleet/FleetOCIStorage/mockApi';
import { OCIStorageData } from '@shell/components/fleet/FleetOCIStorage/types';

const cluster = (name: string, namespace = 'fleet-default'): SteveObject => ({
  id:       `${ namespace }/${ name }`,
  type:     'fleet.cattle.io.cluster',
  metadata: {
    name, namespace, labels: { existing: 'yes' }
  }
});

describe('fleet OCI storage API mock', () => {
  let data: OCIStorageData;

  beforeEach(() => {
    data = scenarioData();
  });

  describe('parsePath', () => {
    it.each([
      ['/v1/fleet.cattle.io.gitrepos?exclude=metadata.managedFields', {
        plural: 'fleet.cattle.io.gitrepos', namespace: undefined, name: undefined
      }],
      ['https://rancher.example.com/v1/fleet.cattle.io.bundles/fleet-default', {
        plural: 'fleet.cattle.io.bundles', namespace: 'fleet-default', name: undefined
      }],
      ['/v1/fleet.cattle.io.gitrepos/fleet-default/store-pos', {
        plural: 'fleet.cattle.io.gitrepos', namespace: 'fleet-default', name: 'store-pos'
      }],
      ['/v1/secrets/fleet-default/ocistorage', null],
      ['/v3/clusters', null],
    ])('%s', (url, expected) => {
      expect(parsePath(url)).toStrictEqual(expected);
    });
  });

  describe('mockFleetObjects', () => {
    it('makes a GitRepo per scenario GitRepo, a Bundle per bundle and a BundleDeployment per bundle and cluster', () => {
      const objects = mockFleetObjects(data);

      expect(objects['fleet.cattle.io.gitrepo'].map((o) => o.id)).toStrictEqual([
        'fleet-default/payments-api', 'fleet-default/monitoring-stack', 'fleet-default/store-pos', 'fleet-default/lab-experiments',
      ]);
      expect(objects['fleet.cattle.io.bundle']).toHaveLength(5);
      expect(objects['fleet.cattle.io.bundledeployment']).toHaveLength(15);
    });

    it('labels BundleDeployments the way the Bundle page finds them', () => {
      const bd = mockFleetObjects(data)['fleet.cattle.io.bundledeployment'].find((o) => o.metadata.name === 'store-pos-app' && o.metadata.labels?.['fleet.cattle.io/cluster'] === 'c-fwtnp') as SteveObject;

      expect(bd.metadata.labels).toStrictEqual(expect.objectContaining({
        'fleet.cattle.io/bundle-name':       'store-pos-app',
        'fleet.cattle.io/bundle-namespace':  'fleet-default',
        'fleet.cattle.io/cluster-namespace': 'fleet-default',
      }));
      expect((bd.metadata.state as { name: string }).name).toBe('wait applied');
    });

    it('rolls failing pulls up into the GitRepo state, as Fleet words it', () => {
      const gitRepo = mockFleetObjects(data)['fleet.cattle.io.gitrepo'].find((o) => o.metadata.name === 'store-pos') as SteveObject;
      const state = gitRepo.metadata.state as { name: string, error: boolean, message: string };

      expect(state.name).toBe('error');
      expect(state.error).toBe(true);
      expect(state.message).toMatch(/^ErrApplied\(2\)/);
      expect((gitRepo.spec as { ociRegistrySecret?: string }).ociRegistrySecret).toBe('stores-oci');
    });

    it('keeps a GitRepo whose pulls all fell back active, because its bundles deployed', () => {
      const gitRepo = mockFleetObjects(data)['fleet.cattle.io.gitrepo'].find((o) => o.metadata.name === 'payments-api') as SteveObject;

      expect((gitRepo.metadata.state as { name: string }).name).toBe('active');
      expect((gitRepo.spec as { ociRegistrySecret?: string }).ociRegistrySecret).toBeUndefined();
    });

    it('carries the proposed pull report on each BundleDeployment', () => {
      const bd = mockFleetObjects(data)['fleet.cattle.io.bundledeployment'].find((o) => o.metadata.name === 'monitoring-stack-grafana' && o.metadata.labels?.['fleet.cattle.io/cluster'] === 'c-p2bmg') as SteveObject;
      const report = (bd.status as { ociStorage: { pulledFrom: string, attempts: { entry: string, result: string }[] } }).ociStorage;

      expect(report.pulledFrom).toBe('eu-mirror');
      expect(report.attempts.map((a) => [a.entry, a.result])).toStrictEqual([['eu-staging', 'auth'], ['eu-mirror', 'ok']]);
    });

    it('gives the mocks no update or remove links, so the UI offers no way to change them', () => {
      Object.values(mockFleetObjects(data)).flat().forEach((o) => {
        expect(Object.keys(o.links as object)).toStrictEqual(['self', 'view']);
      });
    });
  });

  describe('mockDetail', () => {
    it('answers for a mock object', () => {
      expect(mockDetail('/v1/fleet.cattle.io.bundles/fleet-default/payments-api-deployment', data)?.id).toBe('fleet-default/payments-api-deployment');
    });

    it('leaves real objects and lists to the server', () => {
      expect(mockDetail('/v1/fleet.cattle.io.gitrepos/fleet-local/zz-labels-gitrepo', data)).toBeNull();
      expect(mockDetail('/v1/fleet.cattle.io.gitrepos', data)).toBeNull();
    });
  });

  describe('patchResponse', () => {
    it('adds the mocks to a list, once', () => {
      const body = {
        data: [{
          id: 'fleet-local/zz-labels-gitrepo', type: 'fleet.cattle.io.gitrepo', metadata: { name: 'zz-labels-gitrepo', namespace: 'fleet-local' }
        }]
      };

      patchResponse('/v1/fleet.cattle.io.gitrepos', body, data);
      patchResponse('/v1/fleet.cattle.io.gitrepos', body, data);

      expect(body.data.map((o) => o.id)).toStrictEqual([
        'fleet-local/zz-labels-gitrepo', 'fleet-default/payments-api', 'fleet-default/monitoring-stack', 'fleet-default/store-pos', 'fleet-default/lab-experiments',
      ]);
    });

    it('adds nothing to another namespace\'s list', () => {
      const body = { data: [] };

      patchResponse('/v1/fleet.cattle.io.gitrepos/fleet-local', body, data);

      expect(body.data).toStrictEqual([]);
    });

    it('labels the scenario\'s clusters in a cluster list', () => {
      const body = { data: [cluster('c-p2bmg'), cluster('local', 'fleet-local')] };

      patchResponse('/v1/fleet.cattle.io.clusters', body, data);

      expect(body.data[0].metadata.labels).toStrictEqual({
        existing: 'yes', region: 'eu', env: 'staging'
      });
      expect(body.data[1].metadata.labels).toStrictEqual({ existing: 'yes' });
    });
  });

  describe('counts', () => {
    it('adds the mocks to the side nav counts, with their errors', () => {
      const body = { data: [{ counts: { 'fleet.cattle.io.gitrepo': { summary: { count: 1 }, namespaces: { 'fleet-local': { count: 1 } } } } }] };

      patchResponse('/v1/counts', body, data);
      const gitRepos = body.data[0].counts['fleet.cattle.io.gitrepo'] as { summary: { count: number, errors?: number }, namespaces: Record<string, { count: number }> };

      expect(gitRepos.summary.count).toBe(5);
      expect(gitRepos.summary.errors).toBe(2);
      expect(gitRepos.namespaces['fleet-default'].count).toBe(4);
      expect(gitRepos.namespaces['fleet-local'].count).toBe(1);
      expect((body.data[0].counts as Record<string, unknown>)['fleet.cattle.io.bundle']).toBeDefined();
    });
  });

  describe('labelCluster', () => {
    it('leaves clusters outside the scenario alone', () => {
      const other = cluster('not-in-the-scenario');

      labelCluster(other, data);

      expect(other.metadata.labels).toStrictEqual({ existing: 'yes' });
    });
  });
});
