<script>
import {
  NODE, NAMESPACE, SERVICE, SECRET, CONFIG_MAP, INGRESS,
  POD, WORKLOAD_TYPES, COUNT
} from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

/**
 * Resource Summary API — Explorer & Investigation Dashboard
 *
 * Source:  https://github.com/rancher/rancher/issues/51337
 * API:    GET /v1/{resource}?summary={property1},{property2}
 * Returns: { summary: [{ property: "...", counts: {...} }, ...] }
 *
 * This page demonstrates and explores the Summary API across many resource types —
 * not just workloads — to help developers understand the API's capabilities.
 */

// ── Resource Types to Explore ──
const EXPLORE_TYPES = {
  [POD]: {
    label: 'Pods',
    icon:  'icon-pod',
    group: 'workload',
  },
  [WORKLOAD_TYPES.DEPLOYMENT]: {
    label: 'Deployments',
    icon:  'icon-deployment',
    group: 'workload',
  },
  [WORKLOAD_TYPES.DAEMON_SET]: {
    label: 'DaemonSets',
    icon:  'icon-daemonset',
    group: 'workload',
  },
  [WORKLOAD_TYPES.STATEFUL_SET]: {
    label: 'StatefulSets',
    icon:  'icon-statefulset',
    group: 'workload',
  },
  [WORKLOAD_TYPES.JOB]: {
    label: 'Jobs',
    icon:  'icon-job',
    group: 'workload',
  },
  [WORKLOAD_TYPES.CRON_JOB]: {
    label: 'CronJobs',
    icon:  'icon-cronjob',
    group: 'workload',
  },
  [NODE]: {
    label: 'Nodes',
    icon:  'icon-host',
    group: 'cluster',
  },
  [NAMESPACE]: {
    label: 'Namespaces',
    icon:  'icon-namespace',
    group: 'cluster',
  },
  [SERVICE]: {
    label: 'Services',
    icon:  'icon-service',
    group: 'networking',
  },
  [INGRESS]: {
    label: 'Ingresses',
    icon:  'icon-service',
    group: 'networking',
  },
  [SECRET]: {
    label: 'Secrets',
    icon:  'icon-storage',
    group: 'storage',
  },
  [CONFIG_MAP]: {
    label: 'ConfigMaps',
    icon:  'icon-storage',
    group: 'storage',
  },
};

// ── Exploration Queries ──
// Each section showcases a different Summary API capability

