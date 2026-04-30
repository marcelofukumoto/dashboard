<script>
import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { Banner } from '@components/Banner';
import { STATES } from '@shell/plugins/dashboard-store/resource-class';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import Favorite from '@shell/components/nav/Favorite';

const WORKLOAD_RESOURCE_TYPES = {
  [WORKLOAD_TYPES.DEPLOYMENT]:   { label: 'Deployments' },
  [WORKLOAD_TYPES.DAEMON_SET]:   { label: 'DaemonSets' },
  [WORKLOAD_TYPES.STATEFUL_SET]: { label: 'StatefulSets' },
  [WORKLOAD_TYPES.JOB]:          { label: 'Jobs' },
  [WORKLOAD_TYPES.CRON_JOB]:     { label: 'CronJobs' },
  [POD]:                         { label: 'Pods' },
};

// States that the Steve server marks as transitioning (metadata.state.transitioning = true).
// For these, the real colorForState returns 'info' regardless of STATES[key].color.
const TRANSITIONING_STATES = new Set([
  'unknown', 'containerstatusunknown', 'imagepullbackoff',
  'crashloopbackoff',
]);

// States that the Steve server marks as error (metadata.state.error = true).
// For these, the real colorForState returns 'error' regardless of STATES[key].color.
const ERROR_STATES = new Set([
  'init:error', 'init:crashloopbackoff',
]);

function toStateColor(state) {
  const key = (state || '').toLowerCase();

  if (ERROR_STATES.has(key)) {
    return 'error';
  }

  if (TRANSITIONING_STATES.has(key)) {
    return 'info';
  }

  const config = STATES[key];
  const color = config?.color || 'info';

  return color === 'darker' ? 'disabled' : color;
}

export default {
  name:       'WorkloadDashboard',
  components: {
    Banner, Card, ResourceRow, StatusCard, Favorite
  },

  async fetch() {
    await this.fetchSummaries();
  },

  data() {
    return {
      summaries:  [],
      fetchError: null,
    };
  },

  watch: {
    activeNamespaces() {
      this.fetchSummaries();
    },
  },

  methods: {
    async fetchSummaries() {
      try {
        const workloadPromises = Object.keys(WORKLOAD_RESOURCE_TYPES).map(async(type) => {
          const schema = this.$store.getters['cluster/schemaFor'](type);

          if (!schema) {
            return {
              type, summary: null, error: `No access to ${ type }`
            };
          }

          try {
            let url = `/v1/${ type }?summary=metadata.state.name`;

            if (!this.isAllNamespaces) {
              const namespaces = Object.keys(this.activeNamespaces);

              if (namespaces.length) {
                url += `&projectsornamespaces=${ namespaces.join(',') }`;
              }
            }

            const res = await this.$store.dispatch('cluster/request', { url });

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
      } catch (e) {
        this.fetchError = e.message || 'Failed to fetch workload summaries';
      }
    },
  },

  computed: {
    activeNamespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },

    isAllNamespaces() {
      return this.$store.getters['isAllNamespaces'];
    },

    workloadData() {
      return this.summaries.map((entry) => {
        const config = WORKLOAD_RESOURCE_TYPES[entry.type] || { label: entry.type };
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
          total,
          stateCounts,
          error: entry.error,
        };
      });
    },

    /**
     * "By State": decompose each workload type's state counts into severity groups.
     * Aggregates counts per type within each severity card.
     */
    byStateCards() {
      const colorGroups = {
        error:    {},
        warning:  {},
        info:     {},
        success:  {},
        disabled: {},
      };

      for (const w of this.workloadData) {
        if (w.error || w.total === 0) {
          continue;
        }

        for (const [state, count] of Object.entries(w.stateCounts)) {
          const color = toStateColor(state);

          if (!colorGroups[color][w.label]) {
            colorGroups[color][w.label] = 0;
          }
          colorGroups[color][w.label] += count;
        }
      }

      return Object.entries(colorGroups)
        .filter(([, typeMap]) => Object.keys(typeMap).length > 0)
        .map(([color, typeMap]) => ({
          color,
          rows: Object.entries(typeMap).map(([label, count]) => ({
            label,
            color,
            counts: [{ label: '', count }],
          })),
        }));
    },

    /**
     * "By Type": one StatusCard per workload type with fake resource objects.
     */
    byTypeCards() {
      return this.workloadData.filter((w) => !w.error && w.total > 0).map((w) => {
        const resources = [];

        for (const [state, count] of Object.entries(w.stateCounts)) {
          for (let i = 0; i < count; i++) {
            resources.push({
              stateDisplay:     state,
              stateSimpleColor: toStateColor(state),
            });
          }
        }

        return {
          title: w.label,
          resources,
        };
      });
    },

  },
};
</script>

<template>
  <div class="workload-dashboard">
    <header class="masthead mb-20">
      <div class="title">
        <h1 class="m-0">
          Workloads Overview <Favorite resource="workload-dashboard" />
        </h1>
      </div>
    </header>

    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ By State ━━━ -->
    <div class="section mb-20">
      <h3 class="mb-10">
        By State
      </h3>
      <div class="card-grid">
        <Card
          v-for="card in byStateCards"
          :key="card.color"
          class="state-card"
          :class="'state-card--' + card.color"
          headless
        >
          <ResourceRow
            v-for="(row, idx) in card.rows"
            :key="idx"
            :label="row.label"
            :color="row.color"
            :counts="row.counts"
          />
        </Card>
      </div>
    </div>

    <!-- ━━━ By Type ━━━ -->
    <div class="section mb-20">
      <h3 class="mb-10">
        By Type
      </h3>
      <div class="card-grid">
        <StatusCard
          v-for="card in byTypeCards"
          :key="card.title"
          :title="card.title"
          :resources="card.resources"
          :showPercent="false"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.workload-dashboard {
  .masthead {
    .title {
      align-items: center;
      display: flex;

      h1 {
        margin: 0;
      }
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .state-card {
    min-height: 120px;

    ::v-deep .resource-row {
      position: relative;
      padding-left: 18px;

      .left {
        flex-grow: 1;
      }

      .right .counts .state-dot {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    &--error {
      background: var(--error-banner-bg, rgba(var(--error-rgb), 0.1));
    }
    &--warning {
      background: var(--warning-banner-bg, rgba(var(--warning-rgb), 0.1));
    }
    &--info {
      background: var(--info-banner-bg, rgba(var(--info-rgb), 0.1));
    }
    &--success {
      background: var(--success-banner-bg, rgba(var(--success-rgb), 0.1));
    }
  }
}
</style>
