import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { useStateColor } from '@shell/composables/useStateColor';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CERT_MANAGER } from '../../types';
import { buildCertificateSummary, buildExpiringSoon, buildIssuerCard, buildAcmeCard } from './aggregate';
import type { OverviewRouteFn, OverviewStateCount } from './types';

/** How many certificates the "Next to Expire" list shows before it stops. */
const EXPIRING_SOON_LIMIT = 5;

/** How often the server-side summaries are refreshed while the page is visible. */
const SUMMARY_POLL_MS = 10_000;

/** cert-manager's own documentation, linked from the empty state. */
export const CERT_MANAGER_DOCS = 'https://cert-manager.io/docs/';

/** One state bucket of a summary response: a running total plus a per-namespace breakdown. */
interface SummaryStateDetail {
  total: number;
  namespace: Record<string, number>;
}
type SummaryMap = Record<string, SummaryStateDetail>;

/** The slice of a Steve `summaryonly` response the overview reads. */
interface SummaryResponse {
  summary?: {
    property: string;
    counts: Record<string, { total?: number; namespace?: Record<string, number> }>;
  }[];
}

// Summaries group on Steve's derived state. Free-form status fields (an Order's `status.state`) are
// not summarisable - Steve rejects them with 422 - so every type uses `metadata.state.name`. That is
// the same field the issuer/order lists sort on, so the cards stay in step with the lists.
const SUMMARY_PROPERTY = 'metadata.state.name';

/**
 * A type whose overview card needs only counts-by-state, so it is fetched as a server-side summary
 * (`summaryonly`) instead of loading every resource. `namespaced` drives whether the namespace
 * filter narrows it and whether the per-namespace breakdown is requested - Steve 500s on
 * `summarynamespaced` for a cluster-scoped type (ClusterIssuer).
 */
interface SummarySpec {
  type: string;
  namespaced: boolean;
}

const SUMMARY_SPECS: SummarySpec[] = [
  { type: CERT_MANAGER.ISSUER, namespaced: true },
  { type: CERT_MANAGER.CLUSTER_ISSUER, namespaced: false },
  { type: CERT_MANAGER.ORDER, namespaced: true },
];

/**
 * Backs the cert-manager overview page.
 *
 * Issuers, ClusterIssuers and Orders need only counts by state, so they come from server-side
 * summaries (`summary=<field>&summaryonly&summarynamespaced`) rather than loading every resource -
 * the same approach as the workload dashboard. Certificates stay fully loaded (`cluster/all`): the
 * by-state "expiring" bucket and the "Next to Expire" list are client-side calculations over
 * `status.notAfter`, which a summary cannot express.
 */