const EXPLORE_SECTIONS = [
  // ── Section: Cluster-Wide Resource Distribution ──
  {
    id:          'cluster-overview',
    title:       'Cluster-Wide Resource Distribution',
    description: 'Which namespaces hold the most resources? The Summary API groups any type by metadata.namespace without fetching individual objects.',
    queries:     [
      {
        id:       'pods-by-ns',
        title:    'Pods by Namespace',
        desc:     'Where pod density is highest — helps identify busy namespaces.',
        apiCall:  'GET /v1/pods?summary=metadata.namespace',
        resource: POD,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-pod',
      },
      {
        id:       'services-by-ns',
        title:    'Services by Namespace',
        desc:     'Service distribution — most services typically live in system namespaces.',
        apiCall:  'GET /v1/service?summary=metadata.namespace',
        resource: SERVICE,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-service',
      },
      {
        id:       'secrets-by-ns',
        title:    'Secrets by Namespace',
        desc:     'Secret usage across namespaces — each namespace has at least a default service account secret.',
        apiCall:  'GET /v1/secrets?summary=metadata.namespace',
        resource: SECRET,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-storage',
      },
      {
        id:       'configmaps-by-ns',
        title:    'ConfigMaps by Namespace',
        desc:     'Configuration data distribution.',
        apiCall:  'GET /v1/configmaps?summary=metadata.namespace',
        resource: CONFIG_MAP,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-storage',
      },
    ],
  },

  // ── Section: State Analysis ──
  {
    id:          'state-analysis',
    title:       'State Analysis (metadata.state.name)',
    description: 'Rancher enriches resources with a computed state field. Querying metadata.state.name reveals health at a glance without loading individual objects.',
    queries:     [
      {
        id:       'pods-state',
        title:    'Pods by State',
        desc:     'Running, succeeded, error, waiting — the pulse of the cluster.',
        apiCall:  'GET /v1/pods?summary=metadata.state.name',
        resource: POD,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-pod',
      },
      {
        id:       'deployments-state',
        title:    'Deployments by State',
        desc:     'Active vs updating vs errored deployments.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.state.name',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-deployment',
      },
      {
        id:       'nodes-state',
        title:    'Nodes by State',
        desc:     'Node health — are all nodes active and ready?',
        apiCall:  'GET /v1/nodes?summary=metadata.state.name',
        resource: NODE,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-host',
      },
      {
        id:       'ingresses-state',
        title:    'Ingresses by State',
        desc:     'Ingress health — active, warning, or errored.',
        apiCall:  `GET /v1/${ INGRESS }?summary=metadata.state.name`,
        resource: INGRESS,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-service',
      },
    ],
  },

  // ── Section: Spec Field Exploration ──
  {
    id:          'spec-fields',
    title:       'Spec Field Exploration',
    description: 'The Summary API works with any dot-path property — not just metadata. Query spec fields to understand workload configuration patterns.',
    queries:     [
      {
        id:       'services-by-type',
        title:    'Services by Type',
        desc:     'ClusterIP, NodePort, LoadBalancer, ExternalName — which service types are in use.',
        apiCall:  'GET /v1/service?summary=spec.type',
        resource: SERVICE,
        props:    'spec.type',
        extract:  'spec.type',
        icon:     'icon-service',
      },
      {
        id:       'pods-by-restart',
        title:    'Pods by Restart Policy',
        desc:     'Always (long-running), OnFailure (jobs), Never (one-shot).',
        apiCall:  'GET /v1/pods?summary=spec.restartPolicy',
        resource: POD,
        props:    'spec.restartPolicy',
        extract:  'spec.restartPolicy',
        icon:     'icon-pod',
      },
      {
        id:       'deploy-by-strategy',
        title:    'Deployments by Strategy',
        desc:     'RollingUpdate vs Recreate — zero-downtime or full restart.',
        apiCall:  'GET /v1/apps.deployments?summary=spec.strategy.type',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'spec.strategy.type',
        extract:  'spec.strategy.type',
        icon:     'icon-deployment',
      },
      {
        id:       'secrets-by-type',
        title:    'Secrets by Type',
        desc:     'Opaque, kubernetes.io/tls, kubernetes.io/service-account-token — the mix of secret types.',
        apiCall:  'GET /v1/secrets?summary=type',
        resource: SECRET,
        props:    'type',
        extract:  'type',
        icon:     'icon-storage',
      },
    ],
  },

  // ── Section: Label Queries (Bracket Notation) ──
  {
    id:          'label-queries',
    title:       'Label Queries (Bracket Notation)',
    description: 'For label keys containing dots or slashes, the Summary API uses bracket notation: metadata.labels[key]. This enables grouping by any Kubernetes recommended label.',
    queries:     [
      {
        id:       'pods-managed-by',
        title:    'Pods by app.kubernetes.io/managed-by',
        desc:     'Who manages these pods — Helm, Rancher, kubectl, Flux, Argo.',
        apiCall:  'GET /v1/pods?summary=metadata.labels[app.kubernetes.io/managed-by]',
        resource: POD,
        props:    'metadata.labels[app.kubernetes.io/managed-by]',
        extract:  'metadata.labels[app.kubernetes.io/managed-by]',
        icon:     'icon-pod',
      },
      {
        id:       'pods-app-name',
        title:    'Pods by app.kubernetes.io/name',
        desc:     'Standard application name label — which apps have the most pods.',
        apiCall:  'GET /v1/pods?summary=metadata.labels[app.kubernetes.io/name]',
        resource: POD,
        props:    'metadata.labels[app.kubernetes.io/name]',
        extract:  'metadata.labels[app.kubernetes.io/name]',
        icon:     'icon-pod',
      },
      {
        id:       'deploy-part-of',
        title:    'Deployments by app.kubernetes.io/part-of',
        desc:     'Higher-level application grouping — which systems do deployments belong to.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.labels[app.kubernetes.io/part-of]',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.labels[app.kubernetes.io/part-of]',
        extract:  'metadata.labels[app.kubernetes.io/part-of]',
        icon:     'icon-deployment',
      },
      {
        id:       'services-app-name',
        title:    'Services by app.kubernetes.io/name',
        desc:     'Which applications expose services.',
        apiCall:  'GET /v1/service?summary=metadata.labels[app.kubernetes.io/name]',
        resource: SERVICE,
        props:    'metadata.labels[app.kubernetes.io/name]',
        extract:  'metadata.labels[app.kubernetes.io/name]',
        icon:     'icon-service',
      },
    ],
  },

  // ── Section: Multi-Property Queries ──
  {
    id:          'multi-property',
    title:       'Multi-Property Queries',
    description: 'Comma-separate multiple properties in a single request. Each returns its own independent count map — no extra round-trips needed.',
    queries:     [
      {
        id:       'pods-triple',
        title:    'Pods: Node + Phase + QoS',
        desc:     'Three dimensions of pod scheduling in one API call.',
        apiCall:  'GET /v1/pods?summary=spec.nodeName,status.phase,status.qosClass',
        resource: POD,
        props:    'spec.nodeName,status.phase,status.qosClass',
        extract:  null,
        multi:    true,
        icon:     'icon-pod',
      },
      {
        id:       'deploy-triple',
        title:    'Deployments: Namespace + State + Strategy',
        desc:     'Location, health, and configuration — all in one request.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.namespace,metadata.state.name,spec.strategy.type',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.namespace,metadata.state.name,spec.strategy.type',
        extract:  null,
        multi:    true,
        icon:     'icon-deployment',
      },
      {
        id:       'services-double',
        title:    'Services: Namespace + Type',
        desc:     'Where services live and what types they are.',
        apiCall:  'GET /v1/service?summary=metadata.namespace,spec.type',
        resource: SERVICE,
        props:    'metadata.namespace,spec.type',
        extract:  null,
        multi:    true,
        icon:     'icon-service',
      },
    ],
  },
];

