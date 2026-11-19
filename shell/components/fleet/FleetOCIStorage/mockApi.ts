import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import { reference, resolveDeployments } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { sampleWorkspaceData } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { DeploymentStatus, OCIGitRepo, OCIStorageData, PullAttempt } from '@shell/components/fleet/FleetOCIStorage/types';

// The prototype has no backend, and the shared Rancher has no GitRepo that uses OCI storage. So the Fleet pages get
// their data from here: mock GitRepos, Bundles and BundleDeployments are added to the API's answers in the sample
// workspace, and the real clusters there get the labels the scenario selects on. Nothing is written to the server,
// and the mock objects have no update or remove links, so the UI offers no way to change them.

const NS = SCENARIO_WORKSPACE;
const COMMIT = '7c41a2f9e0b3d5c6a8e1f4b2d9c0a7e3f5b8d1c4';
const CREATED = '2026-11-02T09:00:00Z';

export const MOCK_ANNOTATION = 'prototype.fleet.cattle.io/mock';

interface SteveMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  [key: string]: unknown;
}

export interface SteveObject {
  id: string;
  type: string;
  metadata: SteveMetadata;
  [key: string]: unknown;
}

interface SteveCollection {
  data?: SteveObject[];
  [key: string]: unknown;
}

interface RequestConfig {
  url?: string;
  method?: string;
  adapter?: unknown;
}

interface MockableStore {
  $axios?: {
    interceptors: {
      request: { use(fn: (config: RequestConfig) => RequestConfig): unknown };
      response: { use(fn: (res: { config: RequestConfig, data: unknown }) => unknown): unknown };
    };
  };
  subscribeAction(handler: { before?: (action: { type: string, payload: unknown }) => void }): unknown;
}

const RESOURCES: Record<string, { apiVersion: string, kind: string, namespace: string, name: string }[]> = {
  'payments-api-deployment': [
    {
      apiVersion: 'apps/v1', kind: 'Deployment', namespace: 'payments', name: 'payments-api'
    },
    {
      apiVersion: 'v1', kind: 'Service', namespace: 'payments', name: 'payments-api'
    },
  ],
  'monitoring-stack-grafana': [{
    apiVersion: 'apps/v1', kind: 'Deployment', namespace: 'monitoring', name: 'grafana'
  }],
  'monitoring-stack-prometheus': [{
    apiVersion: 'apps/v1', kind: 'StatefulSet', namespace: 'monitoring', name: 'prometheus'
  }],
  'store-pos-app': [{
    apiVersion: 'apps/v1', kind: 'Deployment', namespace: 'store', name: 'pos'
  }],
  'lab-experiments-app': [{
    apiVersion: 'apps/v1', kind: 'Deployment', namespace: 'lab', name: 'experiments'
  }],
};

const REASON: Record<string, string> = {
  unreachable: 'dial tcp: i/o timeout',
  auth:        '401 Unauthorized',
  tls:         'x509: certificate signed by unknown authority',
  notFound:    'artifact not found',
};

const entryName = (attempt: PullAttempt) => (attempt.entry.isPush ? 'push registry' : attempt.entry.name);
const shortId = (id: string) => id.slice(0, 14);
const deployed = (d: DeploymentStatus) => d.state === 'ready' || d.state === 'fallback';
const clusterId = (d: DeploymentStatus) => `${ NS }/${ d.cluster.fleetName || d.cluster.name }`;
const links = (path: string) => ({ self: `/v1/${ path }`, view: `/v1/${ path }` });

function deploymentState(d: DeploymentStatus) {
  const failures = d.attempts.filter((a) => a.result && a.result !== 'ok');

  if (d.state === 'failed') {
    return {
      name:          'error',
      error:         true,
      transitioning: false,
      message:       `cannot pull OCI artifact ${ shortId(d.bundle.artifactId) }: ${ failures.map((a) => `${ entryName(a) }: ${ REASON[a.result as string] }`).join('; ') }`,
    };
  }

  if (d.state === 'retrying') {
    const missing = failures.find((a) => a.result === 'notFound') as PullAttempt;

    return {
      name:          'wait applied',
      error:         false,
      transitioning: true,
      message:       `OCI artifact ${ shortId(d.bundle.artifactId) } not found on ${ entryName(missing) }, retrying (attempt ${ d.retry?.attempt }, next in ${ d.retry?.nextMinutes }m)`,
    };
  }

  return {
    name: 'ready', error: false, transitioning: false, message: ''
  };
}

