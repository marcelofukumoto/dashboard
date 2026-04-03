<script>
import {
  WORKLOAD_TYPES, POD, COUNT, NODE, SERVICE
} from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

/**
 * Resource Summary API - Proof of Concept
 *
 * API Pattern:  GET /v1/{resource}?summary={property1},{property2}
 * Response:     { summary: [{ property: "...", counts: {...} }, ...] }
 */

const WORKLOAD_SUMMARY_PROPS = 'metadata.namespace,metadata.state.name';

const WORKLOAD_RESOURCE_TYPES = {
  [WORKLOAD_TYPES.DEPLOYMENT]: {
    label: 'Deployments',
    icon:  'icon-deployment'
  },
  [WORKLOAD_TYPES.DAEMON_SET]: {
    label: 'DaemonSets',
    icon:  'icon-daemonset'
  },
  [WORKLOAD_TYPES.STATEFUL_SET]: {
    label: 'StatefulSets',
    icon:  'icon-statefulset'
  },
  [WORKLOAD_TYPES.JOB]: {
    label: 'Jobs',
    icon:  'icon-job'
  },
  [WORKLOAD_TYPES.CRON_JOB]: {
    label: 'CronJobs',
    icon:  'icon-cronjob'
  },
  [POD]: {
    label: 'Pods',
    icon:  'icon-pod'
  },
};

/**
 * Extra "insight" queries - each targets a different resource + property
 * to showcase what the Summary API can do beyond basic state/namespace counts.
 */
const INSIGHT_QUERIES = [
  {
    id:          'pods-by-node',
    title:       'Pods per Node',
    description: 'Distribution of pods across cluster nodes — useful for spotting scheduling imbalances.',
    apiCall:     'GET /v1/pods?summary=spec.nodeName',
    resource:    POD,
    props:       'spec.nodeName',
    extract:     'spec.nodeName',
    icon:        'icon-host',
  },
  {
    id:          'pods-by-app',
    title:       'Pods by Application',
    description: 'Pods grouped by the standard <code>app.kubernetes.io/name</code> label.',
    apiCall:     'GET /v1/pods?summary=metadata.labels[app.kubernetes.io/name]',
    resource:    POD,
    props:       'metadata.labels[app.kubernetes.io/name]',
    extract:     'metadata.labels[app.kubernetes.io/name]',
    icon:        'icon-apps',
  },
  {
    id:          'deployments-by-manager',
    title:       'Deployments by Manager',
    description: 'Who created the deployments — Helm, kubectl, Rancher, etc.',
    apiCall:     'GET /v1/apps.deployments?summary=metadata.labels[app.kubernetes.io/managed-by]',
    resource:    WORKLOAD_TYPES.DEPLOYMENT,
    props:       'metadata.labels[app.kubernetes.io/managed-by]',
    extract:     'metadata.labels[app.kubernetes.io/managed-by]',
    icon:        'icon-deployment',
  },
  {
    id:          'services-by-type',
    title:       'Services by Type',
    description: 'Breakdown of services by spec type — ClusterIP, NodePort, LoadBalancer, ExternalName.',
    apiCall:     'GET /v1/services?summary=spec.type',
    resource:    SERVICE,
    props:       'spec.type',
    extract:     'spec.type',
    icon:        'icon-service',
  },
  {
    id:          'nodes-by-arch',
    title:       'Nodes by Architecture',
    description: 'Cluster nodes grouped by CPU architecture (amd64, arm64, etc.).',
    apiCall:     'GET /v1/nodes?summary=metadata.labels[kubernetes.io/arch],metadata.state.name',
    resource:    NODE,
    props:       'metadata.labels[kubernetes.io/arch],metadata.state.name',
    extracts:    ['metadata.labels[kubernetes.io/arch]', 'metadata.state.name'],
    icon:        'icon-host',
  },
  {
    id:          'pods-by-restart-policy',
    title:       'Pods by Restart Policy',
    description: 'How pods are configured to restart — Always, OnFailure, or Never.',
    apiCall:     'GET /v1/pods?summary=spec.restartPolicy',
    resource:    POD,
    props:       'spec.restartPolicy',
    extract:     'spec.restartPolicy',
    icon:        'icon-pod',
  },
];