export function useCertManagerOverview() {
  const store = useStore();
  const { t } = useI18n(store);
  const { toStateColor } = useStateColor();

  const loading = ref(true);
  const fetchError = ref<string | null>(null);
  const summaries = ref<Record<string, SummaryMap>>({});

  const clusterId = computed<string>(() => store.getters['clusterId']);

  // ── Namespace filtering ──
  // Issuers, Certificates and Orders are namespaced, so they honour the namespace filter.
  // ClusterIssuers are cluster scoped and always shown in full.

  const isAllNamespaces = computed<boolean>(() => store.getters['isAllNamespaces']);
  const namespaceCache = computed<Record<string, boolean>>(() => store.getters['activeNamespaceCache'] || {});

  function inSelectedNamespace(resource: any): boolean {
    return isAllNamespaces.value || !!namespaceCache.value[resource?.metadata?.namespace];
  }

  const certificates = computed<any[]>(() => (store.getters['cluster/all'](CERT_MANAGER.CERTIFICATE) || []).filter(inSelectedNamespace));

  // ── Summary → state counts ──
  // The per-namespace breakdown lets the namespace filter narrow the counts client-side, so moving
  // the filter recomputes the cards without another request.

  function sumSelectedNamespaces(ns: Record<string, number>): number {
    return Object.entries(ns).reduce((sum, [name, count]) => sum + (namespaceCache.value[name] ? count : 0), 0);
  }

  function countsFor(spec: SummarySpec): OverviewStateCount[] {
    const map = summaries.value[spec.type] || {};
    const out: OverviewStateCount[] = [];

    for (const [state, detail] of Object.entries(map)) {
      const count = spec.namespaced && !isAllNamespaces.value ? sumSelectedNamespaces(detail.namespace) : detail.total;

      if (count > 0) {
        out.push({
          state, count, color: toStateColor(state, spec.type)
        });
      }
    }

    return out;
  }

  const countsByType = computed<Record<string, OverviewStateCount[]>>(() => {
    const out: Record<string, OverviewStateCount[]> = {};

    for (const spec of SUMMARY_SPECS) {
      out[spec.type] = countsFor(spec);
    }

    return out;
  });

  const issuerCounts = computed<OverviewStateCount[]>(() => countsByType.value[CERT_MANAGER.ISSUER] || []);
  const clusterIssuerCounts = computed<OverviewStateCount[]>(() => countsByType.value[CERT_MANAGER.CLUSTER_ISSUER] || []);
  const orderCounts = computed<OverviewStateCount[]>(() => countsByType.value[CERT_MANAGER.ORDER] || []);

  const totalOf = (counts: OverviewStateCount[]): number => counts.reduce((sum, c) => sum + c.count, 0);

  // ── Routing ──

  // Links a card to its resource list. We deliberately do not pre-filter by state: the list filters
  // on Steve's generic `metadata.state.name`, which does not match the domain state this overview
  // computes (expiring, in-progress, ...), so a `?stateFilter=` deep-link returns empty or
  // mismatched results. See utils/state.ts.
  const resourceRoute: OverviewRouteFn = (type: string): RouteLocationRaw => ({
    name:   'c-cluster-product-resource',
    params: {
      cluster: clusterId.value, product: 'explorer', resource: type
    },
  });

  function createRoute(type: string): RouteLocationRaw {
    return {
      name:   'c-cluster-product-resource-create',
      params: {
        cluster: clusterId.value, product: 'explorer', resource: type
      },
    };
  }

  // Clears the namespace filter - offered from the partial empty state, since a filtered-out
  // namespace is a common reason to see no certificates.
  function resetNamespaceFilter(): void {
    store.dispatch('switchNamespaces', { ids: [], key: clusterId.value });
  }

  // ── Presence flags ──

  const hasCertificates = computed<boolean>(() => certificates.value.length > 0);
  const hasIssuers = computed<boolean>(() => totalOf(issuerCounts.value) > 0 || totalOf(clusterIssuerCounts.value) > 0);
  const hasContent = computed<boolean>(() => hasCertificates.value || hasIssuers.value);

  // ── View models ──

  const certificateSummary = computed(() => buildCertificateSummary(certificates.value, t, resourceRoute));

  // Time-to-expiry is measured against a single "now", captured once so the list does not drift
  // while the page is open.
  const now = Date.now();

  const expiringSoon = computed(() => buildExpiringSoon(certificates.value, now, EXPIRING_SOON_LIMIT, t));

  const issuerCards = computed(() => [
    buildIssuerCard('issuers', t('typeLabel."cert-manager.io.issuer"', { count: 2 }).trim(), CERT_MANAGER.ISSUER, issuerCounts.value, resourceRoute, { to: createRoute(CERT_MANAGER.ISSUER), label: t('certManager.overview.create.issuer') }, t('certManager.overview.emptyCard.issuers')),
    buildIssuerCard('clusterIssuers', t('typeLabel."cert-manager.io.clusterissuer"', { count: 2 }).trim(), CERT_MANAGER.CLUSTER_ISSUER, clusterIssuerCounts.value, resourceRoute, { to: createRoute(CERT_MANAGER.CLUSTER_ISSUER), label: t('certManager.overview.create.clusterIssuer') }, t('certManager.overview.emptyCard.clusterIssuers')),
  ]);

  // Orders (and only Orders) make up ACME activity. The card is hidden entirely when there are no
  // orders - they are auto-created, never authored, so an empty card would be noise.
  const acmeCards = computed(() => [
    buildAcmeCard('orders', t('typeLabel."acme.cert-manager.io.order"', { count: 2 }).trim(), CERT_MANAGER.ORDER, orderCounts.value, resourceRoute),
  ]);

  const showAcmeSection = computed<boolean>(() => totalOf(orderCounts.value) > 0);
  const showIssuersSection = computed<boolean>(() => hasIssuers.value);

  // ── Subtitle ──

  const subtitle = computed<string>(() => {
    const count = certificates.value.length;
    const scope = isAllNamespaces.value ? t('certManager.overview.subtitle.allNamespaces') : t('certManager.overview.subtitle.filtered');

    return `${ scope } ${ t('certManager.overview.certificateCount', { count }) }`;
  });

  // ── Fetching ──

  function parseSummary(res: SummaryResponse, property: string): SummaryMap {
    const out: SummaryMap = {};

    for (const s of (res?.summary || [])) {
      if (s.property !== property) {
        continue;
      }

      for (const [state, detail] of Object.entries(s.counts || {})) {
        out[state] = { total: detail?.total || 0, namespace: detail?.namespace || {} };
      }
    }

    return out;
  }

  async function fetchSummaries(): Promise<void> {
    const next: Record<string, SummaryMap> = {};

    await Promise.all(SUMMARY_SPECS.map(async(spec) => {
      // Skip anything the user cannot read - no schema, no request.
      if (!store.getters['cluster/schemaFor'](spec.type)) {
        return;
      }

      try {
        // `summarynamespaced` gives the per-namespace breakdown the filter needs, but Steve 500s on
        // it for a cluster-scoped type, so only namespaced types ask for it.
        const perNamespace = spec.namespaced ? '&summarynamespaced' : '';
        const url = `${ store.getters['cluster/urlFor'](spec.type) }&summary=${ SUMMARY_PROPERTY }&summaryonly${ perNamespace }`;
        const res: SummaryResponse = await store.dispatch('cluster/request', { url });

        next[spec.type] = parseSummary(res, SUMMARY_PROPERTY);
      } catch (e) {
        // Degrade quietly - a type whose summary fails just drops its card, it does not break the page.
        console.warn(`cert-manager overview: summary request failed for ${ spec.type }`, e); // eslint-disable-line no-console
      }
    }));

    summaries.value = next;
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function stopPollTimer(): void {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function startPollTimer(): void {
    stopPollTimer();
    pollTimer = setInterval(fetchSummaries, SUMMARY_POLL_MS);
  }

  function handleVisibilityChange(): void {
    if (document.hidden) {
      stopPollTimer();
    } else {
      fetchSummaries();
      startPollTimer();
    }
  }

  onMounted(async() => {
    try {
      // Certificates stay fully loaded (see the composable header) and are kept live by the store.
      await checkSchemasForFindAllHash({ [CERT_MANAGER.CERTIFICATE]: { inStoreType: 'cluster', type: CERT_MANAGER.CERTIFICATE } }, store);
      await fetchSummaries();
    } catch (e: unknown) {
      fetchError.value = e instanceof Error ? e.message : t('certManager.overview.error');
    } finally {
      loading.value = false;
    }

    startPollTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    stopPollTimer();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    loading,
    fetchError,
    hasContent,
    hasCertificates,
    subtitle,
    certificateSummary,
    expiringSoon,
    issuerCards,
    acmeCards,
    showAcmeSection,
    showIssuersSection,
    createRoute,
    resetNamespaceFilter,
  };
}
