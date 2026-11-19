import {
  CredentialSet, OCIBundle, OCICluster, OCIStorageData, PullResult, PushRegistry
} from '@shell/components/fleet/FleetOCIStorage/types';

export const SCENARIO_WORKSPACE = 'fleet-default';

const CENTRAL = 'harbor.corp.example.com';
const EU = 'harbor.eu-west.example.com';
const APAC = 'registry.apac.example.com';
const US = 'quay.us-east.example.com';
const STORE = 'registry.store.local:5000';
const LAB = 'harbor.lab.example.com:8443';

const push = (fields: Partial<PushRegistry> & Pick<PushRegistry, 'host' | 'namespace'>): PushRegistry => ({
  username:         '',
  hasPassword:      false,
  agentUsername:    '',
  hasAgentPassword: false,
  tlsMode:          'system',
  caBundle:         '',
  basicHTTP:        false,
  ...fields,
});

const set = (fields: Partial<CredentialSet> & Pick<CredentialSet, 'name' | 'host' | 'namespace'>): CredentialSet => ({
  agentUsername:    '',
  hasAgentPassword: false,
  tlsMode:          'system',
  caBundle:         '',
  basicHTTP:        false,
  clusterNames:     [],
  clusterGroups:    [],
  selectors:        [],
  ...fields,
});

// The scenario runs on the real fleet-default clusters of the shared Rancher; the API mock gives them these labels.
// `fleetName` is the Fleet Cluster object's name, which differs from the display name for imported clusters.
const regionalCluster = (name: string, fleetName: string, region: string, env: string, reach: Record<string, PullResult> = {}): OCICluster => ({
  name,
  fleetName,
  labels:             { region, env },
  groups:             [],
  reach:              { [STORE]: 'unreachable', ...reach },
  defaultReach:       'ok',
  lastPullMinutesAgo: 3,
});

// Stores reach only their local registry
const storeCluster = (name: string, fleetName: string, local: PullResult): OCICluster => ({
  name,
  fleetName,
  labels:             { site: 'store' },
  groups:             [],
  reach:              { [STORE]: local },
  defaultReach:       'unreachable',
  lastPullMinutesAgo: 94,
});

const bundle = (name: string, artifactId: string, pushedMinutesAgo: number, missingOn: Record<string, number> = {}): OCIBundle => ({
  name, artifactId, pushedMinutesAgo, missingOn
});

const PROD = ['created-dashboard-2', 'longhorn', 'rolestest'];
const REGIONAL = ['created-dashboard-2', 'test-k3s', 'longhorn', 'rolestest'];
const STORES = ['harvester-11-2', 'harvester-118', 'harvester-test'];
const EXAMPLES = 'https://github.com/rancher/fleet-examples';

export function emptyData(): OCIStorageData {
  return {
    secrets:    [],
    gitRepos:   [],
    clusters:   [],
    isScenario: false,
  };
}

