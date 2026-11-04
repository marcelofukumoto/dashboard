import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { formatSi } from '@shell/utils/units';
import { CLUSTER_STATE_COLORS, isFailing } from '@shell/components/fleet/FleetOCIStorage/resolve';
import {
  ClusterPullState,
  ClusterStatus,
  RegistryAccess,
  RegistryStatus,
} from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage';

// Agents back off from 30 seconds and double each time
export function backoff(pendingMinutes: number): { attempt: number, nextMinutes: number } {
  const attempt = Math.max(1, Math.floor(Math.log2(pendingMinutes / 0.5 + 1)));
  const nextMinutes = Math.max(1, Math.ceil(0.5 * (2 ** (attempt + 1) - 1) - pendingMinutes));

  return { attempt, nextMinutes };
}

export function useFleetOCIStorageLabels() {
  const store = useStore();
  const { t: translate } = useI18n(store);

  // Raw because every caller renders through text interpolation or a sanitising directive
  const t = (key: string, args?: unknown): string => translate(key, args, true);

  function age(minutes: number | null): string {
    if (minutes === null) {
      return t(`${ ROOT }.age.never`);
    }

    if (minutes < 1) {
      return t(`${ ROOT }.age.now`);
    }

    if (minutes < 60) {
      return t(`${ ROOT }.age.minutes`, { n: minutes });
    }

    if (minutes < 60 * 24) {
      return t(`${ ROOT }.age.hours`, { n: Math.round(minutes / 60) });
    }

    return t(`${ ROOT }.age.days`, { n: Math.round(minutes / (60 * 24)) });
  }

  function size(bytes: number): string {
    return formatSi(bytes, {
      increment: 1024, suffix: 'iB', maxPrecision: 1, addSuffixSpace: true
    });
  }

  function reason(access: RegistryAccess | null): string {
    return access ? t(`${ ROOT }.reason.${ access }`) : '';
  }

  function clusterStateDisplay(state: ClusterPullState) {
    return {
      stateDisplay:    t(`${ ROOT }.clusters.state.${ state }`),
      stateBackground: CLUSTER_STATE_COLORS[state],
      stateObj:        { error: isFailing(state) },
    };
  }

  function clusterMessage(status: ClusterStatus): string {
    const message = `${ ROOT }.clusters.message`;

    switch (status.state) {
    case 'failover':
      return t(`${ message }.failover`, {
        failed: status.failedRegistry, reason: reason(status.failedAccess), target: status.targetRegistry
      });
    case 'waiting': {
      const artifact = status.waitingOn[0];
      const { attempt, nextMinutes } = backoff(artifact.pendingOn[status.targetRegistry as string]);
      const next = status.chain[status.chain.indexOf(status.targetRegistry as string) + 1];
      const waiting = t(`${ message }.waiting`, {
        bundle: artifact.bundle, registry: status.targetRegistry, attempt, next: nextMinutes
      });

      return next ? `${ waiting } ${ t(`${ message }.waitingNext`, { next, wait: status.replicationWaitMinutes }) }` : waiting;
    }
    case 'updatePending':
      return t(`${ message }.updatePending`, { target: status.chain[0], current: status.pullingFrom });
    case 'authFailed':
    case 'tlsError':
    case 'unreachable':
      return t(`${ message }.failed`, { registry: status.failedRegistry, reason: reason(status.failedAccess) });
    case 'noRoute':
      return t(`${ message }.noRoute`);
    default:
      return '';
    }
  }

  function clusterHint(status: ClusterStatus): string {
    if (status.state === 'pulled') {
      return '';
    }

    return t(`${ ROOT }.panel.hint.${ status.state }`, {
      failed:   status.failedRegistry,
      registry: status.targetRegistry || status.failedRegistry,
    });
  }

  function accessShort(access: RegistryAccess): string {
    const state = {
      auth: 'authFailed', tls: 'tlsError', unreachable: 'unreachable', ok: 'pulled', notReplicated: 'waiting'
    }[access];

    return t(`${ ROOT }.clusters.state.${ state }`);
  }

  function registryMessage(status: RegistryStatus): string {
    const message = `${ ROOT }.registries.message`;
    const clusters = status.failingClusters.map((c) => `${ c.name } (${ accessShort(c.access) })`).join(', ');

    switch (status.state) {
    case 'degraded':
      return t(`${ message }.degraded`, {
        failing: status.failingClusters.length, total: status.routedClusters.length, clusters
      });
    case 'error':
      return t(`${ message }.error`, { clusters });
    case 'replicating':
      return t(`${ message }.replicating`, { count: status.pendingArtifacts.length, names: status.pendingArtifacts.map((a) => a.bundle).join(', ') });
    case 'unused':
      return t(`${ message }.unused`);
    default:
      return '';
    }
  }

  return {
    t,
    age,
    size,
    reason,
    clusterStateDisplay,
    clusterMessage,
    clusterHint,
    registryMessage,
  };
}
