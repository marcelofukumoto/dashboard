<script lang="ts">
import { colorForState, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { sortBy } from '@shell/utils/sort';
import ProgressBarMulti from '@shell/components/ProgressBarMulti.vue';
import PopoverCard from '@shell/components/PopoverCard.vue';
import { clone } from '@shell/utils/object';
import ResourcePopover from '@shell/components/Resource/Detail/ResourcePopover/index.vue';
import RcButton from '@components/RcButton/RcButton.vue';

export default {

  name: 'FleetDashboardResourceCardSummary',

  components: {
    ProgressBarMulti, PopoverCard, ResourcePopover, RcButton
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
    noClusters: {
      type:    Boolean,
      default: false
    },
    resourcesTooltip: {
      type:    Object,
      default: () => ({ content: '', triggers: ['hover'] })
    },
    resourcesDefaultStates: {
      type:    Object,
      default: () => ({})
    },
  },

  data() {
    return { isOpen: false, typeLabel: this.t(`typeLabel."${ this.value.type }"`, { count: 1 }) };
  },

  methods: {
    toggleCardClusters() {
      this.isOpen = !this.isOpen;
    }
  },

  computed: {
    counts() {
      return this.value.status?.resourceCounts || {};
    },

    countsPerCluster() {
      return ((this.value.targetClusters || []) as { id: string }[]).map(({ id }) => this.value.status?.perClusterResourceCounts?.[id] || { desiredReady: 0 });
    },

    summary() {
      const { desiredReady, ready } = this.counts;

      const partial = desiredReady === ready ? ready : desiredReady - ready;
      const total = desiredReady;
      const clusters = partial !== total && total !== 0 ? this.countsPerCluster.filter((c) => c.desiredReady !== c.ready).length : this.countsPerCluster.length;

      return {
        partial,
        total,
        clusters
      };
    },

    stateParts() {
      const keys = Object.keys(this.counts).filter((x) => !x.startsWith('desired'));

      const out = keys.map((key) => {
        const textColor = colorForState(key);

        return {
          color: textColor.replace(/text-/, 'bg-'),
          value: this.counts[key],
          sort:  stateSort(textColor, key),
        };
      }).filter((x) => x.value > 0);

      return sortBy(out, 'sort:asc');
    },

    noClustersWarning() {
      if (this.noClusters) {
        return this.t('fleet.dashboard.cards.noClusters', { type: this.typeLabel });
      }

      return null;
    },

    perClusterResourceCountTooltips() {
      const out: Record<string, string> = {};

      Object.entries(this.value.status?.perClusterResourceCounts).forEach(([clusterName, perClusterResourceCount]) => {
        const clonedResourcesDefaultStates = clone(this.resourcesDefaultStates);
        const lowerCasePerClusterResourceCount = Object.fromEntries(
          Object.entries(perClusterResourceCount).map(([key, value]) => [key.toLowerCase(), value])
        );

        out[clusterName] = '';
        Object.entries(clonedResourcesDefaultStates).forEach(
          ([state, stateObject]) => {
            out[clusterName] += lowerCasePerClusterResourceCount[state] ? `${ stateObject.label }: ${ lowerCasePerClusterResourceCount[state] } <br>` : '';
          }
        );
      });

      return out;
    },
  },
};
</script>

<template>
  <div class="summary-panel">
    <div v-clean-tooltip="resourcesTooltip">
      <div
        class="details"
      >
        <ProgressBarMulti
          class="state-parts"
          :values="stateParts"
        />
      </div>
      <div class="mt-10 summary">
        <div
          v-if="value.stateDescription"
          class="error mt-10"
        >
          <span
            v-clean-tooltip="value.stateDescription"
            class="label wrap-text"
            :class="{ 'text-error' : value.stateObj.error }"
          >
            {{ value.stateDescription }}
          </span>
        </div>
        <div
          v-else-if="noClusters"
          class="no-clusters"
        >
          <span
            v-clean-tooltip="noClustersWarning"
            class="wrap-text"
          >
            {{ noClustersWarning }}
          </span>
        </div>
        <div
          v-else
          class="count"
          @click="toggleCardClusters()"
          @click.stop
        >
          <div class="label">
            <div>
              <span class="large">{{ summary.partial }}</span>
              <span
                v-if="summary.partial !== summary.total && summary.total !== 0"
                class="label-secondary"
              >/{{ summary.total }}</span>
            </div>
            <div>
              <span class="label-secondary">{{ t('fleet.dashboard.cards.resourceSummary.part1') }}</span>
              <span class="large">{{ summary.clusters }}</span>
              <span class="label-secondary">{{ t('fleet.dashboard.cards.resourceSummary.part2', { count: summary.clusters }) }}</span>
            </div>
          </div>
          <RcButton
            small
            ghost
          >
            <i
              :class="{
                ['icon icon-lg icon-chevron-down']: !isOpen,
                ['icon icon-lg icon-chevron-up']: isOpen,
              }"
              aria-hidden="true"
            />
          </RcButton>
        </div>
      </div>
    </div>
    <div v-if="isOpen">
      <div
        v-for="(tooltip, clusterName) in (perClusterResourceCountTooltips as Record<string, any> | undefined)"
        :key="clusterName"
        class="resource-popover-card"
      >
        <div class="spacer-small" />
        <ResourcePopover
          :id="clusterName"
          type="fleet.cattle.io.cluster"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .summary-panel {
    width: 100%;

    .progress {
      width: 100%;
      margin-top: 4px;
    }

    .progress, .progress * {
      height: 6px;
      border-right: 1px solid var(--body-bg);
    }

    .details {
      display: flex;
      align-items: center;
    }

    .summary {
      margin-top: 5px;

      .no-clusters {
        display: flex;
        align-items: center;
        margin-top: 10px;

        .icon {
          margin-right: 5px;
        }
      }

      .count {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .icon {
          margin-right: 3px;
        }

        .label {
          display: inline-flex;
          gap: 8px;

          .large {
            font-size: 18px;
          }

          .label-secondary{
            color: var(--label-secondary);
          }
        }
      }
    }
  }

  .wrap-text {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
  }
  .resource-popover-card {
    width: 288px;
  }
</style>