export default {
  name:       'SummaryApiExplorer',
  components: { Loading, Banner },

  async fetch() {
    this.loading = true;

    try {
      // 1) Per-type overview (state counts for grand totals)
      const overviewPromises = Object.keys(EXPLORE_TYPES).map(async(type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (!schema) {
          return {
            type, summary: null, error: `No schema — no access to ${ type }`
          };
        }

        try {
          const res = await this.$store.dispatch('cluster/request', { url: `/v1/${ type }?summary=metadata.state.name` });

          return {
            type, summary: res.summary || [], error: null
          };
        } catch (e) {
          return {
            type, summary: null, error: e.message || `Failed to fetch ${ type }`
          };
        }
      });

      this.overviewResults = await Promise.all(overviewPromises);

      // 2) Exploration sections — flatten, fetch in parallel, re-group
      const allQueries = EXPLORE_SECTIONS.flatMap((s) => s.queries.map((q) => ({
        ...q,
        sectionId: s.id
      })));

      const queryPromises = allQueries.map(async(query) => {
        const schema = this.$store.getters['cluster/schemaFor'](query.resource);

        if (!schema) {
          return {
            ...query, data: null, error: `No schema — no access to ${ query.resource }`
          };
        }

        try {
          const res = await this.$store.dispatch('cluster/request', { url: `/v1/${ query.resource }?summary=${ query.props }` });

          return {
            ...query, data: res.summary || [], error: null
          };
        } catch (e) {
          return {
            ...query, data: null, error: e.message || 'Failed to fetch'
          };
        }
      });

      const results = await Promise.all(queryPromises);

      this.sectionResults = EXPLORE_SECTIONS.map((s) => ({
        ...s,
        results: results.filter((r) => r.sectionId === s.id),
      }));
    } catch (e) {
      this.fetchError = e.message || 'Failed to load Summary API data';
    } finally {
      this.loading = false;
    }

    // Existing COUNT store data for comparison
    try {
      const inStore = this.$store.getters['currentStore'](COUNT);

      this.existingCounts = this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
    } catch (e) {
      this.existingCounts = {};
    }
  },

  data() {
    return {
      loading:         true,
      overviewResults: [],
      sectionResults:  [],
      existingCounts:  {},
      fetchError:      null,
      EXPLORE_TYPES,
      EXPLORE_SECTIONS,
    };
  },

  computed: {
    overviewData() {
      return this.overviewResults.map((entry) => {
        const config = EXPLORE_TYPES[entry.type] || {
          label: entry.type, icon: 'icon-default', group: 'other'
        };
        const stateCounts = {};
        let total = 0;

        if (entry.summary) {
          for (const s of entry.summary) {
            if (s.property === 'metadata.state.name') {
              Object.assign(stateCounts, s.counts);
              total = Object.values(s.counts).reduce((sum, c) => sum + c, 0);
            }
          }
        }

        return {
          type:  entry.type,
          label: config.label,
          icon:  config.icon,
          group: config.group,
          total,
          stateCounts,
          error: entry.error,
          raw:   entry.summary,
        };
      });
    },

    grandTotals() {
      const totals = {
        resources:    0,
        types:        0,
        states:       {},
        accessErrors: 0,
      };

      for (const item of this.overviewData) {
        if (item.error) {
          totals.accessErrors++;
        } else {
          totals.types++;
          totals.resources += item.total;
          for (const [state, count] of Object.entries(item.stateCounts)) {
            totals.states[state] = (totals.states[state] || 0) + count;
          }
        }
      }

      return totals;
    },

    countStoreComparison() {
      return Object.keys(EXPLORE_TYPES).map((type) => {
        const config = EXPLORE_TYPES[type];
        const existing = this.existingCounts[type];
        const summaryItem = this.overviewData.find((d) => d.type === type);

        return {
          type,
          label:            config.label,
          countStoreTotal:  existing?.summary?.count ?? '—',
          countStoreStates: existing?.summary?.states || {},
          summaryApiTotal:  summaryItem?.total ?? '—',
          summaryApiStates: summaryItem?.stateCounts || {},
        };
      });
    },

    totalQueries() {
      return EXPLORE_SECTIONS.reduce((sum, s) => sum + s.queries.length, 0) +
        Object.keys(EXPLORE_TYPES).length;
    },
  },

  methods: {
    stateColor(state) {
      const colors = {
        running:          '#27AE60',
        active:           '#27AE60',
        ready:            '#27AE60',
        completed:        '#8E8E8E',
        succeeded:        '#8E8E8E',
        waiting:          '#F39C12',
        pending:          '#F39C12',
        suspended:        '#F39C12',
        updating:         '#F39C12',
        failed:           '#E74C3C',
        error:            '#E74C3C',
        crashloopbackoff: '#E74C3C',
      };

      return colors[state.toLowerCase()] || '#3498DB';
    },

    barColor(index) {
      const palette = [
        '#3498DB', '#2ECC71', '#E67E22', '#9B59B6',
        '#1ABC9C', '#E74C3C', '#F1C40F', '#34495E',
        '#16A085', '#D35400', '#8E44AD', '#2C3E50',
      ];

      return palette[index % palette.length];
    },

    sortedEntries(obj) {
      return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    },

    maxCount(obj) {
      const vals = Object.values(obj);

      return vals.length ? Math.max(...vals) : 1;
    },

    cardData(result) {
      if (result.multi) {
        return {
          multi:      true,
          properties: (result.data || []).map((s) => ({
            property: s.property,
            counts:   s.counts || {},
            total:    Object.values(s.counts || {}).reduce((sum, c) => sum + c, 0),
          })),
        };
      }

      const counts = {};
      let total = 0;

      if (result.data && result.extract) {
        const match = result.data.find((s) => s.property === result.extract);

        if (match) {
          Object.assign(counts, match.counts);
          total = Object.values(match.counts).reduce((sum, c) => sum + c, 0);
        }
      }

      return {
        multi: false, counts, total
      };
    },
  },
};
</script>