/** Errors first, then pending ones, as Fleet words a summary of several deployments */
function rollupState(items: DeploymentStatus[], prefix: (d: DeploymentStatus) => string) {
  const failed = items.filter((d) => d.state === 'failed');
  const waiting = items.filter((d) => d.state === 'retrying');

  if (failed.length) {
    return {
      name:          'error',
      error:         true,
      transitioning: false,
      message:       `ErrApplied(${ failed.length }) [${ failed.map((d) => `${ prefix(d) }: ${ deploymentState(d).message }`).join('; ') }]`,
    };
  }

  if (waiting.length) {
    return {
      name:          'wait applied',
      error:         false,
      transitioning: true,
      message:       `WaitApplied(${ waiting.length }) [${ waiting.map((d) => `${ prefix(d) }: ${ deploymentState(d).message }`).join('; ') }]`,
    };
  }

  return {
    name: 'active', error: false, transitioning: false, message: 'Resource is Ready'
  };
}

function resourceCounts(items: DeploymentStatus[]) {
  const counts = {
    desiredReady: 0, missing: 0, modified: 0, notReady: 0, orphaned: 0, ready: 0, unknown: 0, waitApplied: 0
  };

  items.forEach((d) => {
    const total = (RESOURCES[d.bundle.name] || []).length;

    counts.desiredReady += total;
    if (deployed(d)) {
      counts.ready += total;
    } else if (d.state === 'retrying') {
      counts.waitApplied += total;
    } else {
      counts.missing += total;
    }
  });

  return counts;
}

function ready(condition: boolean, message = '') {
  return {
    type: 'Ready', status: condition ? 'True' : 'False', error: !condition, transitioning: false, message, lastUpdateTime: CREATED
  };
}

function bundleDeploymentObject(d: DeploymentStatus): SteveObject {
  const fleetName = d.cluster.fleetName || d.cluster.name;
  const namespace = `cluster-${ NS }-${ fleetName }-prototype`;
  const state = deploymentState(d);

  return {
    id:         `${ namespace }/${ d.bundle.name }`,
    type:       'fleet.cattle.io.bundledeployment',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'BundleDeployment',
    links:      links(`fleet.cattle.io.bundledeployments/${ namespace }/${ d.bundle.name }`),
    metadata:   {
      name:              d.bundle.name,
      namespace,
      creationTimestamp: CREATED,
      uid:               `mock-bd-${ fleetName }-${ d.bundle.name }`,
      annotations:       { [MOCK_ANNOTATION]: 'true' },
      labels:            {
        'fleet.cattle.io/bundle-name':       d.bundle.name,
        'fleet.cattle.io/bundle-namespace':  NS,
        'fleet.cattle.io/cluster':           fleetName,
        'fleet.cattle.io/cluster-namespace': NS,
        'fleet.cattle.io/managed':           'true',
      },
      state,
    },
    spec:   { deploymentID: `${ d.bundle.artifactId }:mock`, ociContents: true },
    status: {
      ready:   deployed(d),
      display: {
        deployed: String(deployed(d)), monitored: String(deployed(d)), state: deployed(d) ? 'Ready' : (d.state === 'retrying' ? 'WaitApplied' : 'ErrApplied')
      },
      conditions: [ready(deployed(d), state.message)],
      resources:  deployed(d) ? (RESOURCES[d.bundle.name] || []).map((r) => ({ ...r, createdAt: CREATED })) : [],
      // What the prototype proposes Fleet reports: the entry the agent used, and what happened with each one it tried
      ociStorage: {
        secret:     d.secret.name,
        pulledFrom: d.pulledFrom ? (d.pulledFrom.isPush ? 'push' : d.pulledFrom.name) : null,
        attempts:   d.attempts.filter((a) => a.result).map((a) => ({
          entry:     a.entry.isPush ? 'push' : a.entry.name,
          reference: reference(a.entry.endpoint),
          result:    a.result,
        })),
        retry: d.retry,
      },
    },
  };
}

function bundleObject(gitRepo: OCIGitRepo, name: string, items: DeploymentStatus[]): SteveObject {
  const ok = items.filter(deployed).length;
  const state = rollupState(items, (d) => `Cluster ${ clusterId(d) }`);

  return {
    id:         `${ NS }/${ name }`,
    type:       'fleet.cattle.io.bundle',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'Bundle',
    links:      links(`fleet.cattle.io.bundles/${ NS }/${ name }`),
    metadata:   {
      name,
      namespace:         NS,
      creationTimestamp: CREATED,
      uid:               `mock-bundle-${ name }`,
      annotations:       { [MOCK_ANNOTATION]: 'true' },
      labels:            { 'fleet.cattle.io/repo-name': gitRepo.name, 'fleet.cattle.io/commit': COMMIT },
      state,
      fields:            [name, `${ ok }/${ items.length }`, null],
    },
    spec:   { targets: gitRepo.targets || [] },
    status: {
      conditions: [ready(ok === items.length, state.message)],
      display:    { readyClusters: `${ ok }/${ items.length }` },
      summary:    {
        desiredReady: items.length,
        ready:        ok,
        ...(items.some((d) => d.state === 'failed') ? { errApplied: items.filter((d) => d.state === 'failed').length } : {}),
        ...(items.some((d) => d.state === 'retrying') ? { waitApplied: items.filter((d) => d.state === 'retrying').length } : {}),
      },
    },
  };
}