export function scenarioData(): OCIStorageData {
  return {
    isScenario: true,
    secrets:    [
      {
        name:        'ocistorage',
        description: 'Harbor at the management site, with regional mirrors',
        ageMinutes:  60 * 24 * 40,
        push:        push({
          host:             CENTRAL,
          namespace:        'fleet/bundles',
          username:         'robot$fleet-push',
          hasPassword:      true,
          agentUsername:    'robot$fleet-pull',
          hasAgentPassword: true,
          tlsMode:          'customCA',
          caBundle:         '-----BEGIN CERTIFICATE-----\n(corporate root CA)\n-----END CERTIFICATE-----',
        }),
        credentialSets: [
          set({
            name:             'eu-staging',
            host:             EU,
            namespace:        'staging/fleet-bundles',
            agentUsername:    'robot$eu-staging-pull',
            hasAgentPassword: true,
            selectors:        [{ key: 0, matchLabels: { region: 'eu', env: 'staging' } }],
          }),
          set({
            name:             'eu-mirror',
            host:             EU,
            namespace:        'mirror/fleet-bundles',
            agentUsername:    'robot$eu-fleet-pull',
            hasAgentPassword: true,
            selectors:        [{ key: 0, matchLabels: { region: 'eu' } }],
          }),
          set({
            name:             'apac-mirror',
            host:             APAC,
            namespace:        'cd/fleet',
            agentUsername:    'robot$apac-fleet',
            hasAgentPassword: true,
            tlsMode:          'customCA',
            caBundle:         '-----BEGIN CERTIFICATE-----\n(APAC issuing CA)\n-----END CERTIFICATE-----',
            selectors:        [{ key: 0, matchLabels: { region: 'apac' } }],
          }),
          set({
            name:             'us-mirror',
            host:             US,
            namespace:        'platform/fleet',
            agentUsername:    'platform+fleet_ro',
            hasAgentPassword: true,
            selectors:        [{ key: 0, matchLabels: { region: 'us' } }],
          }),
        ],
      },
      {
        name:        'stores-oci',
        description: 'Air-gapped stores pull from their local registry',
        ageMinutes:  60 * 24 * 12,
        push:        push({
          host:             CENTRAL,
          namespace:        'stores/bundles',
          username:         'robot$stores-push',
          hasPassword:      true,
          agentUsername:    'robot$stores-pull',
          hasAgentPassword: true,
          tlsMode:          'customCA',
          caBundle:         '-----BEGIN CERTIFICATE-----\n(corporate root CA)\n-----END CERTIFICATE-----',
        }),
        credentialSets: [
          set({
            name:             'store-local',
            host:             STORE,
            namespace:        'fleet',
            agentUsername:    'fleet-ro',
            hasAgentPassword: true,
            tlsMode:          'customCA',
            caBundle:         '-----BEGIN CERTIFICATE-----\n(store fleet CA)\n-----END CERTIFICATE-----',
            selectors:        [{ key: 0, matchLabels: { site: 'store' } }],
          }),
        ],
      },
      {
        name:        'lab-oci',
        description: 'Self-signed lab registry',
        ageMinutes:  60 * 24 * 3,
        push:        push({
          host:        LAB,
          namespace:   'sandbox',
          username:    'admin',
          hasPassword: true,
          tlsMode:     'skipVerify',
        }),
        credentialSets: [],
      },
      {
        name:        'quay-legacy',
        description: 'Before the move to Harbor',
        ageMinutes:  60 * 24 * 300,
        push:        push({
          host:             US,
          namespace:        'legacy/fleet',
          username:         'legacy+push',
          hasPassword:      true,
          agentUsername:    'legacy+pull',
          hasAgentPassword: true,
        }),
        credentialSets: [],
      },
    ],

    gitRepos: [
      {
        name:     'payments-api',
        secret:   null,
        repo:     EXAMPLES,
        paths:    ['single-cluster/helm'],
        targets:  [{ clusterSelector: { matchLabels: { env: 'prod' } } }],
        clusters: PROD,
        bundles:  [bundle('payments-api-deployment', 's-4f1d7ab2c90e6b3358aa17c4d2e09f6163bc8e7145d0a92fb7316ce08d4a1b5', 4, { [APAC]: 4 })],
      },
      {
        name:     'monitoring-stack',
        secret:   null,
        repo:     EXAMPLES,
        paths:    ['multi-cluster/helm-kustomize'],
        targets:  [{ clusterSelector: { matchExpressions: [{ key: 'region', operator: 'Exists' }] } }],
        clusters: REGIONAL,
        bundles:  [
          bundle('monitoring-stack-grafana', 's-1b7e92c4a06d3f58e2c17ab940d6638f51ce07d2ba948c6e3f105d7a82c6e49', 340),
          bundle('monitoring-stack-prometheus', 's-d3506ea18f2c79b40c6ae513d7f0829b64e1a7c35d9f28b06c174ea9d30b8f2', 340),
        ],
      },
      {
        name:     'store-pos',
        secret:   'stores-oci',
        repo:     EXAMPLES,
        paths:    ['simple'],
        targets:  [{ clusterSelector: { matchLabels: { site: 'store' } } }],
        clusters: STORES,
        bundles:  [bundle('store-pos-app', 's-9ac03e51d7b2486f0e1dd3a95c7740be26f18a3c6d49e07b15a2fc8d3e6b071', 20, { [STORE]: 20 })],
      },
      {
        name:     'lab-experiments',
        secret:   'lab-oci',
        repo:     EXAMPLES,
        paths:    ['single-cluster/manifests'],
        targets:  [{ clusterSelector: { matchLabels: { env: 'staging' } } }],
        clusters: ['test-k3s'],
        bundles:  [bundle('lab-experiments-app', 's-e31b07c95d4a26f8b1c0e97d3a5f6248c1d09b7e3a52f64c8d1e0a97b3f52c6', 90)],
      },
    ],

    clusters: [
      regionalCluster('created-dashboard-2', 'created-dashboard-2', 'eu', 'prod'),
      regionalCluster('test-k3s', 'c-p2bmg', 'eu', 'staging', { 'eu-staging': 'auth', [LAB]: 'unreachable' }),
      regionalCluster('longhorn', 'longhorn', 'apac', 'prod'),
      regionalCluster('rolestest', 'c-bxz84', 'us', 'prod', { [US]: 'unreachable' }),
      storeCluster('harvester-11-2', 'c-fwtnp', 'ok'),
      storeCluster('harvester-118', 'harvester-118', 'auth'),
      storeCluster('harvester-test', 'c-w2f7r', 'tls'),
    ],
  };
}
