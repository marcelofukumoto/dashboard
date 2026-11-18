import { convert, matches } from '@shell/utils/selector';
import { Selector } from '@shell/types/fleet';
import {
  CredentialSet,
  DeploymentState,
  DeploymentStatus,
  OCIBundle,
  OCICluster,
  OCIGitRepo,
  OCIStorageData,
  OCIStorageSecret,
  PullAttempt,
  PullEntry,
  PullResult,
  RegistryEndpoint,
  SecretState,
  SecretStatus,
} from '@shell/components/fleet/FleetOCIStorage/types';

// Key for the push registry in a cluster's reach map; a credential set can't be named this
export const PUSH_ENTRY = 'push';

// The secret Fleet uses for a GitRepo that names none
export const FALLBACK_SECRET = 'ocistorage';

export const DEPLOYMENT_STATE_COLORS: Record<DeploymentState, string> = {
  ready:    'bg-success',
  fallback: 'bg-warning',
  retrying: 'bg-info',
  failed:   'bg-error',
};

export const SECRET_STATE_COLORS: Record<SecretState, string> = {
  active: 'bg-success',
  error:  'bg-error',
  unused: 'bg-darker',
};

export function reference(endpoint: Pick<RegistryEndpoint, 'host' | 'namespace'>): string {
  return [endpoint.host, endpoint.namespace].filter(Boolean).join('/');
}

function selectorMatches(selector: Selector, cluster: OCICluster): boolean {
  const rules = convert(selector.matchLabels || {}, selector.matchExpressions || []).filter((rule: { key: string }) => !!rule.key);

  // An empty selector row in the form means "not filled in yet", not "every cluster"
  return !!rules.length && matches(cluster, rules, 'labels');
}

export function setMatches(set: CredentialSet, cluster: OCICluster): boolean {
  return set.clusterNames.includes(cluster.name) ||
    set.clusterGroups.some((group) => cluster.groups.includes(group)) ||
    set.selectors.some((selector) => selectorMatches(selector, cluster));
}

export function pushEntry(secret: OCIStorageSecret): PullEntry {
  return {
    name: PUSH_ENTRY, isPush: true, endpoint: secret.push
  };
}

// Every set that matches, in the order the secret lists them, then the push registry
export function pullOrder(secret: OCIStorageSecret, cluster: OCICluster): PullEntry[] {
  const sets = secret.credentialSets
    .filter((set) => setMatches(set, cluster))
    .map((set) => ({
      name: set.name, isPush: false, endpoint: set
    }));

  return [...sets, pushEntry(secret)];
}

export function secretFor(data: OCIStorageData, gitRepo: OCIGitRepo): OCIStorageSecret | null {
  const name = gitRepo.secret || FALLBACK_SECRET;

  return data.secrets.find((s) => s.name === name) || null;
}

function resultFor(cluster: OCICluster, entry: PullEntry, bundle: OCIBundle): PullResult {
  const reached = cluster.reach[entry.name] || cluster.reach[entry.endpoint.host] || cluster.defaultReach;

  if (reached === 'ok' && !entry.isPush && bundle.missingOn[entry.endpoint.host] !== undefined) {
    return 'notFound';
  }

  return reached;
}

// Agents back off from 30 seconds and double each time
export function backoff(missingMinutes: number): { attempt: number, nextMinutes: number } {
  const attempt = Math.max(1, Math.floor(Math.log2(missingMinutes / 0.5 + 1)));
  const nextMinutes = Math.max(1, Math.ceil(0.5 * (2 ** (attempt + 1) - 1) - missingMinutes));

  return { attempt, nextMinutes };
}

export function resolveDeployment(data: OCIStorageData, gitRepo: OCIGitRepo, bundle: OCIBundle, cluster: OCICluster): DeploymentStatus | null {
  const secret = secretFor(data, gitRepo);

  // Without a secret the bundle stays in etcd, which this page doesn't cover
  if (!secret) {
    return null;
  }

  const attempts: PullAttempt[] = [];
  let pulledFrom: PullEntry | null = null;

  for (const entry of pullOrder(secret, cluster)) {
    if (pulledFrom) {
      attempts.push({ entry, result: null });
      continue;
    }

    const result = resultFor(cluster, entry, bundle);

    attempts.push({ entry, result });
    if (result === 'ok') {
      pulledFrom = entry;
    }
  }

  const tried = attempts.filter((a) => a.result !== null);
  const missing = tried.filter((a) => a.result === 'notFound').map((a) => bundle.missingOn[a.entry.endpoint.host]);
  let state: DeploymentState = 'failed';

  if (pulledFrom) {
    state = attempts[0].entry === pulledFrom ? 'ready' : 'fallback';
  } else if (missing.length) {
    state = 'retrying';
  }

  return {
    key:          `${ gitRepo.name }/${ bundle.name }/${ cluster.name }`,
    gitRepo,
    bundle,
    cluster,
    secret,
    attempts,
    state,
    pulledFrom,
    firstFailure: tried.find((a) => a.result !== 'ok') || null,
    retry:        state === 'retrying' ? backoff(Math.min(...missing)) : null,
  };
}

export function resolveDeployments(data: OCIStorageData): DeploymentStatus[] {
  return data.gitRepos.flatMap((gitRepo) => gitRepo.bundles.flatMap((bundle) => gitRepo.clusters.flatMap((name) => {
    const cluster = data.clusters.find((c) => c.name === name);
    const status = cluster ? resolveDeployment(data, gitRepo, bundle, cluster) : null;

    return status ? [status] : [];
  })));
}

export function resolveSecret(data: OCIStorageData, secret: OCIStorageSecret, deployments: DeploymentStatus[]): SecretStatus {
  const gitRepos = data.gitRepos.filter((g) => secretFor(data, g)?.name === secret.name).map((g) => g.name);
  const own = deployments.filter((d) => d.secret.name === secret.name);
  const failing = own.filter((d) => d.state === 'failed').length;
  let state: SecretState = 'active';

  if (!gitRepos.length) {
    state = 'unused';
  } else if (failing) {
    state = 'error';
  }

  return {
    secret,
    state,
    isDefault:   secret.name === FALLBACK_SECRET,
    gitRepos,
    deployments: own,
    failing,
  };
}
