import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { FLEET } from '@shell/config/types';
import { emptyData, scenarioData, SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import {
  connectionChecks,
  resolveArtifact,
  resolveCluster,
  resolveRegistry,
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import {
  ClusterStatus,
  ConnectionCheck,
  OCICluster,
  OCIRegistry,
  OCIRoute,
  OCIStorageData,
  RegistryAccess,
} from '@shell/components/fleet/FleetOCIStorage/types';

const STORAGE_KEY = 'fleet-oci-storage-prototype';

// Records the chain each cluster last deployed with, so a later routing change shows up as a pending update
function stampApplied(data: OCIStorageData): OCIStorageData {
  data.clusters.forEach((cluster) => {
    if (!cluster.appliedPrimary) {
      cluster.appliedPrimary = resolveCluster(data, cluster).chain[0] || null;
    }
  });

  return data;
}

function seed(): Record<string, OCIStorageData> {
  return { [SCENARIO_WORKSPACE]: stampApplied(scenarioData()) };
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

  const statuses = computed<ClusterStatus[]>(() => data.value.clusters.map((c) => resolveCluster(data.value, c)));
  const registryStatuses = computed(() => data.value.registries.map((r) => resolveRegistry(data.value, statuses.value, r)));
  const artifactStatuses = computed(() => data.value.artifacts.map((a) => resolveArtifact(data.value, statuses.value, a)));
  const sourceRegistry = computed(() => data.value.registries.find((r) => r.role === 'source') || null);

  function stored(): OCIStorageData {
    if (!state.workspaces[workspace.value]) {
      state.workspaces[workspace.value] = emptyData();
    }

    return state.workspaces[workspace.value];
  }

  function forceUpdate(clusterNames?: string[]) {
    const target = stored();

    target.clusters.forEach((cluster) => {
      if (clusterNames && !clusterNames.includes(cluster.name)) {
        return;
      }

      const status = resolveCluster(target, cluster);

      if (status.targetRegistry && !status.waitingOn.length && cluster.appliedPrimary !== status.chain[0]) {
        cluster.appliedPrimary = status.chain[0];
        cluster.lastPullMinutesAgo = 0;
      }
    });
    persist();
  }

  function saveRegistry(registry: OCIRegistry, originalName?: string) {
    const target = stored();

    stampApplied(target);

    const index = target.registries.findIndex((r) => r.name === (originalName || registry.name));

    if (registry.role === 'source') {
      target.registries.forEach((r) => {
        r.role = r.name === registry.name || r.name === originalName ? r.role : 'mirror';
      });
    }

    if (index >= 0) {
      target.registries[index] = registry;
    } else {
      target.registries.push(registry);
    }

    if (originalName && originalName !== registry.name) {
      const rename = (name: string) => (name === originalName ? registry.name : name);

      target.routes.forEach((route) => {
        route.registries = route.registries.map(rename);
      });
      target.defaultRegistries = target.defaultRegistries.map(rename);
    }

    if (registry.role === 'source' && !target.defaultRegistries.length) {
      target.defaultRegistries = [registry.name];
    }

    persist();
  }

  function setSource(name: string) {
    const target = stored();

    target.registries.forEach((r) => {
      r.role = r.name === name ? 'source' : 'mirror';
    });
    persist();
  }

  function deleteRegistry(name: string) {
    const target = stored();

    stampApplied(target);
    target.registries = target.registries.filter((r) => r.name !== name);
    target.routes.forEach((route) => {
      route.registries = route.registries.filter((r) => r !== name);
    });
    target.defaultRegistries = target.defaultRegistries.filter((r) => r !== name);
    persist();
  }

  function saveRoute(route: OCIRoute, originalName?: string) {
    const target = stored();

    stampApplied(target);

    const index = target.routes.findIndex((r) => r.name === (originalName || route.name));

    if (index >= 0) {
      target.routes[index] = route;
    } else {
      target.routes.push(route);
    }
    persist();
  }

  function saveDefaultRegistries(registries: string[]) {
    const target = stored();

    stampApplied(target);
    target.defaultRegistries = registries;
    persist();
  }

  function deleteRoute(name: string) {
    const target = stored();

    stampApplied(target);
    target.routes = target.routes.filter((r) => r.name !== name);
    persist();
  }

  function moveRoute(name: string, delta: number) {
    const target = stored();

    stampApplied(target);

    const from = target.routes.findIndex((r) => r.name === name);
    const to = from + delta;

    if (from < 0 || to < 0 || to >= target.routes.length) {
      return;
    }

    const [route] = target.routes.splice(from, 1);

    target.routes.splice(to, 0, route);
    persist();
  }

  function statusForRealCluster(name: string, labels?: Record<string, string>): ClusterStatus {
    const known = data.value.clusters.find((c) => c.name === name);

    return resolveCluster(data.value, known || adHocCluster(name, labels));
  }

  function testConnection(draft: OCIRegistry, from: string): ConnectionCheck[] {
    const cluster = data.value.clusters.find((c) => c.name === from);
    let access: RegistryAccess = 'ok';

    if (cluster) {
      access = cluster.access[draft.name] || cluster.defaultAccess;
    } else {
      access = draft.host.includes('.local') ? 'unreachable' : draft.controllerAccess;
    }

    return connectionChecks(draft, access, from, !cluster);
  }

  return {
    workspace,
    data,
    statuses,
    registryStatuses,
    artifactStatuses,
    sourceRegistry,
    saveRegistry,
    setSource,
    deleteRegistry,
    saveRoute,
    saveDefaultRegistries,
    deleteRoute,
    moveRoute,
    forceUpdate,
    statusForRealCluster,
    testConnection,
  };
}

function adHocCluster(name: string, labels?: Record<string, string>): OCICluster {
  return {
    name,
    labels:             labels || {},
    groups:             [],
    access:             {},
    defaultAccess:      'ok',
    lastPullMinutesAgo: null,
    appliedPrimary:     null,
  };
}