export default {
  name:       'WorkloadDashboard',
  components: { Loading, Banner },

  async fetch() {
    this.loading = true;

    try {
      // 1) Workload type summaries (state + namespace)
      const workloadPromises = Object.keys(WORKLOAD_RESOURCE_TYPES).map(async(type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (!schema) {
          return {
            type,
            summary: null,
            error:   `No access to ${ type }`
          };
        }

        try {
          const res = await this.$store.dispatch('cluster/request', { url: `/v1/${ type }?summary=${ WORKLOAD_SUMMARY_PROPS }` });

          return {
            type,
            summary: res.summary || [],
            error:   null
          };
        } catch (e) {
          return {
            type,
            summary: null,
            error:   e.message || `Failed to fetch ${ type }`
          };
        }
      });

      this.summaries = await Promise.all(workloadPromises);

      // 2) Insight queries - each is independent
      const insightPromises = INSIGHT_QUERIES.map(async(query) => {
        const schema = this.$store.getters['cluster/schemaFor'](query.resource);

        if (!schema) {
          return {
            ...query,
            data:  null,
            error: `No access to ${ query.resource }`
          };
        }

        try {
          const res = await this.$store.dispatch('cluster/request', { url: `/v1/${ query.resource }?summary=${ query.props }` });

          return {
            ...query,
            data:  res.summary || [],
            error: null
          };
        } catch (e) {
          return {
            ...query,
            data:  null,
            error: e.message || 'Failed to fetch'
          };
        }
      });

      this.insights = await Promise.all(insightPromises);
    } catch (e) {
      this.fetchError = e.message || 'Failed to fetch workload summaries';
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
      loading:        true,
      summaries:      [],
      insights:       [],
      existingCounts: {},
      fetchError:     null,
      WORKLOAD_RESOURCE_TYPES,
    };
  },

  computed: {
    workloadData() {
      return this.summaries.map((entry) => {
        const config = WORKLOAD_RESOURCE_TYPES[entry.type] || {
          label: entry.type,
          icon:  'icon-default'
        };
        const stateCounts = {};
        const namespaceCounts = {};
        let total = 0;

        if (entry.summary) {
          for (const s of entry.summary) {
            if (s.property === 'metadata.state.name') {
              Object.assign(stateCounts, s.counts);
              total = Object.values(s.counts).reduce((sum, c) => sum + c, 0);
            }

            if (s.property === 'metadata.namespace') {
              Object.assign(namespaceCounts, s.counts);
            }
          }
        }

        return {
          type:  entry.type,
          label: config.label,
          icon:  config.icon,
          total,
          stateCounts,
          namespaceCounts,
          error: entry.error,
          raw:   entry.summary,
        };
      });
    },

    grandTotals() {
      const totals = {
        resources: 0,
        states:    {},
      };

      for (const w of this.workloadData) {
        totals.resources += w.total;

        for (const [state, count] of Object.entries(w.stateCounts)) {
          totals.states[state] = (totals.states[state] || 0) + count;
        }
      }

      return totals;
    },

    insightCards() {
      return this.insights.map((insight) => {
        const counts = {};
        let total = 0;

        if (insight.data) {
          if (insight.extract) {
            const match = insight.data.find((s) => s.property === insight.extract);

            if (match) {
              Object.assign(counts, match.counts);
              total = Object.values(match.counts).reduce((sum, c) => sum + c, 0);
            }
          }

          if (insight.extracts) {
            const result = {};

            for (const prop of insight.extracts) {
              const match = insight.data.find((s) => s.property === prop);

              if (match) {
                result[prop] = match.counts;

                if (!total) {
                  total = Object.values(match.counts).reduce((sum, c) => sum + c, 0);
                }
              }
            }

            Object.assign(counts, result[insight.extracts[0]] || {});
          }
        }

        return {
          id:          insight.id,
          title:       insight.title,
          description: insight.description,
          apiCall:     insight.apiCall,
          icon:        insight.icon,
          counts,
          total,
          error:       insight.error,
          raw:         insight.data,
        };
      });
    },

    existingCountComparison() {
      return Object.keys(WORKLOAD_RESOURCE_TYPES).map((type) => {
        const existing = this.existingCounts[type];

        return {
          type,
          label:        WORKLOAD_RESOURCE_TYPES[type].label,
          countFromAPI: existing?.summary?.count || 0,
          states:       existing?.summary?.states || {},
        };
      });
    },
  },

  methods: {
    stateColor(state) {
      const colors = {
        running:          '#27AE60',
        active:           '#27AE60',
        completed:        '#8E8E8E',
        succeeded:        '#8E8E8E',
        waiting:          '#F39C12',
        pending:          '#F39C12',
        suspended:        '#F39C12',
        failed:           '#E74C3C',
        error:            '#E74C3C',
        crashloopbackoff: '#E74C3C',
      };

      return colors[state.toLowerCase()] || '#3498DB';
    },

    barColor(index) {
      const palette = ['#3498DB', '#2ECC71', '#E67E22', '#9B59B6', '#1ABC9C', '#E74C3C', '#F1C40F', '#34495E'];

      return palette[index % palette.length];
    },

    sortedEntries(obj) {
      return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    },

    maxCount(obj) {
      const vals = Object.values(obj);

      return vals.length ? Math.max(...vals) : 1;
    },
  },
};
</script>

