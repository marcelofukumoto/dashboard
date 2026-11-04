import {
  OCIArtifact, OCICluster, OCIRegistry, OCIStorageData, RegistryAccess
} from '@shell/components/fleet/FleetOCIStorage/types';

export const SCENARIO_WORKSPACE = 'fleet-default';

const MIB = 1024 * 1024;

const registry = (fields: Partial<OCIRegistry> & Pick<OCIRegistry, 'name' | 'host' | 'namespace'>): OCIRegistry => ({
  description:        '',
  role:               'mirror',
  username:           '',
  hasPassword:        false,
  agentUsername:      '',
  hasAgentPassword:   false,
  tlsMode:            'system',
  caBundle:           '',
  basicHTTP:          false,
  controllerAccess:   'ok',
  lastPushMinutesAgo: null,
  ...fields,
});

const regionalCluster = (name: string, region: string, env: string, lastPullMinutesAgo: number, access: Record<string, RegistryAccess> = {}): OCICluster => ({
  name,
  labels:         { region, env },
  groups:         [],
  access:         { 'zot-stores': 'unreachable', ...access },
  defaultAccess:  'ok',
  lastPullMinutesAgo,
  appliedPrimary: null,
});

const storeCluster = (name: string, access: RegistryAccess, lastPullMinutesAgo: number): OCICluster => ({
  name,
  labels:         { site: 'store', airgap: 'true' },
  groups:         ['airgap-stores'],
  access:         { 'zot-stores': access },
  defaultAccess:  'unreachable',
  lastPullMinutesAgo,
  appliedPrimary: 'zot-stores',
});

const PROD = ['eu-prod-01', 'eu-prod-02', 'eu-prod-03', 'apac-prod-01', 'apac-prod-02', 'us-prod-01', 'us-prod-02', 'us-prod-03'];
const STORES = ['edge-store-0142', 'edge-store-0144', 'edge-store-0145', 'edge-store-0187', 'edge-store-0203'];

const artifact = (fields: Partial<OCIArtifact> & Pick<OCIArtifact, 'bundle' | 'source' | 'id' | 'sizeBytes' | 'pushedMinutesAgo' | 'clusters'>): OCIArtifact => ({
  sourceKind:     'GitRepo',
  pinnedRegistry: null,
  pendingOn:      {},
  ...fields,
});

export function emptyData(): OCIStorageData {
  return {
    registries:        [],
    routes:            [],
    defaultRegistries: [],
    clusters:          [],
    artifacts:         [],
    isScenario:        false,
  };
}

