import { convert, matches } from '@shell/utils/selector';
import { Selector } from '@shell/types/fleet';
import {
  ArtifactPull,
  ArtifactRegistryStatus,
  ArtifactStatus,
  ClusterPullState,
  ClusterStatus,
  ConnectionCheck,
  OCIArtifact,
  OCICluster,
  OCIRegistry,
  OCIRoute,
  OCIStorageData,
  RegistryAccess,
  RegistryAttempt,
  RegistryStatus,
} from '@shell/components/fleet/FleetOCIStorage/types';

export const DEFAULT_ROUTE = 'default';
export const DEFAULT_REPLICATION_WAIT_MINUTES = 10;

const FAILED_STATE: Record<string, ClusterPullState> = {
  auth:          'authFailed',
  tls:           'tlsError',
  unreachable:   'unreachable',
  notReplicated: 'unreachable',
};

export const CLUSTER_STATE_COLORS: Record<ClusterPullState, string> = {
  pulled:        'bg-success',
  failover:      'bg-warning',
  waiting:       'bg-info',
  updatePending: 'bg-info',
  authFailed:    'bg-error',
  tlsError:      'bg-error',
  unreachable:   'bg-error',
  noRoute:       'bg-error',
};

export const REGISTRY_STATE_COLORS = {
  active:      'bg-success',
  replicating: 'bg-info',
  degraded:    'bg-warning',
  error:       'bg-error',
  unused:      'bg-darker',
};

export const ARTIFACT_STATE_COLORS = {
  available:   'bg-success',
  replicating: 'bg-info',
  failed:      'bg-error',
};

export const ATTENTION_STATES: ClusterPullState[] = ['authFailed', 'tlsError', 'unreachable', 'noRoute', 'failover'];

export function needsAttention(state: ClusterPullState): boolean {
  return ATTENTION_STATES.includes(state);
}

export function isFailing(state: ClusterPullState): boolean {
  return ['authFailed', 'tlsError', 'unreachable', 'noRoute'].includes(state);
}

export function reference(registry: Pick<OCIRegistry, 'host' | 'namespace'>): string {
  return [registry.host, registry.namespace].filter(Boolean).join('/');
}

function selectorMatches(selector: Selector, cluster: OCICluster): boolean {
  const rules = convert(selector.matchLabels || {}, selector.matchExpressions || []).filter((rule: { key: string }) => !!rule.key);

  // An empty selector row in the form means "not filled in yet", not "every cluster"
  return !!rules.length && matches(cluster, rules, 'labels');
}

export function routeMatches(route: OCIRoute, cluster: OCICluster): boolean {
  return route.clusterNames.includes(cluster.name) ||
    route.clusterGroups.some((group) => cluster.groups.includes(group)) ||
    route.selectors.some((selector) => selectorMatches(selector, cluster));
}

function accessFor(cluster: OCICluster, registry: string): RegistryAccess {
  return cluster.access[registry] || cluster.defaultAccess;
}

function stableDuration(seed: string): number {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1400;
  }

  return 180 + hash;
}

function pullFor(artifact: OCIArtifact, cluster: OCICluster, pullingFrom: string | null, targetRegistry: string | null, failedRegistry: string | null, failing: boolean): ArtifactPull {
  const base = { artifact, cluster: cluster.name };
  const lastPull = cluster.lastPullMinutesAgo;

  if (lastPull !== null && lastPull <= artifact.pushedMinutesAgo) {
    return {
      ...base,
      state:      'pulled',
      registry:   artifact.pinnedRegistry || pullingFrom || cluster.appliedPrimary,
      minutesAgo: Math.max(lastPull, artifact.pushedMinutesAgo - 1),
      durationMs: stableDuration(`${ cluster.name }/${ artifact.bundle }`),
    };
  }

  const waiting = !!targetRegistry && artifact.pendingOn[targetRegistry] !== undefined;

  return {
    ...base,
    state:      waiting ? 'waiting' : (failing ? 'failed' : 'behind'),
    registry:   artifact.pinnedRegistry || targetRegistry || failedRegistry,
    minutesAgo: null,
    durationMs: null,
  };
}

