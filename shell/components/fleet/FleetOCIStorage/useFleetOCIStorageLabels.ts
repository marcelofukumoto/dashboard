import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DEPLOYMENT_STATE_COLORS } from '@shell/components/fleet/FleetOCIStorage/resolve';
import {
  CredentialSet,
  DeploymentState,
  DeploymentStatus,
  PullAttempt,
  PullEntry,
  PullResult,
  RegistryEndpoint,
} from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage';

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

  function entryLabel(entry: PullEntry): string {
    return entry.isPush ? t(`${ ROOT }.pushEntry`) : entry.name;
  }

  function reason(result: PullResult | null): string {
    return result && result !== 'ok' ? t(`${ ROOT }.reason.${ result }`) : '';
  }

  function tlsLabel(endpoint: RegistryEndpoint): string {
    return endpoint.basicHTTP ? t(`${ ROOT }.tls.basicHTTP`) : t(`${ ROOT }.tls.${ endpoint.tlsMode }`);
  }

  function matchChips(set: CredentialSet): string[] {
    return [
      ...set.clusterNames.map((name) => t(`${ ROOT }.match.cluster`, { name })),
      ...set.clusterGroups.map((name) => t(`${ ROOT }.match.group`, { name })),
      ...set.selectors.flatMap((selector) => [
        ...Object.entries(selector.matchLabels || {}).map(([key, value]) => `${ key }=${ value }`),
        ...(selector.matchExpressions || []).filter((e) => e.key).map((e) => `${ e.key } ${ e.operator } ${ (e.values || []).join(',') }`.trim()),
      ]),
    ];
  }

  function deploymentStateDisplay(state: DeploymentState) {
    return {
      stateDisplay:    t(`${ ROOT }.deployments.state.${ state }`),
      stateBackground: DEPLOYMENT_STATE_COLORS[state],
      stateObj:        { error: state === 'failed' },
    };
  }

  function failure(attempt: PullAttempt): string {
    return t(`${ ROOT }.deployments.message.attempt`, { entry: entryLabel(attempt.entry), reason: reason(attempt.result) });
  }

  function deploymentMessage(status: DeploymentStatus): string {
    const message = `${ ROOT }.deployments.message`;
    const failed = status.attempts.filter((a) => a.result && a.result !== 'ok');

    switch (status.state) {
    case 'fallback':
      return t(`${ message }.fallback`, { failures: failed.map(failure).join(' '), target: entryLabel(status.pulledFrom as PullEntry) });
    case 'retrying': {
      const missing = failed.find((a) => a.result === 'notFound') as PullAttempt;
      const others = failed.filter((a) => a !== missing).map(failure).join(' ');
      const retrying = t(`${ message }.retrying`, {
        entry: entryLabel(missing.entry), attempt: status.retry?.attempt, next: status.retry?.nextMinutes
      });

      return others ? `${ retrying } ${ others }` : retrying;
    }
    case 'failed':
      return `${ failed.map(failure).join(' ') } ${ t(`${ message }.noneLeft`) }`;
    default:
      return '';
    }
  }

  function deploymentHint(status: DeploymentStatus): string {
    const first = status.firstFailure;

    if (status.state === 'ready' || !first) {
      return '';
    }

    if (status.state === 'retrying') {
      const missing = status.attempts.find((a) => a.result === 'notFound') as PullAttempt;

      return t(`${ ROOT }.panel.hint.retrying`, { entry: entryLabel(missing.entry) });
    }

    if (status.state === 'fallback') {
      return t(`${ ROOT }.panel.hint.fallback`, { failed: entryLabel(first.entry), target: entryLabel(status.pulledFrom as PullEntry) });
    }

    return t(`${ ROOT }.panel.hint.${ first.result }`, { entry: entryLabel(first.entry) });
  }

  return {
    t,
    age,
    entryLabel,
    reason,
    tlsLabel,
    matchChips,
    deploymentStateDisplay,
    deploymentMessage,
    deploymentHint,
  };
}
