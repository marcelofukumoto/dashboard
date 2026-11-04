import { Selector } from '@shell/types/fleet';

export type RegistryRole = 'source' | 'mirror';
export type TlsMode = 'system' | 'customCA' | 'skipVerify';
export type RegistryAccess = 'ok' | 'unreachable' | 'auth' | 'tls' | 'notReplicated';
export type ClusterPullState = 'pulled' | 'failover' | 'waiting' | 'updatePending' | 'authFailed' | 'tlsError' | 'unreachable' | 'noRoute';
export type RegistryState = 'active' | 'replicating' | 'degraded' | 'error' | 'unused';
export type ArtifactState = 'available' | 'replicating' | 'failed';
export type ArtifactPullState = 'pulled' | 'waiting' | 'failed' | 'behind';
export type ArtifactAvailability = 'pushed' | 'available' | 'pending' | 'unknown';
export type AttemptOutcome = 'active' | 'waiting' | 'failed' | 'standby';
export type TestOutcome = 'ok' | 'warning' | 'error' | 'skipped';

export interface OCIRegistry {
  name: string;
  description: string;
  host: string;
  namespace: string;
  role: RegistryRole;
  username: string;
  hasPassword: boolean;
  agentUsername: string;
  hasAgentPassword: boolean;
  tlsMode: TlsMode;
  caBundle: string;
  basicHTTP: boolean;
  controllerAccess: RegistryAccess;
  lastPushMinutesAgo: number | null;
}

export interface OCIRoute {
  name: string;
  description: string;
  clusterNames: string[];
  clusterGroups: string[];
  selectors: Selector[];
  registries: string[];
  replicationWaitMinutes: number;
}

export interface OCICluster {
  name: string;
  labels: Record<string, string>;
  groups: string[];
  // What this cluster's agent can reach, which is what the backend would have to report
  access: Record<string, RegistryAccess>;
  defaultAccess: RegistryAccess;
  lastPullMinutesAgo: number | null;
  // First registry of the chain at the last deploy. Fleet only picks up a routing change on the next update
  appliedPrimary: string | null;
}

export interface OCIArtifact {
  bundle: string;
  sourceKind: string;
  source: string;
  id: string;
  sizeBytes: number;
  pushedMinutesAgo: number;
  clusters: string[];
  pinnedRegistry: string | null;
  // Registry name -> minutes the artifact has been missing there
  pendingOn: Record<string, number>;
}

export interface OCIStorageData {
  registries: OCIRegistry[];
  routes: OCIRoute[];
  defaultRegistries: string[];
  clusters: OCICluster[];
  artifacts: OCIArtifact[];
  isScenario: boolean;
}

export interface RegistryAttempt {
  registry: string;
  outcome: AttemptOutcome;
  access: RegistryAccess | null;
}

export interface ArtifactPull {
  artifact: OCIArtifact;
  cluster: string;
  state: ArtifactPullState;
  registry: string | null;
  minutesAgo: number | null;
  durationMs: number | null;
}

export interface ClusterStatus {
  cluster: OCICluster;
  route: OCIRoute | null;
  chain: string[];
  attempts: RegistryAttempt[];
  state: ClusterPullState;
  targetRegistry: string | null;
  pullingFrom: string | null;
  failedRegistry: string | null;
  failedAccess: RegistryAccess | null;
  waitingOn: OCIArtifact[];
  replicationWaitMinutes: number;
  pulls: ArtifactPull[];
  pulledCount: number;
}

export interface RegistryStatus {
  registry: OCIRegistry;
  state: RegistryState;
  routedClusters: string[];
  activeClusters: string[];
  failingClusters: { name: string; access: RegistryAccess }[];
  pendingArtifacts: OCIArtifact[];
  artifactCount: number;
  sizeBytes: number;
  lastPullMinutesAgo: number | null;
}

export interface ArtifactRegistryStatus {
  registry: string;
  availability: ArtifactAvailability;
  pulled: number;
  total: number;
  pendingMinutes: number | null;
}

export interface ArtifactStatus {
  artifact: OCIArtifact;
  state: ArtifactState;
  pulls: ArtifactPull[];
  registries: ArtifactRegistryStatus[];
  pulledCount: number;
}

export interface ConnectionCheck {
  key: string;
  outcome: TestOutcome;
  params: Record<string, string | number>;
}
