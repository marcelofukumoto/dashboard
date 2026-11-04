const ROOT = 'fleet.ociStorage';

// Table views key saved views on the schema id. These lists have no real type behind them yet
export const OCI_TABLE_SCHEMAS = {
  registry: { id: 'fleet.cattle.io.ocistorage.registry' },
  cluster:  { id: 'fleet.cattle.io.ocistorage.cluster' },
  artifact: { id: 'fleet.cattle.io.ocistorage.artifact' },
};

const column = (root: string, name: string, value: string, sortable = true) => ({
  header: {
    name,
    labelKey: `${ ROOT }.${ root }.optional.${ name }`,
    value,
    sort:     sortable ? [value] : false,
  },
});

// Less certain data is offered in the Columns menu, so people can try it before anyone builds it
export const OCI_OPTIONAL_HEADERS = {
  [OCI_TABLE_SCHEMAS.registry.id]: [
    column('registries', 'description', 'description'),
    column('registries', 'host', 'host'),
    column('registries', 'namespace', 'namespace'),
    column('registries', 'tls', 'tlsLabel'),
    column('registries', 'pushUser', 'pushUser'),
    column('registries', 'routes', 'routesLabel'),
    column('registries', 'failingClusters', 'failingLabel'),
  ],
  [OCI_TABLE_SCHEMAS.cluster.id]: [
    column('clusters', 'namespace', 'namespaceLabel'),
    column('clusters', 'tls', 'tlsLabel'),
    column('clusters', 'secret', 'secretRef'),
    column('clusters', 'pullOrder', 'chainLabel'),
    column('clusters', 'failedRegistry', 'failedRegistryName'),
    column('clusters', 'failure', 'failureLabel'),
    column('clusters', 'waitingOn', 'waitingOnLabel'),
    column('clusters', 'attempt', 'attempt'),
    column('clusters', 'nextRetry', 'nextRetryLabel', false),
    column('clusters', 'replicationWait', 'replicationWaitLabel'),
  ],
  [OCI_TABLE_SCHEMAS.artifact.id]: [
    column('artifacts', 'source', 'source'),
    column('artifacts', 'fullId', 'artifactId'),
    column('artifacts', 'pinned', 'pinnedLabel'),
    column('artifacts', 'waiting', 'waitingCount'),
    column('artifacts', 'failed', 'failedCount'),
  ],
};
