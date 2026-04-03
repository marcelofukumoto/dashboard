<script>
import { WORKLOAD_TYPES, POD, COUNT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

/**
 * Resource Summary API — Workloads Dashboard
 *
 * API Pattern:  GET /v1/{resource}?summary={property1},{property2}
 * Response:     { summary: [{ property: "...", counts: {...} }, ...] }
 *
 * This page showcases the Summary API capabilities using only workload resources:
 * Deployments, DaemonSets, StatefulSets, Jobs, CronJobs, and Pods.
 */

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

// ---------------------------------------------------------------------------
// Insight query groups — all focused on workload resource types.
// Demonstrates: state, namespace, spec fields, status fields, labels,
//               multi-property queries — all within the workload domain.
// ---------------------------------------------------------------------------

const INSIGHT_GROUPS = [
  // ── Scheduling & Runtime ──
  {
    id:          'scheduling',
    title:       'Pod Scheduling & Runtime',
    description: 'How pods are distributed across nodes and what runtime characteristics they have.',
    queries:     [
      {
        id:       'pods-by-node',
        title:    'Pods per Node',
        desc:     'Distribution of pods across cluster nodes — useful for spotting scheduling imbalances.',
        apiCall:  'GET /v1/pods?summary=spec.nodeName',
        resource: POD,
        props:    'spec.nodeName',
        extract:  'spec.nodeName',
        icon:     'icon-host',
      },
      {
        id:       'pods-by-restart-policy',
        title:    'Pods by Restart Policy',
        desc:     'Always, OnFailure, or Never — shows the mix of long-running services vs one-shot jobs.',
        apiCall:  'GET /v1/pods?summary=spec.restartPolicy',
        resource: POD,
        props:    'spec.restartPolicy',
        extract:  'spec.restartPolicy',
        icon:     'icon-pod',
      },
      {
        id:       'pods-by-phase',
        title:    'Pods by Status Phase',
        desc:     'Raw Kubernetes status.phase (Running, Pending, Succeeded, Failed, Unknown) — not Rancher state.',
        apiCall:  'GET /v1/pods?summary=status.phase',
        resource: POD,
        props:    'status.phase',
        extract:  'status.phase',
        icon:     'icon-pod',
      },
      {
        id:       'pods-by-qos',
        title:    'Pods by QoS Class',
        desc:     'Guaranteed, Burstable, or BestEffort — reflects how resource requests/limits are configured.',
        apiCall:  'GET /v1/pods?summary=status.qosClass',
        resource: POD,
        props:    'status.qosClass',
        extract:  'status.qosClass',
        icon:     'icon-pod',
      },
    ],
  },

  // ── Application Identity (Labels) ──
  {
    id:          'app-labels',
    title:       'Application Identity (Labels)',
    description: 'Group workloads by standard Kubernetes recommended labels using bracket notation: metadata.labels[key].',
    queries:     [
      {
        id:       'pods-by-app-name',
        title:    'Pods by app.kubernetes.io/name',
        desc:     'The standard application name label — shows which apps have the most pods.',
        apiCall:  'GET /v1/pods?summary=metadata.labels[app.kubernetes.io/name]',
        resource: POD,
        props:    'metadata.labels[app.kubernetes.io/name]',
        extract:  'metadata.labels[app.kubernetes.io/name]',
        icon:     'icon-apps',
      },
      {
        id:       'pods-by-component',
        title:    'Pods by app.kubernetes.io/component',
        desc:     'Component role within an application — database, frontend, backend, controller, etc.',
        apiCall:  'GET /v1/pods?summary=metadata.labels[app.kubernetes.io/component]',
        resource: POD,
        props:    'metadata.labels[app.kubernetes.io/component]',
        extract:  'metadata.labels[app.kubernetes.io/component]',
        icon:     'icon-pod',
      },
      {
        id:       'deployments-by-manager',
        title:    'Deployments by app.kubernetes.io/managed-by',
        desc:     'Who created the deployments — Helm, kubectl, Rancher, Argo, Flux, etc.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.labels[app.kubernetes.io/managed-by]',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.labels[app.kubernetes.io/managed-by]',
        extract:  'metadata.labels[app.kubernetes.io/managed-by]',
        icon:     'icon-deployment',
      },
      {
        id:       'deployments-by-part-of',
        title:    'Deployments by app.kubernetes.io/part-of',
        desc:     'Higher-level application grouping — which larger systems do deployments belong to.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.labels[app.kubernetes.io/part-of]',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.labels[app.kubernetes.io/part-of]',
        extract:  'metadata.labels[app.kubernetes.io/part-of]',
        icon:     'icon-deployment',
      },
    ],
  },

  // ── Namespace Distribution ──
  {
    id:          'namespaces',
    title:       'Namespace Distribution',
    description: 'How each workload type is spread across namespaces — identify namespace sprawl or concentration.',
    queries:     [
      {
        id:       'deployments-by-ns',
        title:    'Deployments by Namespace',
        desc:     'Which namespaces have the most deployments.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.namespace',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-deployment',
      },
      {
        id:       'daemonsets-by-ns',
        title:    'DaemonSets by Namespace',
        desc:     'DaemonSets are typically in system namespaces — verify that assumption.',
        apiCall:  'GET /v1/apps.daemonsets?summary=metadata.namespace',
        resource: WORKLOAD_TYPES.DAEMON_SET,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-daemonset',
      },
      {
        id:       'jobs-by-ns',
        title:    'Jobs by Namespace',
        desc:     'Where batch jobs are running.',
        apiCall:  'GET /v1/batch.jobs?summary=metadata.namespace',
        resource: WORKLOAD_TYPES.JOB,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-job',
      },
      {
        id:       'cronjobs-by-ns',
        title:    'CronJobs by Namespace',
        desc:     'Scheduled workloads across namespaces.',
        apiCall:  'GET /v1/batch.cronjobs?summary=metadata.namespace',
        resource: WORKLOAD_TYPES.CRON_JOB,
        props:    'metadata.namespace',
        extract:  'metadata.namespace',
        icon:     'icon-cronjob',
      },
    ],
  },

  // ── Workload State ──
  {
    id:          'states',
    title:       'Workload State Breakdown',
    description: 'Rancher-enriched state (metadata.state.name) for each workload type individually — more granular than the overview.',
    queries:     [
      {
        id:       'deployments-by-state',
        title:    'Deployments by State',
        desc:     'Active, updating, waiting — deployment health at a glance.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.state.name',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-deployment',
      },
      {
        id:       'daemonsets-by-state',
        title:    'DaemonSets by State',
        desc:     'DaemonSet health — are all sets active?',
        apiCall:  'GET /v1/apps.daemonsets?summary=metadata.state.name',
        resource: WORKLOAD_TYPES.DAEMON_SET,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-daemonset',
      },
      {
        id:       'jobs-by-state',
        title:    'Jobs by State',
        desc:     'Running vs completed vs failed jobs.',
        apiCall:  'GET /v1/batch.jobs?summary=metadata.state.name',
        resource: WORKLOAD_TYPES.JOB,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-job',
      },
      {
        id:       'statefulsets-by-state',
        title:    'StatefulSets by State',
        desc:     'StatefulSet health status.',
        apiCall:  'GET /v1/apps.statefulsets?summary=metadata.state.name',
        resource: WORKLOAD_TYPES.STATEFUL_SET,
        props:    'metadata.state.name',
        extract:  'metadata.state.name',
        icon:     'icon-statefulset',
      },
    ],
  },

  // ── Deployment Strategy & Replicas ──
  {
    id:          'deploy-config',
    title:       'Deployment Strategy & Configuration',
    description: 'How deployments are configured — rolling update vs recreate, and replica counts.',
    queries:     [
      {
        id:       'deployments-by-strategy',
        title:    'Deployments by Strategy Type',
        desc:     'RollingUpdate vs Recreate — most production workloads use RollingUpdate for zero-downtime.',
        apiCall:  'GET /v1/apps.deployments?summary=spec.strategy.type',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'spec.strategy.type',
        extract:  'spec.strategy.type',
        icon:     'icon-deployment',
      },
      {
        id:       'deployments-by-replicas',
        title:    'Deployments by Replica Count',
        desc:     'How many replicas each deployment requests — single-replica workloads are not HA.',
        apiCall:  'GET /v1/apps.deployments?summary=spec.replicas',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'spec.replicas',
        extract:  'spec.replicas',
        icon:     'icon-deployment',
      },
      {
        id:       'statefulsets-by-replicas',
        title:    'StatefulSets by Replica Count',
        desc:     'StatefulSet sizing — common counts are 1, 3, 5 for quorum-based systems.',
        apiCall:  'GET /v1/apps.statefulsets?summary=spec.replicas',
        resource: WORKLOAD_TYPES.STATEFUL_SET,
        props:    'spec.replicas',
        extract:  'spec.replicas',
        icon:     'icon-statefulset',
      },
      {
        id:       'deployments-by-paused',
        title:    'Deployments by Paused Status',
        desc:     'Whether rollouts are paused — useful for detecting stalled deployments.',
        apiCall:  'GET /v1/apps.deployments?summary=spec.paused',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'spec.paused',
        extract:  'spec.paused',
        icon:     'icon-deployment',
      },
    ],
  },

  // ── Job & CronJob Characteristics ──
  {
    id:          'batch-config',
    title:       'Job & CronJob Configuration',
    description: 'Batch workload settings — concurrency policies, suspend status, and completion tracking.',
    queries:     [
      {
        id:       'cronjobs-by-suspend',
        title:    'CronJobs by Suspend Status',
        desc:     'Suspended CronJobs will not trigger new Jobs — useful to find disabled schedules.',
        apiCall:  'GET /v1/batch.cronjobs?summary=spec.suspend',
        resource: WORKLOAD_TYPES.CRON_JOB,
        props:    'spec.suspend',
        extract:  'spec.suspend',
        icon:     'icon-cronjob',
      },
      {
        id:       'cronjobs-by-concurrency',
        title:    'CronJobs by Concurrency Policy',
        desc:     'Allow, Forbid, or Replace — controls what happens when the next schedule fires while a Job is still running.',
        apiCall:  'GET /v1/batch.cronjobs?summary=spec.concurrencyPolicy',
        resource: WORKLOAD_TYPES.CRON_JOB,
        props:    'spec.concurrencyPolicy',
        extract:  'spec.concurrencyPolicy',
        icon:     'icon-cronjob',
      },
      {
        id:       'cronjobs-by-schedule',
        title:    'CronJobs by Schedule',
        desc:     'The cron expressions in use — reveals timing patterns and potential scheduling collisions.',
        apiCall:  'GET /v1/batch.cronjobs?summary=spec.schedule',
        resource: WORKLOAD_TYPES.CRON_JOB,
        props:    'spec.schedule',
        extract:  'spec.schedule',
        icon:     'icon-cronjob',
      },
      {
        id:       'jobs-by-completions',
        title:    'Jobs by Completions Target',
        desc:     'How many completions each Job targets — 1 for simple tasks, higher for parallel batch work.',
        apiCall:  'GET /v1/batch.jobs?summary=spec.completions',
        resource: WORKLOAD_TYPES.JOB,
        props:    'spec.completions',
        extract:  'spec.completions',
        icon:     'icon-job',
      },
    ],
  },

  // ── Pod Service Account & DNS ──
  {
    id:          'pod-identity',
    title:       'Pod Identity & Network Config',
    description: 'Service accounts, DNS policies, and host network usage — important for security and networking audits.',
    queries:     [
      {
        id:       'pods-by-sa',
        title:    'Pods by Service Account',
        desc:     'Which service accounts are in use — pods using "default" SA may lack proper RBAC scoping.',
        apiCall:  'GET /v1/pods?summary=spec.serviceAccountName',
        resource: POD,
        props:    'spec.serviceAccountName',
        extract:  'spec.serviceAccountName',
        icon:     'icon-pod',
      },
      {
        id:       'pods-by-dns-policy',
        title:    'Pods by DNS Policy',
        desc:     'ClusterFirst, Default, ClusterFirstWithHostNet, None — how pods resolve DNS.',
        apiCall:  'GET /v1/pods?summary=spec.dnsPolicy',
        resource: POD,
        props:    'spec.dnsPolicy',
        extract:  'spec.dnsPolicy',
        icon:     'icon-pod',
      },
      {
        id:       'pods-by-host-network',
        title:    'Pods by Host Network',
        desc:     'Pods using the host network stack bypass network policies — a security consideration.',
        apiCall:  'GET /v1/pods?summary=spec.hostNetwork',
        resource: POD,
        props:    'spec.hostNetwork',
        extract:  'spec.hostNetwork',
        icon:     'icon-pod',
      },
      {
        id:       'pods-by-priority-class',
        title:    'Pods by Priority Class',
        desc:     'Priority class names control scheduling preemption — system-critical vs user workloads.',
        apiCall:  'GET /v1/pods?summary=spec.priorityClassName',
        resource: POD,
        props:    'spec.priorityClassName',
        extract:  'spec.priorityClassName',
        icon:     'icon-pod',
      },
    ],
  },

  // ── Multi-Property Queries ──
  {
    id:          'multi-property',
    title:       'Multi-Property Queries',
    description: 'The Summary API supports multiple comma-separated properties in a single request. Each property returns its own independent count map — no extra round-trips needed.',
    queries:     [
      {
        id:       'pods-multi',
        title:    'Pods: Node + Phase + Restart Policy',
        desc:     'Three orthogonal dimensions of pod configuration in one API call.',
        apiCall:  'GET /v1/pods?summary=spec.nodeName,status.phase,spec.restartPolicy',
        resource: POD,
        props:    'spec.nodeName,status.phase,spec.restartPolicy',
        extract:  null,
        multi:    true,
        icon:     'icon-pod',
      },
      {
        id:       'deploy-multi',
        title:    'Deployments: Namespace + State + Manager',
        desc:     'Where deployments live, their state, and who manages them — all in one request.',
        apiCall:  'GET /v1/apps.deployments?summary=metadata.namespace,metadata.state.name,metadata.labels[app.kubernetes.io/managed-by]',
        resource: WORKLOAD_TYPES.DEPLOYMENT,
        props:    'metadata.namespace,metadata.state.name,metadata.labels[app.kubernetes.io/managed-by]',
        extract:  null,
        multi:    true,
        icon:     'icon-deployment',
      },
      {
        id:       'jobs-multi',
        title:    'Jobs: Namespace + State',
        desc:     'Job distribution and health in a single query.',
        apiCall:  'GET /v1/batch.jobs?summary=metadata.namespace,metadata.state.name',
        resource: WORKLOAD_TYPES.JOB,
        props:    'metadata.namespace,metadata.state.name',
        extract:  null,
        multi:    true,
        icon:     'icon-job',
      },
    ],
  },
];

export default {
  name:       'WorkloadDashboard',
  components: { Loading, Banner },

  async fetch() {
    this.loading = true;

    try {
      // 1) Workload type summaries (state + namespace for the overview)
      const workloadPromises = Object.keys(WORKLOAD_RESOURCE_TYPES).map(async(type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        if (!schema) {
          return {
            type, summary: null, error: `No access to ${ type }`
          };
        }

        try {
          const res = await this.$store.dispatch('cluster/request', { url: `/v1/${ type }?summary=metadata.namespace,metadata.state.name` });

          return {
            type, summary: res.summary || [], error: null
          };
        } catch (e) {
          return {
            type, summary: null, error: e.message || `Failed to fetch ${ type }`
          };
        }
      });

      this.summaries = await Promise.all(workloadPromises);

      // 2) Insight groups — flatten all queries, fetch in parallel
      const allQueries = INSIGHT_GROUPS.flatMap((g) => g.queries.map((q) => ({
        ...q,
        groupId: g.id
      })));

      const insightPromises = allQueries.map(async(query) => {
        const schema = this.$store.getters['cluster/schemaFor'](query.resource);

        if (!schema) {
          return {
            ...query, data: null, error: `No access to ${ query.resource }`
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

      const results = await Promise.all(insightPromises);

      // Re-group results back into their sections
      this.insightGroupResults = INSIGHT_GROUPS.map((g) => ({
        ...g,
        results: results.filter((r) => r.groupId === g.id),
      }));
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
      loading:             true,
      summaries:           [],
      insightGroupResults: [],
      existingCounts:      {},
      fetchError:          null,
      WORKLOAD_RESOURCE_TYPES,
      INSIGHT_GROUPS,
    };
  },

  computed: {
    workloadData() {
      return this.summaries.map((entry) => {
        const config = WORKLOAD_RESOURCE_TYPES[entry.type] || { label: entry.type, icon: 'icon-default' };
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
      const totals = { resources: 0, states: {} };

      for (const w of this.workloadData) {
        totals.resources += w.total;
        for (const [state, count] of Object.entries(w.stateCounts)) {
          totals.states[state] = (totals.states[state] || 0) + count;
        }
      }

      return totals;
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

    totalInsightQueries() {
      return INSIGHT_GROUPS.reduce((sum, g) => sum + g.queries.length, 0);
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
    class="workload-dashboard"
  >
    <h1 class="mb-10">
      <i class="icon icon-workload mr-10" /> Workloads Dashboard
    </h1>
    <p class="page-subtitle mb-20">
      <strong>{{ totalInsightQueries + Object.keys(WORKLOAD_RESOURCE_TYPES).length }}</strong> Summary API queries
      across <strong>{{ INSIGHT_GROUPS.length + 1 }}</strong> sections — all focused on workload resources
      (Deployments, DaemonSets, StatefulSets, Jobs, CronJobs, Pods).
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
        Overview
      </h2>
      <p class="description mt-5 mb-15">
        Aggregated state counts from <code>GET /v1/{type}?summary=metadata.state.name</code> for each workload type.
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

    <!-- ━━━ Section 2: Per-Resource Type ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">2</span>
        Per-Resource Type
      </h2>
      <p class="description mt-5 mb-15">
        Each card queries
        <code>GET /v1/{type}?summary=metadata.namespace,metadata.state.name</code>
        — two properties per request returning independent count maps.
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

    <!-- ━━━ Insight Groups (3 .. N) ━━━ -->
    <div
      v-for="(group, groupIdx) in insightGroupResults"
      :key="group.id"
      class="section mb-30"
    >
      <h2>
        <span class="section-number">{{ groupIdx + 3 }}</span>
        {{ group.title }}
      </h2>
      <p class="description mt-5 mb-15">
        {{ group.description }}
      </p>

      <div class="insight-grid">
        <div
          v-for="(result, rIdx) in group.results"
          :key="result.id"
          class="insight-card"
        >
          <div class="insight-header">
            <h3>
              <i :class="['icon', result.icon, 'mr-5']" />
              {{ result.title }}
            </h3>
            <span
              v-if="cardData(result).total"
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
            v-else
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
        <span class="section-number">{{ INSIGHT_GROUPS.length + 3 }}</span>
        Comparison: COUNT Store vs Summary API
      </h2>
      <p class="description mt-5 mb-15">
        The existing <code>/v1/counts</code> endpoint provides basic totals and state summaries.
        The Summary API adds grouping by <strong>any</strong> property — namespace, labels, spec
        fields — without loading individual resources.
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

    <!-- ━━━ API Reference ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">{{ INSIGHT_GROUPS.length + 4 }}</span>
        API Reference
      </h2>
      <p class="description mt-10">
        The Resource Summary API accepts any dot-path property.
        For labels, use bracket notation: <code>metadata.labels[key]</code>.
        Multiple properties are comma-separated.
      </p>

      <h3 class="mt-20 mb-10">
        Syntax
      </h3>
      <div class="syntax-block">
        <code>GET /v1/{resource}?summary={property1},{property2},{propertyN}</code>
      </div>

      <h3 class="mt-20 mb-10">
        Workload Properties Used on This Page
      </h3>
      <table class="api-ref-table mt-5">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Properties</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pods</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>,
              <code>spec.nodeName</code>,
              <code>spec.restartPolicy</code>,
              <code>status.phase</code>,
              <code>status.qosClass</code>,
              <code>metadata.labels[app.kubernetes.io/name]</code>,
              <code>metadata.labels[app.kubernetes.io/component]</code>
            </td>
          </tr>
          <tr>
            <td><strong>Deployments</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>,
              <code>metadata.labels[app.kubernetes.io/managed-by]</code>,
              <code>metadata.labels[app.kubernetes.io/part-of]</code>
            </td>
          </tr>
          <tr>
            <td><strong>DaemonSets</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>
            </td>
          </tr>
          <tr>
            <td><strong>StatefulSets</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>
            </td>
          </tr>
          <tr>
            <td><strong>Jobs</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>
            </td>
          </tr>
          <tr>
            <td><strong>CronJobs</strong></td>
            <td>
              <code>metadata.state.name</code>,
              <code>metadata.namespace</code>
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

  .page-subtitle {
    color: var(--text-muted);
    font-size: 1.05em;
    line-height: 1.5;
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
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
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
        font-size: 0.8em;
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
      font-size: 1em;
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