export function scenarioData(): OCIStorageData {
  return {
    isScenario: true,
    registries: [
      registry({
        name:               'harbor-central',
        description:        'Harbor at the management site',
        host:               'harbor.corp.example.com',
        namespace:          'fleet/bundles',
        role:               'source',
        username:           'robot$fleet-push',
        hasPassword:        true,
        agentUsername:      'robot$fleet-pull',
        hasAgentPassword:   true,
        tlsMode:            'customCA',
        caBundle:           '-----BEGIN CERTIFICATE-----\n(corporate root CA)\n-----END CERTIFICATE-----',
        lastPushMinutesAgo: 4,
      }),
      registry({
        name:             'harbor-eu',
        description:      'Frankfurt mirror',
        host:             'harbor.eu-west.example.com',
        namespace:        'mirror/fleet-bundles',
        agentUsername:    'robot$eu-fleet-pull',
        hasAgentPassword: true,
      }),
      registry({
        name:             'harbor-apac',
        description:      'Singapore mirror',
        host:             'registry.apac.example.com',
        namespace:        'cd/fleet',
        agentUsername:    'robot$apac-fleet',
        hasAgentPassword: true,
        tlsMode:          'customCA',
        caBundle:         '-----BEGIN CERTIFICATE-----\n(APAC issuing CA)\n-----END CERTIFICATE-----',
      }),
      registry({
        name:             'quay-us',
        description:      'Virginia mirror',
        host:             'quay.us-east.example.com',
        namespace:        'platform/fleet',
        agentUsername:    'platform+fleet_ro',
        hasAgentPassword: true,
      }),
      registry({
        name:             'zot-stores',
        description:      'Local registry in each store',
        host:             'registry.store.local:5000',
        namespace:        'fleet',
        agentUsername:    'fleet-ro',
        hasAgentPassword: true,
        tlsMode:          'customCA',
        caBundle:         '-----BEGIN CERTIFICATE-----\n(store fleet CA)\n-----END CERTIFICATE-----',
        controllerAccess: 'unreachable',
      }),
      registry({
        name:        'harbor-lab',
        description: 'Self-signed lab registry',
        host:        'harbor.lab.example.com:8443',
        namespace:   'sandbox',
        tlsMode:     'skipVerify',
      }),
    ],

    routes: [
      {
        name:                   'eu-clusters',
        description:            'Everything in the EU regions',
        clusterNames:           [],
        clusterGroups:          [],
        selectors:              [{ key: 0, matchLabels: { region: 'eu' } }],
        registries:             ['harbor-eu', 'harbor-central'],
        replicationWaitMinutes: 10,
      },
      {
        name:                   'apac-clusters',
        description:            'Everything in the APAC regions',
        clusterNames:           [],
        clusterGroups:          [],
        selectors:              [{ key: 0, matchLabels: { region: 'apac' } }],
        registries:             ['harbor-apac', 'harbor-central'],
        replicationWaitMinutes: 15,
      },
      {
        name:                   'us-clusters',
        description:            'Everything in the US regions',
        clusterNames:           [],
        clusterGroups:          [],
        selectors:              [{ key: 0, matchLabels: { region: 'us' } }],
        registries:             ['quay-us', 'harbor-central'],
        replicationWaitMinutes: 10,
      },
      {
        name:                   'air-gapped-stores',
        description:            'Stores have no route to any central registry',
        clusterNames:           [],
        clusterGroups:          ['airgap-stores'],
        selectors:              [],
        registries:             ['zot-stores'],
        replicationWaitMinutes: 30,
      },
      {
        name:                   'lab-sandbox',
        description:            '',
        clusterNames:           ['lab-sandbox'],
        clusterGroups:          [],
        selectors:              [],
        registries:             ['harbor-lab'],
        replicationWaitMinutes: 10,
      },
    ],

    defaultRegistries: ['harbor-central'],

    clusters: [
      regionalCluster('eu-prod-01', 'eu', 'prod', 3),
      regionalCluster('eu-prod-02', 'eu', 'prod', 3),
      regionalCluster('eu-prod-03', 'eu', 'prod', 3),
      { ...regionalCluster('eu-staging-01', 'eu', 'staging', 340), appliedPrimary: 'harbor-central' },
      regionalCluster('apac-prod-01', 'apac', 'prod', 340),
      regionalCluster('apac-prod-02', 'apac', 'prod', 340),
      regionalCluster('us-prod-01', 'us', 'prod', 3),
      regionalCluster('us-prod-02', 'us', 'prod', 3, { 'quay-us': 'unreachable' }),
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
        access:             { 'zot-stores': 'unreachable' },
        defaultAccess:      'ok',
        lastPullMinutesAgo: 339,
        appliedPrimary:     null,
      },
      {
        name:               'lab-sandbox',
        labels:             { env: 'lab' },
        groups:             [],
        access:             { 'harbor-lab': 'unreachable', 'zot-stores': 'unreachable' },
        defaultAccess:      'ok',
        lastPullMinutesAgo: null,
        appliedPrimary:     'harbor-lab',
      },
    ],

    artifacts: [
      artifact({
        bundle:           'payments-api-deployment',
        source:           'payments-api',
        id:               's-4f1d7ab2c90e6b3358aa17c4d2e09f6163bc8e7145d0a92fb7316ce08d4a1b5',
        sizeBytes:        2.6 * MIB,
        pushedMinutesAgo: 4,
        clusters:         PROD,
        pendingOn:        { 'harbor-apac': 4 },
      }),
      artifact({
        bundle:           'store-pos-app',
        source:           'store-pos',
        id:               's-9ac03e51d7b2486f0e1dd3a95c7740be26f18a3c6d49e07b15a2fc8d3e6b071',
        sizeBytes:        6.7 * MIB,
        pushedMinutesAgo: 95,
        clusters:         STORES,
      }),
      artifact({
        bundle:           'monitoring-stack-grafana',
        source:           'monitoring-stack',
        id:               's-1b7e92c4a06d3f58e2c17ab940d6638f51ce07d2ba948c6e3f105d7a82c6e49',
        sizeBytes:        8.4 * MIB,
        pushedMinutesAgo: 340,
        clusters:         [...PROD, 'eu-staging-01', 'mgmt-tools'],
      }),
      artifact({
        bundle:           'monitoring-stack-prometheus',
        source:           'monitoring-stack',
        id:               's-d3506ea18f2c79b40c6ae513d7f0829b64e1a7c35d9f28b06c174ea9d30b8f2',
        sizeBytes:        5.1 * MIB,
        pushedMinutesAgo: 340,
        clusters:         [...PROD, 'eu-staging-01', 'mgmt-tools'],
      }),
      artifact({
        bundle:           'security-baseline-policies',
        source:           'security-baseline',
        id:               's-72c8fd0316ab94e5d07b2c1e8f36a4d95b01ce7a3f6682d4e9a0b7c5138fd26',
        sizeBytes:        3.2 * MIB,
        pushedMinutesAgo: 720,
        clusters:         PROD.filter((c) => !c.startsWith('apac')),
        pinnedRegistry:   'harbor-central',
      }),
      artifact({
        bundle:           'ingress-core-traefik',
        source:           'ingress-core',
        id:               's-a60e47d2b5c1938f7e24d06bc8a1f37592d4ec60b1a78f3c9e5d2074b6c183a',
        sizeBytes:        1.9 * MIB,
        pushedMinutesAgo: 1500,
        clusters:         [...PROD, 'eu-staging-01', ...STORES, 'mgmt-tools', 'lab-sandbox'],
      }),
    ],
  };
}