export function resolveCluster(data: OCIStorageData, cluster: OCICluster): ClusterStatus {
  const route = data.routes.find((r) => routeMatches(r, cluster)) || null;
  const chain = route ? route.registries : data.defaultRegistries;
  const wait = route ? route.replicationWaitMinutes : DEFAULT_REPLICATION_WAIT_MINUTES;
  const targeted = data.artifacts.filter((a) => a.clusters.includes(cluster.name));

  const attempts: RegistryAttempt[] = [];
  let targetRegistry: string | null = null;
  let failedRegistry: string | null = null;
  let failedAccess: RegistryAccess | null = null;
  let waitingOn: OCIArtifact[] = [];

  for (let index = 0; index < chain.length; index++) {
    const name = chain[index];

    if (targetRegistry) {
      attempts.push({
        registry: name, outcome: 'standby', access: null
      });
      continue;
    }

    const access = accessFor(cluster, name);

    if (access !== 'ok') {
      failedRegistry = name;
      failedAccess = access;
      attempts.push({
        registry: name, outcome: 'failed', access
      });
      continue;
    }

    const pendingHere = targeted.filter((a) => !a.pinnedRegistry && a.pendingOn[name] !== undefined);
    const expired = pendingHere.some((a) => a.pendingOn[name] >= wait);

    // A missing artifact only moves the agent on once the replication wait is over and there is somewhere else to try
    if (expired && index < chain.length - 1) {
      failedRegistry = name;
      failedAccess = 'notReplicated';
      attempts.push({
        registry: name, outcome: 'failed', access: 'notReplicated'
      });
      continue;
    }

    targetRegistry = name;
    waitingOn = pendingHere.filter((a) => cluster.lastPullMinutesAgo === null || cluster.lastPullMinutesAgo > a.pushedMinutesAgo);
    attempts.push({
      registry: name, outcome: waitingOn.length ? 'waiting' : 'active', access: 'ok'
    });
  }

  let state: ClusterPullState = 'pulled';

  if (!chain.length) {
    state = 'noRoute';
  } else if (!targetRegistry) {
    state = FAILED_STATE[failedAccess || 'unreachable'];
  } else if (waitingOn.length) {
    state = 'waiting';
  } else if (cluster.appliedPrimary && cluster.appliedPrimary !== chain[0]) {
    state = 'updatePending';
  } else if (targetRegistry !== chain[0]) {
    state = 'failover';
  }

  const pullingFrom = state === 'updatePending' ? cluster.appliedPrimary : targetRegistry;
  const pulls = targeted.map((a) => pullFor(a, cluster, pullingFrom, targetRegistry, failedRegistry, isFailing(state)));

  return {
    cluster,
    route,
    chain,
    attempts,
    state,
    targetRegistry,
    pullingFrom,
    failedRegistry,
    failedAccess,
    waitingOn,
    replicationWaitMinutes: wait,
    pulls,
    pulledCount:            pulls.filter((p) => p.state === 'pulled').length,
  };
}

export function resolveRegistry(data: OCIStorageData, statuses: ClusterStatus[], registry: OCIRegistry): RegistryStatus {
  const name = registry.name;
  const routed = statuses.filter((s) => s.chain.includes(name));
  const active = routed.filter((s) => s.pullingFrom === name);
  const failing = routed.flatMap((s) => {
    const attempt = s.attempts.find((a) => a.registry === name);

    return attempt?.outcome === 'failed' && attempt.access !== 'notReplicated' ? [{ name: s.cluster.name, access: attempt.access as RegistryAccess }] : [];
  });
  const pendingArtifacts = data.artifacts.filter((a) => a.pendingOn[name] !== undefined);
  const hosted = registry.role === 'source' ? data.artifacts : data.artifacts.filter((a) => {
    return a.pendingOn[name] === undefined && a.clusters.some((c) => active.some((s) => s.cluster.name === c));
  });
  const pullTimes = active.map((s) => s.cluster.lastPullMinutesAgo).filter((m): m is number => m !== null);

  let state: RegistryStatus['state'] = 'active';

  if (!routed.length && registry.role !== 'source') {
    state = 'unused';
  } else if (routed.length && failing.length === routed.length) {
    state = 'error';
  } else if (failing.length) {
    state = 'degraded';
  } else if (pendingArtifacts.length) {
    state = 'replicating';
  }

  return {
    registry,
    state,
    routedClusters:     routed.map((s) => s.cluster.name),
    activeClusters:     active.map((s) => s.cluster.name),
    failingClusters:    failing,
    pendingArtifacts,
    artifactCount:      hosted.length,
    sizeBytes:          hosted.reduce((sum, a) => sum + a.sizeBytes, 0),
    lastPullMinutesAgo: pullTimes.length ? Math.min(...pullTimes) : null,
  };
}

