<script lang="ts">
import { PropType } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { RcTag } from '@components/Pill';

export default {
  name: 'FleetTargetsList',

  components: { RcTag },

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
      return this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));
    }
  },
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
      <RcTag
        v-for="(cluster, i) in clustersRenderList"
        :key="i"
        type="active"
      >
        <router-link
          :to="cluster.detailLocation"
          target="_blank"
          class="chip-link"
        >
          {{ cluster.name }}&nbsp;<i class="icon icon-external-link chip-icon" />
        </router-link>
      </RcTag>
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
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    max-height: 90vh;
    overflow: auto;

    :deep(.rc-tag) {
      flex-shrink: 0;
    }
  }
  .chip-icon {
    font-size: 11px;
    display: none;
  }
  .chip-link {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .chip-link:hover .chip-icon {
    display: inline;
  }
</style>
