import { Selector } from '@shell/types/fleet';

export type TlsMode = 'system' | 'customCA' | 'skipVerify';
// What an agent can tell from one pull. Fleet can't see replication, only that an artifact isn't there
export type PullResult = 'ok' | 'unreachable' | 'auth' | 'tls' | 'notFound';
export type DeploymentState = 'ready' | 'fallback' | 'retrying' | 'failed';
export type SecretState = 'active' | 'unused';

export interface RegistryEndpoint {
  host: string;
  namespace: string;
  agentUsername: string;
  hasAgentPassword: boolean;
  tlsMode: TlsMode;
  caBundle: string;
  basicHTTP: boolean;
}

// The keys an OCI storage secret has today: fleet apply pushes here
export interface PushRegistry extends RegistryEndpoint {
  username: string;
  hasPassword: boolean;
}

export interface CredentialSet extends RegistryEndpoint {
  name: string;
  clusterNames: string[];
  clusterGroups: string[];
  selectors: Selector[];
}

export interface OCIStorageSecret {
  name: string;
  description: string;
  push: PushRegistry;
  credentialSets: CredentialSet[];
  ageMinutes: number;
}

export interface OCICluster {
  /** Display name, which is what people see and what the scenario is written in */
  name: string;
  /** Name of the Fleet Cluster object, when the cluster exists on the server */
  fleetName?: string;
  labels: Record<string, string>;
  groups: string[];
  // What this cluster's agent gets, by credential set name first and registry host second
  reach: Record<string, PullResult>;
  defaultReach: PullResult;
  lastPullMinutesAgo: number | null;
}

export interface OCIBundle {
  name: string;
  artifactId: string;
  pushedMinutesAgo: number;
  // Registry host -> minutes the artifact has been missing there since the push
  missingOn: Record<string, number>;
}

export interface OCIGitRepo {
  name: string;
  // Null falls back to the secret named ocistorage, like an empty spec.ociRegistrySecret
  secret: string | null;
  repo?: string;
  paths?: string[];
  /** spec.targets as Fleet has them; `clusters` is what they resolve to */
  targets?: Record<string, unknown>[];
  bundles: OCIBundle[];
  clusters: string[];
}

export interface OCIStorageData {
  secrets: OCIStorageSecret[];
  gitRepos: OCIGitRepo[];
  clusters: OCICluster[];
  isScenario: boolean;
}

// One step of a cluster's pull order: a credential set, or the push registry at the end
export interface PullEntry {
  name: string;
  isPush: boolean;
  endpoint: RegistryEndpoint;
}

export interface PullAttempt {
  entry: PullEntry;
  result: PullResult | null;
}

export interface DeploymentStatus {
  key: string;
  gitRepo: OCIGitRepo;
  bundle: OCIBundle;
  cluster: OCICluster;
  secret: OCIStorageSecret;
  attempts: PullAttempt[];
  state: DeploymentState;
  pulledFrom: PullEntry | null;
  firstFailure: PullAttempt | null;
  retry: { attempt: number, nextMinutes: number } | null;
}

export interface SecretStatus {
  secret: OCIStorageSecret;
  state: SecretState;
  isDefault: boolean;
  gitRepos: string[];
}