function gitRepoObject(gitRepo: OCIGitRepo, items: DeploymentStatus[]): SteveObject {
  const clusters = [...new Set(items.map(clusterId))];
  const readyClusters = clusters.filter((id) => items.filter((d) => clusterId(d) === id).every(deployed));
  const ok = items.filter(deployed).length;
  const state = rollupState(items, (d) => `Bundle ${ d.bundle.name } on ${ clusterId(d) }`);
  const resources = gitRepo.bundles.flatMap((bundle) => (RESOURCES[bundle.name] || []).map((r) => {
    const own = items.filter((d) => d.bundle.name === bundle.name);
    const perClusterState: Record<string, string[]> = {};

    own.forEach((d) => {
      const key = deployed(d) ? 'ready' : (d.state === 'retrying' ? 'waitApplied' : 'missing');

      perClusterState[key] = [...(perClusterState[key] || []), clusterId(d)];
    });

    return {
      ...r,
      id:    `${ r.namespace }/${ r.name }`,
      type:  r.kind === 'Service' ? 'service' : `apps.${ r.kind.toLowerCase() }`,
      state: own.every(deployed) ? 'Ready' : 'NotReady',
      perClusterState,
    };
  }));

  return {
    id:         `${ NS }/${ gitRepo.name }`,
    type:       'fleet.cattle.io.gitrepo',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'GitRepo',
    links:      links(`fleet.cattle.io.gitrepos/${ NS }/${ gitRepo.name }`),
    metadata:   {
      name:              gitRepo.name,
      namespace:         NS,
      creationTimestamp: CREATED,
      generation:        1,
      uid:               `mock-gitrepo-${ gitRepo.name }`,
      annotations:       { [MOCK_ANNOTATION]: 'true', 'field.cattle.io/description': 'Prototype: mock GitRepo for the OCI storage prototype' },
      labels:            {},
      state,
      fields:            [gitRepo.name, gitRepo.repo, COMMIT, `${ ok }/${ items.length }`, null],
      relationships:     [],
    },
    spec: {
      repo:    gitRepo.repo,
      branch:  'main',
      paths:   gitRepo.paths || [],
      targets: gitRepo.targets || [],
      ...(gitRepo.secret ? { ociRegistrySecret: gitRepo.secret } : {}),
    },
    status: {
      commit:     COMMIT,
      conditions: [ready(ok === items.length, state.message), {
        type: 'Accepted', status: 'True', error: false, transitioning: false, lastUpdateTime: CREATED
      }],
      desiredReadyClusters:     clusters.length,
      readyClusters:            readyClusters.length,
      display:                  { readyBundleDeployments: `${ ok }/${ items.length }` },
      resourceCounts:           resourceCounts(items),
      perClusterResourceCounts: Object.fromEntries(clusters.map((id) => [id, resourceCounts(items.filter((d) => clusterId(d) === id))])),
      resources,
      summary:                  { desiredReady: items.length, ready: ok },
    },
  };
}

export function mockFleetObjects(data: OCIStorageData) {
  const deployments = resolveDeployments(data);
  const ofRepo = (name: string) => deployments.filter((d) => d.gitRepo.name === name);

  return {
    'fleet.cattle.io.gitrepo':          data.gitRepos.map((g) => gitRepoObject(g, ofRepo(g.name))),
    'fleet.cattle.io.bundle':           data.gitRepos.flatMap((g) => g.bundles.map((b) => bundleObject(g, b.name, ofRepo(g.name).filter((d) => d.bundle.name === b.name)))),
    'fleet.cattle.io.bundledeployment': deployments.map(bundleDeploymentObject),
  } as Record<string, SteveObject[]>;
}

/** The scenario's labels on the real cluster objects, so targets and credential sets select them */
export function labelCluster(obj: SteveObject, data: OCIStorageData) {
  if (obj?.metadata?.namespace !== NS) {
    return;
  }

  const cluster = data.clusters.find((c) => (c.fleetName || c.name) === obj.metadata.name);

  if (cluster) {
    obj.metadata.labels = { ...(obj.metadata.labels || {}), ...cluster.labels };
  }
}

