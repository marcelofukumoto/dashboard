<script lang="ts">
import { PropType } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';

export default {
  name: 'FleetTargetsList',

  props: {
    clusters: {
      type:    Array as PropType<Cluster[]>,
      default: () => [],
    },

    emptyLabel: {
      type:    String,
      default: ''
    },

    chips: {
      type:    Boolean,
      default: false
    },

    hideTitle: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    clustersRenderList() {
      const clustersRenderList = this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));

      return clustersRenderList;
    }
  }
};
</script>

<template>
  <div
    class="targets-list-main"
    :class="{ 'no-background': chips }"
  >
    <h3 v-if="!hideTitle">
      {{ t('fleet.clusterTargets.rules.matching.title', { n: clustersRenderList.length }) }}
    </h3>
    <div
      v-if="chips"
      class="targets-list-chips"
    >
      <span
        v-for="(cluster, i) in clustersRenderList"
        :key="i"
        class="target-chip"
      >
        <router-link
          :to="cluster.detailLocation"
          target="_blank"
          class="chip-link"
        >
          {{ cluster.name }}&nbsp;<i class="icon icon-external-link chip-icon" />
        </router-link>
      </span>
      <span
        v-if="!clustersRenderList.length"
        class="text-label"
      >
        {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
      </span>
    </div>
    <div
      v-else
      class="targets-list-list"
    >
      <span
        v-for="(cluster, i) in clustersRenderList"
        :key="i"
        class="row mt-5"
      >
        <router-link
          :to="cluster.detailLocation"
          target="_blank"
          class="link-main"
        >
          {{ cluster.name }}&nbsp;<i class="link-icon icon icon-external-link" />
        </router-link>
      </span>
      <span
        v-if="!clustersRenderList.length"
        class="text-label"
      >
        {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .targets-list-main {
    height: 100%;
    border-radius: 4px;
    padding: 16px;
    background-color: var(--tabbed-sidebar-bg);
    display: flex;
    flex-direction: column;

    &.no-background {
      background-color: transparent;
      padding: 0;
    }
  }
  .targets-list-list {
    overflow-y: auto;
  }
  .link-main{
    word-spacing: 22px;
    line-height: 17px;
  }
  .link-icon {
    margin-left: -14px;
    display: none;
  }
  .link-main:hover .link-icon {
    display: inline;
  }
  .targets-list-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .target-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid var(--primary);
    background-color: var(--body-bg);
    font-size: 13px;
    line-height: 1.4;
  }
  .chip-link {
    color: var(--primary);
    text-decoration: none;
  }
  .chip-icon {
    font-size: 11px;
    display: none;
  }
  .chip-link:hover .chip-icon {
    display: inline;
  }
</style>