export function resolveArtifact(data: OCIStorageData, statuses: ClusterStatus[], artifact: OCIArtifact): ArtifactStatus {
  const pulls = statuses.flatMap((s) => s.pulls.filter((p) => p.artifact.bundle === artifact.bundle));
  const source = artifact.pinnedRegistry || data.registries.find((r) => r.role === 'source')?.name || null;
  const names = new Set<string>(source ? [source] : []);

  if (!artifact.pinnedRegistry) {
    pulls.forEach((p) => p.registry && names.add(p.registry));
  }

  const registries: ArtifactRegistryStatus[] = [...names].map((registry) => {
    const here = pulls.filter((p) => p.registry === registry);
    const pulled = here.filter((p) => p.state === 'pulled').length;
    const pendingMinutes = artifact.pendingOn[registry] ?? null;
    let availability: ArtifactRegistryStatus['availability'] = 'unknown';

    if (registry === source) {
      availability = 'pushed';
    } else if (pendingMinutes !== null) {
      availability = 'pending';
    } else if (pulled) {
      availability = 'available';
    }

    return {
      registry,
      availability,
      pulled,
      total: here.length,
      pendingMinutes,
    };
  });

  let state: ArtifactStatus['state'] = 'available';

  if (pulls.some((p) => p.state === 'failed')) {
    state = 'failed';
  } else if (pulls.some((p) => p.state === 'waiting' || p.state === 'behind')) {
    state = 'replicating';
  }

  return {
    artifact,
    state,
    pulls,
    registries,
    pulledCount: pulls.filter((p) => p.state === 'pulled').length,
  };
}

export function connectionChecks(draft: OCIRegistry, access: RegistryAccess, from: string, fromController: boolean): ConnectionCheck[] {
  const checks: ConnectionCheck[] = [];
  const reachable = access !== 'unreachable';
  const tlsOk = reachable && access !== 'tls';
  const user = draft.agentUsername || draft.username;

  checks.push({
    key:     'connect',
    outcome: reachable ? 'ok' : 'error',
    params:  { host: draft.host, from },
  });

  checks.push({
    key:     draft.tlsMode === 'skipVerify' || draft.basicHTTP ? 'tlsSkipped' : 'tls',
    outcome: !reachable ? 'skipped' : (draft.tlsMode === 'skipVerify' || draft.basicHTTP ? 'warning' : (tlsOk ? 'ok' : 'error')),
    params:  {},
  });

  const authOk = tlsOk && access !== 'auth';

  checks.push({
    key:     user ? 'agentAuth' : 'anonymous',
    outcome: !tlsOk ? 'skipped' : (authOk ? (user ? 'ok' : 'warning') : 'error'),
    params:  { user },
  });

  if (draft.role === 'source') {
    checks.push({
      key:     draft.agentUsername ? 'agentReadOnly' : 'agentHasPush',
      outcome: !authOk ? 'skipped' : (draft.agentUsername ? 'ok' : 'warning'),
      params:  {},
    });

    // Only the controller side pushes, so an agent's view of push rights says nothing useful
    if (fromController) {
      checks.push({
        key:     'pushAuth',
        outcome: !authOk ? 'skipped' : 'ok',
        params:  { user: draft.username || '-' },
      });
    }
  }

  checks.push({
    key:     'namespace',
    outcome: !authOk ? 'skipped' : 'ok',
    params:  { namespace: draft.namespace || '/' },
  });

  return checks;
}