const TYPES: Record<string, string> = {
  'fleet.cattle.io.gitrepos':          'fleet.cattle.io.gitrepo',
  'fleet.cattle.io.bundles':           'fleet.cattle.io.bundle',
  'fleet.cattle.io.bundledeployments': 'fleet.cattle.io.bundledeployment',
};

/** Steve paths: /v1/<plural>, /v1/<plural>/<namespace>, /v1/<plural>/<namespace>/<name> */
export function parsePath(url = ''): { plural: string, namespace?: string, name?: string } | null {
  const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  const match = path.match(/^\/v1\/(fleet\.cattle\.io\.[a-z]+)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/);

  return match ? {
    plural: match[1], namespace: match[2], name: match[3]
  } : null;
}

export function mockDetail(url: string | undefined, data: OCIStorageData): SteveObject | null {
  const parsed = parsePath(url);
  const type = parsed && TYPES[parsed.plural];

  if (!type || !parsed?.name) {
    return null;
  }

  return mockFleetObjects(data)[type].find((o) => o.id === `${ parsed.namespace }/${ parsed.name }`) || null;
}

interface TypeCount {
  summary: { count: number, states?: Record<string, number>, errors?: number };
  namespaces: Record<string, { count: number, states?: Record<string, number>, errors?: number }>;
}

/** The side nav's counts come from Steve's count object; add the mocks so they match the lists */
export function patchCounts(counts: Record<string, TypeCount>, data: OCIStorageData) {
  Object.entries(mockFleetObjects(data)).forEach(([type, objects]) => {
    const entry = counts[type] || (counts[type] = { summary: { count: 0 }, namespaces: {} });

    objects.forEach((o) => {
      const namespace = o.metadata.namespace as string;
      const ns = entry.namespaces[namespace] || (entry.namespaces[namespace] = { count: 0 });
      const error = (o.metadata.state as { error?: boolean } | undefined)?.error;

      [entry.summary, ns].forEach((bucket) => {
        bucket.count++;
        if (error) {
          bucket.errors = (bucket.errors || 0) + 1;
          bucket.states = { ...(bucket.states || {}), error: (bucket.states?.error || 0) + 1 };
        }
      });
    });
  });
}

export function patchResponse(url: string | undefined, body: unknown, data: OCIStorageData) {
  if (/\/v1\/counts(\/|\?|$)/.test(url || '') && body && typeof body === 'object') {
    const count = (body as { data?: { counts?: Record<string, TypeCount> }[] }).data?.[0]?.counts;

    if (count) {
      patchCounts(count, data);
    }

    return;
  }

  const parsed = parsePath(url);

  if (!parsed || !body || typeof body !== 'object') {
    return;
  }

  if (parsed.plural === 'fleet.cattle.io.clusters') {
    const collection = body as SteveCollection;

    (collection.data || [body as SteveObject]).forEach((obj) => labelCluster(obj, data));

    return;
  }

  const type = TYPES[parsed.plural];
  const collection = body as SteveCollection;

  if (type && !parsed.name && Array.isArray(collection.data) && (!parsed.namespace || parsed.namespace === NS)) {
    const known = new Set(collection.data.map((o) => o.id));

    mockFleetObjects(data)[type].filter((o) => !known.has(o.id) && (!parsed.namespace || o.metadata.namespace === parsed.namespace)).forEach((o) => collection.data?.push(o));
  }
}

let installed = false;

export function installOCIStorageMockApi(store: MockableStore) {
  const axios = store.$axios;

  if (installed || !axios) {
    return;
  }
  installed = true;

  axios.interceptors.request.use((config) => {
    const found = (config.method || 'get').toLowerCase() === 'get' ? mockDetail(config.url, sampleWorkspaceData()) : null;

    if (found) {
      config.adapter = () => Promise.resolve({
        data: found, status: 200, statusText: 'OK', headers: {}, config
      });
    }

    return config;
  });

  axios.interceptors.response.use((res) => {
    patchResponse(res.config?.url, res.data, sampleWorkspaceData());

    return res;
  });

  // Live updates arrive over the websocket, not through axios: keep the scenario's labels and counts in them
  store.subscribeAction({
    before: (action) => {
      const payload = action.payload as { data?: SteveObject & { counts?: Record<string, TypeCount> } } | undefined;

      if (!action.type.endsWith('ws.resource.change') || !payload?.data) {
        return;
      }

      if (payload.data.type === 'fleet.cattle.io.cluster') {
        labelCluster(payload.data, sampleWorkspaceData());
      } else if (payload.data.type === 'count' && payload.data.counts) {
        patchCounts(payload.data.counts, sampleWorkspaceData());
      }
    },
  });
}