<template>
  <Loading v-if="loading || $fetchState.pending" />
  <div
    v-else
    class="summary-api-explorer"
  >
    <!-- ━━━ Page Header ━━━ -->
    <h1 class="mb-10">
      <i class="icon icon-info mr-10" /> Resource Summary API Explorer
    </h1>
    <p class="page-subtitle mb-10">
      Interactive investigation of the <strong>Resource Summary API</strong>
      (<a
        href="https://github.com/rancher/rancher/issues/51337"
        target="_blank"
        rel="noopener noreferrer"
      >rancher/rancher#51337</a>) —
      <strong>{{ totalQueries }}</strong> live queries across
      <strong>{{ EXPLORE_SECTIONS.length + 2 }}</strong> sections covering
      <strong>{{ Object.keys(EXPLORE_TYPES).length }}</strong> resource types.
    </p>
    <p class="page-subtitle mb-20">
      <code>GET /v1/{resource}?summary={property1},{property2}</code> →
      returns <code>{ summary: [{ property, counts }] }</code> without loading individual objects.
    </p>

    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ Section 1: Grand Totals ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">1</span>
        Grand Totals
      </h2>
      <p class="description mt-5 mb-15">
        Aggregated from <code>GET /v1/{type}?summary=metadata.state.name</code> for all
        {{ Object.keys(EXPLORE_TYPES).length }} resource types.
      </p>
      <div class="totals-grid">
        <div class="total-card total-card-primary">
          <span class="total-number">{{ grandTotals.resources }}</span>
          <span class="total-label">Total Resources</span>
        </div>
        <div class="total-card">
          <span class="total-number">{{ grandTotals.types }}</span>
          <span class="total-label">Types Accessible</span>
        </div>
        <div
          v-for="[state, count] in sortedEntries(grandTotals.states).slice(0, 6)"
          :key="state"
          class="total-card"
        >
          <span
            class="total-number"
            :style="{ color: stateColor(state) }"
          >{{ count }}</span>
          <span class="total-label">{{ state }}</span>
        </div>
        <div
          v-if="grandTotals.accessErrors > 0"
          class="total-card"
        >
          <span
            class="total-number"
            style="color: #E74C3C"
          >{{ grandTotals.accessErrors }}</span>
          <span class="total-label">No Access</span>
        </div>
      </div>
    </div>

    <!-- ━━━ Section 2: Per-Resource Overview ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">2</span>
        Per-Resource Type Overview
      </h2>
      <p class="description mt-5 mb-15">
        Each card queries <code>GET /v1/{type}?summary=metadata.state.name</code> —
        one property, one request per resource type.
      </p>

      <div class="resource-grid">
        <div
          v-for="item in overviewData"
          :key="item.type"
          class="resource-card"
        >
          <div class="resource-header">
            <h3>
              <i :class="['icon', item.icon, 'mr-5']" />
              {{ item.label }}
            </h3>
            <span class="resource-total">{{ item.total }}</span>
          </div>
          <div class="resource-type-badge">
            {{ item.type }}
          </div>

          <Banner
            v-if="item.error"
            color="warning"
            class="mt-10"
          >
            {{ item.error }}
          </Banner>

          <div
            v-else-if="Object.keys(item.stateCounts).length"
            class="state-list mt-10"
          >
            <div
              v-for="[state, count] in sortedEntries(item.stateCounts)"
              :key="state"
              class="state-item"
            >
              <span
                class="state-dot"
                :style="{ backgroundColor: stateColor(state) }"
              />
              <span class="state-name">{{ state }}</span>
              <span class="state-count">{{ count }}</span>
            </div>
          </div>

          <details class="mt-10">
            <summary class="raw-toggle">
              Raw API Response
            </summary>
            <pre class="raw-json">{{ JSON.stringify(item.raw, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- ━━━ Exploration Sections (3 .. N) ━━━ -->
    <div
      v-for="(section, sIdx) in sectionResults"
      :key="section.id"
      class="section mb-30"
    >
      <h2>
        <span class="section-number">{{ sIdx + 3 }}</span>
        {{ section.title }}
      </h2>
      <p class="description mt-5 mb-15">
        {{ section.description }}
      </p>

      <div class="insight-grid">
        <div
          v-for="(result, rIdx) in section.results"
          :key="result.id"
          class="insight-card"
        >
          <div class="insight-header">
            <h3>
              <i :class="['icon', result.icon, 'mr-5']" />
              {{ result.title }}
            </h3>
            <span
              v-if="!result.multi && cardData(result).total"
              class="insight-total"
            >{{ cardData(result).total }}</span>
          </div>

          <p class="insight-desc">
            {{ result.desc }}
          </p>

          <div class="insight-api">
            <code>{{ result.apiCall }}</code>
          </div>

          <Banner
            v-if="result.error"
            color="warning"
            class="mt-10"
          >
            {{ result.error }}
          </Banner>

          <!-- Multi-property results -->
          <template v-else-if="cardData(result).multi">
            <div
              v-for="(prop, pIdx) in cardData(result).properties"
              :key="prop.property"
              class="multi-prop-section mt-10"
            >
              <h4 class="multi-prop-label">
                {{ prop.property }}
                <span class="multi-prop-total">({{ prop.total }})</span>
              </h4>
              <div
                v-if="Object.keys(prop.counts).length"
                class="insight-bars"
              >
                <div
                  v-for="([key, count], idx) in sortedEntries(prop.counts).slice(0, 8)"
                  :key="key"
                  class="insight-bar-row"
                >
                  <span class="insight-bar-label">{{ key || '(empty)' }}</span>
                  <div class="insight-bar-track">
                    <div
                      class="insight-bar-fill"
                      :style="{
                        width: (count / maxCount(prop.counts) * 100) + '%',
                        backgroundColor: barColor(pIdx * 4 + idx)
                      }"
                    />
                  </div>
                  <span class="insight-bar-count">{{ count }}</span>
                </div>
                <div
                  v-if="sortedEntries(prop.counts).length > 8"
                  class="insight-bar-more"
                >
                  ... and {{ sortedEntries(prop.counts).length - 8 }} more values
                </div>
              </div>
            </div>
          </template>

          <!-- Single-property results -->
          <div
            v-else-if="Object.keys(cardData(result).counts).length"
            class="insight-bars mt-10"
          >
            <div
              v-for="([key, count], idx) in sortedEntries(cardData(result).counts).slice(0, 10)"
              :key="key"
              class="insight-bar-row"
            >
              <span class="insight-bar-label">{{ key || '(empty)' }}</span>
              <div class="insight-bar-track">
                <div
                  class="insight-bar-fill"
                  :style="{
                    width: (count / maxCount(cardData(result).counts) * 100) + '%',
                    backgroundColor: barColor(rIdx * 3 + idx)
                  }"
                />
              </div>
              <span class="insight-bar-count">{{ count }}</span>
            </div>
            <div
              v-if="sortedEntries(cardData(result).counts).length > 10"
              class="insight-bar-more"
            >
              ... and {{ sortedEntries(cardData(result).counts).length - 10 }} more values
            </div>
          </div>
          <div
            v-else-if="!result.error"
            class="insight-empty mt-10"
          >
            No data returned for this query.
          </div>

          <details class="mt-10">
            <summary class="raw-toggle">
              Raw API Response
            </summary>
            <pre class="raw-json">{{ JSON.stringify(result.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- ━━━ COUNT Store Comparison ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">{{ EXPLORE_SECTIONS.length + 3 }}</span>
        Comparison: /v1/counts vs ?summary=
      </h2>
      <p class="description mt-5 mb-15">
        The existing <code>/v1/counts</code> endpoint returns fixed-shape totals for <strong>all</strong> types at once.
        The <code>?summary=</code> parameter returns counts grouped by <strong>any property you specify</strong> — per type, per request.
      </p>

      <div class="feature-comparison mb-20">
        <div class="feature-col">
          <h3 class="feature-title feature-old">
            /v1/counts (existing)
          </h3>
          <ul class="feature-list">
            <li>One request → all types</li>
            <li>Fixed shape: total + state breakdown</li>
            <li>Per-namespace counts</li>
            <li>WebSocket updates via COUNT subscription</li>
            <li>Used by: nav tree, ResourceSummary.vue, home page</li>
          </ul>
        </div>
        <div class="feature-col">
          <h3 class="feature-title feature-new">
            ?summary= (new)
          </h3>
          <ul class="feature-list">
            <li>One request per type</li>
            <li>Any property: spec, status, labels, metadata</li>
            <li>Multiple properties per request</li>
            <li>Bracket notation for label keys</li>
            <li>Used by: workload-dashboard, this page</li>
          </ul>
        </div>
      </div>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>/v1/counts Total</th>
            <th>?summary= Total</th>
            <th>/v1/counts States</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in countStoreComparison"
            :key="item.type"
          >
            <td>{{ item.label }}</td>
            <td>{{ item.countStoreTotal }}</td>
            <td>{{ item.summaryApiTotal }}</td>
            <td>
              <span
                v-for="[state, count] in Object.entries(item.countStoreStates)"
                :key="state"
                class="inline-state"
              >
                {{ state }}: {{ count }}
              </span>
              <span v-if="!Object.keys(item.countStoreStates).length">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ━━━ API Reference ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">{{ EXPLORE_SECTIONS.length + 4 }}</span>
        API Reference
      </h2>
      <p class="description mt-10 mb-15">
        The Resource Summary API (<a
          href="https://github.com/rancher/rancher/issues/51337"
          target="_blank"
          rel="noopener noreferrer"
        >rancher/rancher#51337</a>) accepts any dot-path property.
        Merged in
        <a
          href="https://github.com/rancher/steve/pull/948"
          target="_blank"
          rel="noopener noreferrer"
        >steve#948</a> and
        <a
          href="https://github.com/rancher/apiserver/pull/210"
          target="_blank"
          rel="noopener noreferrer"
        >apiserver#210</a>.
        Milestone: v2.14.0.
      </p>

      <h3 class="mt-20 mb-10">
        Syntax
      </h3>
      <div class="syntax-block">
        <code>GET /v1/{resource}?summary={property1},{property2},{propertyN}</code>
      </div>

      <h3 class="mt-20 mb-10">
        Response Shape
      </h3>
      <pre class="raw-json mb-20">{
  "summary": [
    { "property": "metadata.state.name", "counts": { "active": 38, "error": 2 } },
    { "property": "metadata.namespace",  "counts": { "default": 20, "kube-system": 12 } }
  ]
}</pre>

      <h3 class="mt-20 mb-10">
        Property Syntax Examples
      </h3>
      <table class="api-ref-table mt-5">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Example</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dot-path</td>
            <td><code>metadata.namespace</code></td>
            <td>Standard nested field access</td>
          </tr>
          <tr>
            <td>Deep dot-path</td>
            <td><code>spec.strategy.type</code></td>
            <td>Works at any nesting depth</td>
          </tr>
          <tr>
            <td>Bracket notation</td>
            <td><code>metadata.labels[app.kubernetes.io/name]</code></td>
            <td>Required for keys containing dots or slashes</td>
          </tr>
          <tr>
            <td>Top-level field</td>
            <td><code>type</code></td>
            <td>Works for root-level properties (e.g., Secret type)</td>
          </tr>
          <tr>
            <td>Multi-property</td>
            <td><code>metadata.namespace,spec.type</code></td>
            <td>Comma-separated, each returns its own count map</td>
          </tr>
        </tbody>
      </table>

      <h3 class="mt-20 mb-10">
        Dashboard Integration Pattern
      </h3>
      <div class="syntax-block">
        <code>const schema = this.$store.getters['cluster/schemaFor'](type);</code>
      </div>
      <div class="syntax-block mt-5">
        <code>const res = await this.$store.dispatch('cluster/request', { url: `/v1/${'{type}'}?summary=${'{props}'}` });</code>
      </div>
      <div class="syntax-block mt-5">
        <code>// res.summary → [{ property: '...', counts: { key: number } }]</code>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.summary-api-explorer {
  padding: 0 20px;

  h1 {
    display: flex;
    align-items: center;
  }

  a {
    color: var(--link);
  }

  .page-subtitle {
    color: var(--text-muted);
    font-size: 1.05em;
    line-height: 1.5;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }
  }

  .description {
    color: var(--text-muted);
    line-height: 1.6;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.9em;
    }
  }

  .section {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 20px;
    background: var(--box-bg);

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .section-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--link);
    color: #fff;
    font-size: 0.75em;
    font-weight: bold;
    flex-shrink: 0;
  }

  // --- Totals ---
  .totals-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .total-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 25px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--body-bg);
    min-width: 120px;

    &.total-card-primary {
      border-color: var(--link);
      min-width: 160px;
    }

    .total-number {
      font-size: 2em;
      font-weight: bold;
    }

    .total-label {
      font-size: 0.85em;
      color: var(--text-muted);
      text-transform: capitalize;
      margin-top: 5px;
    }
  }

  // --- Resource Cards ---
  .resource-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .resource-card {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 15px;
    background: var(--body-bg);

    .resource-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
      }

      .resource-total {
        font-size: 1.8em;
        font-weight: bold;
        color: var(--link);
      }
    }

    .resource-type-badge {
      font-size: 0.75em;
      font-family: monospace;
      color: var(--text-muted);
      margin-top: 2px;
    }
  }

  .state-list {
    .state-item {
      display: flex;
      align-items: center;
      padding: 3px 0;
      font-size: 0.9em;

      .state-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
        flex-shrink: 0;
      }
      .state-name {
        flex: 1;
        text-transform: capitalize;
      }
      .state-count {
        font-weight: 600;
        margin-left: 10px;
      }
    }
  }

  // --- Insight Cards ---
  .insight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
  }

  .insight-card {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 15px;
    background: var(--body-bg);

    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
      }

      .insight-total {
        font-size: 1.4em;
        font-weight: bold;
        color: var(--link);
      }
    }

    .insight-desc {
      font-size: 0.85em;
      color: var(--text-muted);
      margin: 8px 0 5px;
      line-height: 1.5;
    }

    .insight-api {
      code {
        display: inline-block;
        background: var(--body-bg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 0.75em;
        word-break: break-all;
      }
    }

    .multi-prop-section {
      border-top: 1px dashed var(--border);
      padding-top: 8px;

      .multi-prop-label {
        font-size: 0.8em;
        text-transform: none;
        color: var(--text-muted);
        margin: 0 0 5px;
        font-family: monospace;

        .multi-prop-total {
          color: var(--link);
          font-weight: bold;
        }
      }
    }

    .insight-bars {
      .insight-bar-row {
        display: flex;
        align-items: center;
        padding: 3px 0;
        gap: 10px;

        .insight-bar-label {
          min-width: 120px;
          font-size: 0.82em;
          flex-shrink: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .insight-bar-track {
          flex: 1;
          height: 10px;
          background: var(--border);
          border-radius: 5px;
          overflow: hidden;
        }

        .insight-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.3s ease;
        }

        .insight-bar-count {
          font-weight: 600;
          font-size: 0.85em;
          min-width: 35px;
          text-align: right;
        }
      }

      .insight-bar-more {
        font-size: 0.8em;
        color: var(--text-muted);
        font-style: italic;
        padding: 4px 0;
      }
    }

    .insight-empty {
      color: var(--text-muted);
      font-style: italic;
      font-size: 0.9em;
    }
  }

  // --- Feature Comparison ---
  .feature-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    .feature-col {
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 15px;
      background: var(--body-bg);
    }

    .feature-title {
      margin: 0 0 10px;
      font-size: 1em;
      padding: 5px 10px;
      border-radius: 3px;
      display: inline-block;

      &.feature-old {
        background: var(--border);
      }

      &.feature-new {
        background: var(--link);
        color: #fff;
      }
    }

    .feature-list {
      margin: 0;
      padding-left: 20px;
      font-size: 0.9em;
      line-height: 1.8;
      color: var(--text-muted);
    }
  }

  // --- Shared ---
  .raw-toggle {
    cursor: pointer;
    font-size: 0.85em;
    color: var(--link);
    user-select: none;
  }

  .raw-json {
    margin-top: 10px;
    padding: 10px;
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    font-size: 0.8em;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .syntax-block {
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 12px 16px;

    code {
      font-size: 0.95em;
    }
  }

  .comparison-table,
  .api-ref-table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--body-bg);
      font-weight: 600;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }

    .inline-state {
      display: inline-block;
      margin-right: 12px;
      font-size: 0.9em;

      &::before {
        content: '•';
        margin-right: 4px;
      }
    }
  }
}
</style>
