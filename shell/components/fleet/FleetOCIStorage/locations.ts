import { FLEET } from '@shell/config/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';

// Where the Fleet pages for the scenario's objects are, for links from the prototype and for the guide

export const OCI_STORAGE_ROUTE = 'c-cluster-fleet-oci-storage';
export const SECRET_ROUTE = 'c-cluster-fleet-oci-storage-secret-id';
export const APPLICATIONS_ROUTE = 'c-cluster-fleet-application';
export const GIT_REPO_ROUTE = 'c-cluster-fleet-application-resource-namespace-id';
export const RESOURCE_ROUTE = 'c-cluster-product-resource-namespace-id';

export const secretLocation = (name: string) => ({ name: SECRET_ROUTE, params: { cluster: BLANK_CLUSTER, id: name } });

export const gitRepoLocation = (name: string, hash = '') => ({
  name:   GIT_REPO_ROUTE,
  params: {
    cluster: BLANK_CLUSTER, resource: FLEET.GIT_REPO, namespace: SCENARIO_WORKSPACE, id: name
  },
  hash,
});

export const bundleLocation = (name: string, hash = '') => ({
  name:   RESOURCE_ROUTE,
  params: {
    cluster: BLANK_CLUSTER, product: 'fleet', resource: FLEET.BUNDLE, namespace: SCENARIO_WORKSPACE, id: name
  },
  hash,
});

export const fleetClusterLocation = (fleetName: string, hash = '') => ({
  name:   RESOURCE_ROUTE,
  params: {
    cluster: BLANK_CLUSTER, product: 'fleet', resource: FLEET.CLUSTER, namespace: SCENARIO_WORKSPACE, id: fleetName
  },
  hash,
});
