const ROOT = 'fleet.ociStorage';

// Table views key saved views on the schema id. These lists have no real type behind them yet
export const OCI_TABLE_SCHEMAS = {
  secret:     { id: 'fleet.cattle.io.ocistorage.secret' },
  deployment: { id: 'fleet.cattle.io.ocistorage.bundledeployment' },
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
  [OCI_TABLE_SCHEMAS.secret.id]: [
    column('secrets', 'description', 'description'),
    column('secrets', 'pushUser', 'pushUser'),
    column('secrets', 'agentUser', 'agentUser'),
    column('secrets', 'tls', 'tlsLabel'),
    column('secrets', 'setNames', 'setNames'),
    column('secrets', 'gitRepos', 'gitReposLabel'),
  ],
  [OCI_TABLE_SCHEMAS.deployment.id]: [
    column('deployments', 'pullOrder', 'orderLabel'),
    column('deployments', 'failure', 'failureLabel'),
    column('deployments', 'reference', 'reference'),
    column('deployments', 'artifact', 'artifactId'),
    column('deployments', 'attempt', 'attempt'),
    column('deployments', 'nextRetry', 'nextRetryLabel', false),
  ],
};