<template>
  <Loading v-if="loading || $fetchState.pending" />
  <div
    v-else
    class="workload-dashboard"
  >
    <h1 class="mb-20">
      <i class="icon icon-workload mr-10" /> Workloads Dashboard
    </h1>

    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- Section 1: Grand Totals -->
    <div class="section mb-30">
      <h2>Overview</h2>
      <p class="description mt-5 mb-15">
        Aggregated counts from <code>GET /v1/{type}?summary=metadata.state.name</code> for each workload type.
      </p>
      <div class="totals-grid">
        <div class="total-card total-card-primary">
          <span class="total-number">{{ grandTotals.resources }}</span>
          <span class="total-label">Total Workloads</span>
        </div>
        <div
          v-for="[state, count] in sortedEntries(grandTotals.states)"
          :key="state"
          class="total-card"
        >
          <span
            class="total-number"
            :style="{ color: stateColor(state) }"
          >{{ count }}</span>
          <span class="total-label">{{ state }}</span>
        </div>
      </div>
    </div>

    <!-- Section 2: Per-Resource Type Cards -->
    <div class="section mb-30">
      <h2>Per-Resource Type</h2>
      <p class="description mt-5 mb-15">
        Each card queries <code>GET /v1/{type}?summary=metadata.namespace,metadata.state.name</code>
      </p>

      <div class="resource-grid">
        <div
          v-for="workload in workloadData"
          :key="workload.type"
          class="resource-card"
        >
          <div class="resource-header">
            <h3>
              <i :class="['icon', workload.icon, 'mr-5']" />
              {{ workload.label }}
            </h3>
            <span class="resource-total">{{ workload.total }}</span>
          </div>

          <Banner
            v-if="workload.error"
            color="warning"
            class="mt-10"
          >
            {{ workload.error }}
          </Banner>

          <div
            v-else
            class="resource-details"
          >
            <!-- State Breakdown -->
            <div
              v-if="Object.keys(workload.stateCounts).length"
              class="detail-section"
            >
              <h4>States</h4>
              <div class="state-list">
                <div
                  v-for="[state, count] in sortedEntries(workload.stateCounts)"
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
            </div>

            <!-- Namespace Distribution (top 5) -->
            <div
              v-if="Object.keys(workload.namespaceCounts).length"
              class="detail-section mt-10"
            >
              <h4>Top Namespaces</h4>
              <div class="namespace-list">
                <div
                  v-for="[ns, count] in sortedEntries(workload.namespaceCounts).slice(0, 5)"
                  :key="ns"
                  class="namespace-item"
                >
                  <span class="namespace-name">{{ ns }}</span>
                  <div class="namespace-bar-container">
                    <div
                      class="namespace-bar"
                      :style="{ width: (count / maxCount(workload.namespaceCounts) * 100) + '%' }"
                    />
                  </div>
                  <span class="namespace-count">{{ count }}</span>
                </div>
                <div
                  v-if="Object.keys(workload.namespaceCounts).length > 5"
                  class="namespace-item more"
                >
                  ... and {{ Object.keys(workload.namespaceCounts).length - 5 }} more namespaces
                </div>
              </div>
            </div>
          </div>

          <details class="mt-10">
            <summary class="raw-toggle">
              Raw API Response
            </summary>
            <pre class="raw-json">{{ JSON.stringify(workload.raw, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- Section 3: Insight Queries -->
    <div class="section mb-30">
      <h2>Cluster Insights</h2>
      <p class="description mt-5 mb-15">
        Additional queries showcasing the flexibility of the Summary API — grouping by labels,
        spec fields, node names, and more.
      </p>

      <div class="insight-grid">
        <div
          v-for="(card, cardIdx) in insightCards"
          :key="card.id"
          class="insight-card"
        >
          <div class="insight-header">
            <h3>
              <i :class="['icon', card.icon, 'mr-5']" />
              {{ card.title }}
            </h3>
            <span
              v-if="card.total"
              class="insight-total"
            >{{ card.total }}</span>
          </div>

          <p
            class="insight-desc"
            v-html="card.description"
          />

          <div class="insight-api">
            <code>{{ card.apiCall }}</code>
          </div>

          <Banner
            v-if="card.error"
            color="warning"
            class="mt-10"
          >
            {{ card.error }}
          </Banner>

          <div
            v-else-if="Object.keys(card.counts).length"
            class="insight-bars mt-10"
          >
            <div
              v-for="([key, count], idx) in sortedEntries(card.counts)"
              :key="key"
              class="insight-bar-row"
            >
              <span class="insight-bar-label">{{ key || '(empty)' }}</span>
              <div class="insight-bar-track">
                <div
                  class="insight-bar-fill"
                  :style="{
                    width: (count / maxCount(card.counts) * 100) + '%',
                    backgroundColor: barColor(cardIdx * 3 + idx)
                  }"
                />
              </div>
              <span class="insight-bar-count">{{ count }}</span>
            </div>
          </div>
          <div
            v-else
            class="insight-empty mt-10"
          >
            No data returned for this query.
          </div>

          <details class="mt-10">
            <summary class="raw-toggle">
              Raw API Response
            </summary>
            <pre class="raw-json">{{ JSON.stringify(card.raw, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- Section 4: COUNT Store Comparison -->
    <div class="section mb-30">
      <h2>Comparison: COUNT Store vs Summary API</h2>
      <p class="description mt-5 mb-15">
        The existing <code>/v1/counts</code> endpoint provides basic totals and state summaries.
        The new Summary API adds the ability to group by <strong>any</strong> property — labels,
        spec fields, annotations — without loading individual resources.
      </p>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>COUNT Store Total</th>
            <th>COUNT Store States</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in existingCountComparison"
            :key="item.type"
          >
            <td>{{ item.label }}</td>
            <td>{{ item.countFromAPI }}</td>
            <td>
              <span
                v-for="[state, count] in Object.entries(item.states)"
                :key="state"
                class="inline-state"
              >
                {{ state }}: {{ count }}
              </span>
              <span v-if="!Object.keys(item.states).length">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 5: API Reference -->
    <div class="section mb-30">
      <h2>API Reference</h2>
      <p class="description mt-10">
        The Resource Summary API accepts any dot-path property of the resource JSON.
        For labels and annotations, use bracket notation:
        <code>metadata.labels[key]</code>.
      </p>
      <table class="api-ref-table mt-15">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Interesting Properties</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pods</strong></td>
            <td>
              <code>spec.nodeName</code>,
              <code>spec.restartPolicy</code>,
              <code>status.phase</code>,
              <code>metadata.labels[app.kubernetes.io/name]</code>
            </td>
          </tr>
          <tr>
            <td><strong>Deployments</strong></td>
            <td>
              <code>metadata.labels[app.kubernetes.io/managed-by]</code>,
              <code>metadata.labels[app.kubernetes.io/name]</code>
            </td>
          </tr>
          <tr>
            <td><strong>Nodes</strong></td>
            <td>
              <code>metadata.labels[kubernetes.io/arch]</code>,
              <code>metadata.labels[kubernetes.io/os]</code>,
              <code>metadata.labels[topology.kubernetes.io/zone]</code>,
              <code>metadata.labels[node.kubernetes.io/instance-type]</code>
            </td>
          </tr>
          <tr>
            <td><strong>Services</strong></td>
            <td>
              <code>spec.type</code>,
              <code>metadata.namespace</code>
            </td>
          </tr>
          <tr>
            <td><strong>Events</strong></td>
            <td>
              <code>type</code>,
              <code>reason</code>
            </td>
          </tr>
          <tr>
            <td><strong>Any resource</strong></td>
            <td>
              <code>metadata.namespace</code>,
              <code>metadata.state.name</code>,
              <code>metadata.labels[any-label-key]</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
  padding: 0 20px;

  h1 {
    display: flex;
    align-items: center;
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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

    .detail-section {
      h4 {
        margin: 8px 0 5px;
        font-size: 0.85em;
        text-transform: uppercase;
        color: var(--text-muted);
        letter-spacing: 0.5px;
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

    .namespace-list {
      .namespace-item {
        display: flex;
        align-items: center;
        padding: 3px 0;
        font-size: 0.9em;
        gap: 10px;

        &.more {
          color: var(--text-muted);
          font-style: italic;
          font-size: 0.85em;
        }

        .namespace-name {
          min-width: 120px;
          flex-shrink: 0;
        }

        .namespace-bar-container {
          flex: 1;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }

        .namespace-bar {
          height: 100%;
          background: var(--link);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .namespace-count {
          font-weight: 600;
          min-width: 30px;
          text-align: right;
        }
      }
    }
  }

  // --- Insight Cards ---
  .insight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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
        font-size: 0.8em;
        word-break: break-all;
      }
    }

    .insight-bars {
      .insight-bar-row {
        display: flex;
        align-items: center;
        padding: 4px 0;
        gap: 10px;

        .insight-bar-label {
          min-width: 130px;
          font-size: 0.85em;
          flex-shrink: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .insight-bar-track {
          flex: 1;
          height: 12px;
          background: var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .insight-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .insight-bar-count {
          font-weight: 600;
          font-size: 0.9em;
          min-width: 35px;
          text-align: right;
        }
      }
    }

    .insight-empty {
      color: var(--text-muted);
      font-style: italic;
      font-size: 0.9em;
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
      font-size: 0.9em;
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
