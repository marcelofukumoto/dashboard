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

const regionalCluster = (name: string, region: string, env: string, lastPullMinutesAgo: number, reach: Record<string, PullResult> = {}): OCICluster => ({
  name,
  labels:       { region, env },
  groups:       [],
  reach:        { [STORE]: 'unreachable', ...reach },
  defaultReach: 'ok',
  lastPullMinutesAgo,
});

// Stores reach only their local registry
const storeCluster = (name: string, local: PullResult, lastPullMinutesAgo: number): OCICluster => ({
  name,
  labels:       { site: 'store', airgap: 'true' },
  groups:       ['airgap-stores'],
  reach:        { [STORE]: local },
  defaultReach: 'unreachable',
  lastPullMinutesAgo,
});

const bundle = (name: string, artifactId: string, pushedMinutesAgo: number, missingOn: Record<string, number> = {}): OCIBundle => ({
  name, artifactId, pushedMinutesAgo, missingOn
});

const PROD = ['eu-prod-01', 'eu-prod-02', 'eu-prod-03', 'apac-prod-01', 'apac-prod-02', 'us-prod-01', 'us-prod-02', 'us-prod-03'];
const STORES = ['edge-store-0142', 'edge-store-0144', 'edge-store-0145', 'edge-store-0187', 'edge-store-0203'];

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
            clusterGroups:    ['airgap-stores'],
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
        clusters: PROD,
        bundles:  [bundle('payments-api-deployment', 's-4f1d7ab2c90e6b3358aa17c4d2e09f6163bc8e7145d0a92fb7316ce08d4a1b5', 4, { [APAC]: 4 })],
      },
      {
        name:     'monitoring-stack',
        secret:   null,
        clusters: [...PROD, 'eu-staging-01', 'mgmt-tools'],
        bundles:  [
          bundle('monitoring-stack-grafana', 's-1b7e92c4a06d3f58e2c17ab940d6638f51ce07d2ba948c6e3f105d7a82c6e49', 340),
          bundle('monitoring-stack-prometheus', 's-d3506ea18f2c79b40c6ae513d7f0829b64e1a7c35d9f28b06c174ea9d30b8f2', 340),
        ],
      },
      {
        name:     'security-baseline',
        secret:   null,
        clusters: PROD.filter((c) => !c.startsWith('apac')),
        bundles:  [bundle('security-baseline-policies', 's-72c8fd0316ab94e5d07b2c1e8f36a4d95b01ce7a3f6682d4e9a0b7c5138fd26', 720)],
      },
      {
        name:     'ingress-core',
        secret:   null,
        clusters: [...PROD, 'eu-staging-01', 'mgmt-tools'],
        bundles:  [bundle('ingress-core-traefik', 's-a60e47d2b5c1938f7e24d06bc8a1f37592d4ec60b1a78f3c9e5d2074b6c183a', 1500)],
      },
      {
        name:     'store-pos',
        secret:   'stores-oci',
        clusters: STORES,
        bundles:  [bundle('store-pos-app', 's-9ac03e51d7b2486f0e1dd3a95c7740be26f18a3c6d49e07b15a2fc8d3e6b071', 20, { [STORE]: 20 })],
      },
      {
        name:     'lab-experiments',
        secret:   'lab-oci',
        clusters: ['lab-sandbox'],
        bundles:  [bundle('lab-experiments-app', 's-e31b07c95d4a26f8b1c0e97d3a5f6248c1d09b7e3a52f64c8d1e0a97b3f52c6', 90)],
      },
    ],

    clusters: [
      regionalCluster('eu-prod-01', 'eu', 'prod', 3),
      regionalCluster('eu-prod-02', 'eu', 'prod', 3),
      regionalCluster('eu-prod-03', 'eu', 'prod', 3),
      regionalCluster('eu-staging-01', 'eu', 'staging', 340, { 'eu-staging': 'auth' }),
      regionalCluster('apac-prod-01', 'apac', 'prod', 4),
      regionalCluster('apac-prod-02', 'apac', 'prod', 4),
      regionalCluster('us-prod-01', 'us', 'prod', 3),
      regionalCluster('us-prod-02', 'us', 'prod', 3, { [US]: 'unreachable' }),
      regionalCluster('us-prod-03', 'us', 'prod', 3),
      storeCluster('edge-store-0142', 'ok', 94),
      storeCluster('edge-store-0144', 'ok', 94),
      storeCluster('edge-store-0145', 'ok', 94),
      storeCluster('edge-store-0187', 'auth', 1499),
      storeCluster('edge-store-0203', 'tls', 1499),
      {
        name:               'mgmt-tools',
        labels:             {},
        groups:             [],
        reach:              { [STORE]: 'unreachable' },
        defaultReach:       'ok',
        lastPullMinutesAgo: 339,
      },
      {
        name:               'lab-sandbox',
        labels:             { env: 'lab' },
        groups:             [],
        reach:              { [LAB]: 'unreachable', [STORE]: 'unreachable' },
        defaultReach:       'ok',
        lastPullMinutesAgo: null,
      },
    ],
  };
}
