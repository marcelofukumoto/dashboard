import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { FLEET } from '@shell/config/types';
import { emptyData, scenarioData, SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import {
  FALLBACK_SECRET, pullOrder, resolveDeployments, resolveSecret, secretFor
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import {
  DeploymentStatus,
  OCICluster,
  OCIStorageData,
  OCIStorageSecret,
  PullEntry,
  SecretStatus,
} from '@shell/components/fleet/FleetOCIStorage/types';

// v3: the scenario runs on the real fleet-default clusters; v2 used made-up ones, v1 had registries and routes
const STORAGE_KEY = 'fleet-oci-storage-prototype-v3';

function seed(): Record<string, OCIStorageData> {
  return { [SCENARIO_WORKSPACE]: scenarioData() };
}

function load(): Record<string, OCIStorageData> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  return seed();
}

const state = reactive<{ workspaces: Record<string, OCIStorageData> }>({ workspaces: load() });

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.workspaces));
  } catch {}
}

/** The sample workspace as it is now, for the API mock that feeds the Fleet pages */
export function sampleWorkspaceData(): OCIStorageData {
  return state.workspaces[SCENARIO_WORKSPACE] || scenarioData();
}

/**
 * The sample workspace's bundle deployments, for the Fleet pages. They don't follow the workspace selector: a Bundle
 * page can be open while another workspace is selected
 */
export function useSampleDeployments() {
  const deployments = computed<DeploymentStatus[]>(() => resolveDeployments(sampleWorkspaceData()));
  const secretOf = (gitRepoName: string) => {
    const data = sampleWorkspaceData();
    const gitRepo = data.gitRepos.find((g) => g.name === gitRepoName);

    return gitRepo ? secretFor(data, gitRepo) : null;
  };

  return { deployments, secretOf };
}

/** For the Fleet detail pages: whether a GitRepo or Bundle stores its bundles in OCI storage, and how many can't pull */
export function ociStorageFor({ namespace, gitRepo, bundle }: { namespace?: string, gitRepo?: string, bundle?: string }) {
  if (namespace !== SCENARIO_WORKSPACE) {
    return { used: false, failing: 0 };
  }

  const own = resolveDeployments(sampleWorkspaceData()).filter((d) => (gitRepo ? d.gitRepo.name === gitRepo : d.bundle.name === bundle));

  return { used: own.length > 0, failing: own.filter((d) => d.state === 'failed').length };
}

export function resetMockData() {
  state.workspaces = seed();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useFleetOCIStorage() {
  const store = useStore();
  // The GitRepo form specs mount with a mocked $store and no injected one
  const workspace = computed<string>(() => store?.getters.workspace);

  const realClusters = computed<OCICluster[]>(() => {
    const all = store?.getters['management/all']?.(FLEET.CLUSTER) || [];

    return all
      .filter((c: { metadata: { namespace: string } }) => c.metadata.namespace === workspace.value)
      .map((c: { metadata: { name: string, labels?: Record<string, string> } }) => adHocCluster(c.metadata.name, c.metadata.labels));
  });

  const data = computed<OCIStorageData>(() => {
    const stored = state.workspaces[workspace.value] || emptyData();

    return stored.isScenario ? stored : { ...stored, clusters: realClusters.value };
  });

  const deployments = computed<DeploymentStatus[]>(() => resolveDeployments(data.value));
  const secretStatuses = computed<SecretStatus[]>(() => data.value.secrets.map((s) => resolveSecret(data.value, s)));

  function stored(): OCIStorageData {
    if (!state.workspaces[workspace.value]) {
      state.workspaces[workspace.value] = emptyData();
    }

    return state.workspaces[workspace.value];
  }

  function saveSecret(secret: OCIStorageSecret, originalName?: string) {
    const target = stored();
    const index = target.secrets.findIndex((s) => s.name === (originalName || secret.name));

    if (index >= 0) {
      target.secrets[index] = secret;
    } else {
      target.secrets.push(secret);
    }

    if (originalName && originalName !== secret.name) {
      target.gitRepos.forEach((g) => {
        g.secret = g.secret === originalName ? secret.name : g.secret;
      });
    }

    persist();
  }

  function deleteSecret(name: string) {
    const target = stored();

    target.secrets = target.secrets.filter((s) => s.name !== name);
    persist();
  }

  // For a real Fleet cluster: the order its agent would try for each secret in the workspace
  function ordersForCluster(name: string, labels?: Record<string, string>): { secret: OCIStorageSecret, isDefault: boolean, entries: PullEntry[] }[] {
    const cluster = data.value.clusters.find((c) => c.name === name) || adHocCluster(name, labels);

    return data.value.secrets.map((secret) => ({
      secret,
      isDefault: secret.name === FALLBACK_SECRET,
      entries:   pullOrder(secret, cluster),
    }));
  }

  return {
    workspace,
    data,
    deployments,
    secretStatuses,
    saveSecret,
    deleteSecret,
    ordersForCluster,
  };
}

function adHocCluster(name: string, labels?: Record<string, string>): OCICluster {
  return {
    name,
    labels:             labels || {},
    groups:             [],
    reach:              {},
    defaultReach:       'ok',
    lastPullMinutesAgo: null,
  };
}
