<script lang="ts">
import { PropType, watch } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { RcTag } from '@components/Pill';
import throttle from 'lodash/throttle';

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

  data() {
    return {
      showAll:    false,
      isOverflow: false,
      observed:   false,
    };
  },

  computed: {
    clustersRenderList() {
      return this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));
    }
  },

  mounted() {
    this.setupObserver();

    watch(() => this.showAll, (val) => {
      if (!val) {
        const root = this.$refs.chipsContainer;

        if (root) {
          root.querySelectorAll(':scope > .rc-tag').forEach((el) => {
            el.classList.remove('visible', 'hidden-chip', 'partial');
          });
          this.observed = false;
        }
      }
      this.$nextTick(() => this.observeChips());
    });
  },

  updated() {
    const root = this.$refs.chipsContainer;
    const count = root ? root.querySelectorAll(':scope > .rc-tag').length : 0;

    if (count !== this._lastChipCount) {
      this._lastChipCount = count;
      this.observeChips();
    }
  },

  beforeUnmount() {
    if (this.observerVisible) {
      this.observerVisible.disconnect();
      this.observerVisible = null;
    }
    if (this.observerHidden) {
      this.observerHidden.disconnect();
      this.observerHidden = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this._throttledResize) {
      this._throttledResize.cancel();
      this._throttledResize = null;
    }
  },

  methods: {
    setupObserver() {
      const root = this.$refs.chipsContainer;

      if (!root) {
        return;
      }

      this.observerVisible = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target.classList.contains('partial')) {
            return;
          }
          entry.target.classList.toggle('visible', entry.isIntersecting);
        });

        this.markPartialChip(root);
        this.observed = true;
        this.updateOverflow();
      }, {
        root,
        threshold: 1,
      });

      this.observerHidden = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('hidden-chip', !entry.isIntersecting);
        });

        this.markPartialChip(root);
        this.updateOverflow();
      }, {
        root,
        threshold: 0.2,
      });

      this.observeChips();

      this._lastWidth = root.offsetWidth;
      this._throttledResize = throttle((newWidth) => {
        this.handleResizeIncrease(root);
        this._lastWidth = newWidth;
      }, 300);

      this.resizeObserver = new ResizeObserver((entries) => {
        const newWidth = entries[0].contentRect.width;

        if (!this.showAll && this.observed && newWidth > this._lastWidth) {
          this._throttledResize(newWidth);
        } else {
          this._lastWidth = newWidth;
        }
      });
      this.resizeObserver.observe(root);
    },

    observeChips() {
      const root = this.$refs.chipsContainer;

      if (!this.observerVisible || !this.observerHidden || !root) {
        return;
      }

      this.observerVisible.disconnect();
      this.observerHidden.disconnect();
      root.querySelectorAll(':scope > .rc-tag').forEach((el) => {
        this.observerVisible.observe(el);
        this.observerHidden.observe(el);
      });
    },

    updateOverflow() {
      const root = this.$refs.chipsContainer;

      if (!root) {
        return;
      }

      const hasHidden = !!root.querySelector(':scope > .rc-tag.hidden-chip');
      const partial = root.querySelector(':scope > .rc-tag.partial');

      if (!hasHidden && partial) {
        // Temporarily unshrink to check if it actually needs to truncate
        partial.style.flexShrink = '0';
        const overflows = root.scrollWidth > root.clientWidth;

        partial.style.flexShrink = '';

        if (!overflows) {
          partial.classList.remove('partial');
          partial.classList.add('visible');
        }
      }

      this.isOverflow = !!root.querySelector(':scope > .rc-tag:not(.visible)');
    },

    markPartialChip(root) {
      root.querySelectorAll(':scope > .rc-tag.partial').forEach((el) => {
        el.classList.remove('partial');
      });

      const unresolved = root.querySelectorAll(':scope > .rc-tag:not(.visible):not(.hidden-chip)');

      if (unresolved.length === 1) {
        unresolved[0].classList.add('partial');
        this._expanding = false;
      } else if (unresolved.length === 0 && this._expanding) {
        // All chips settled — if still expanding and hidden chips remain, reveal next
        const nextHidden = root.querySelector(':scope > .rc-tag.hidden-chip');

        if (nextHidden) {
          nextHidden.classList.remove('hidden-chip');
          this.observerVisible.observe(nextHidden);
          this.observerHidden.observe(nextHidden);
        } else {
          this._expanding = false;
        }
      }
    },

    handleResizeIncrease(root) {
      this._expanding = true;

      const partial = root.querySelector(':scope > .rc-tag.partial');

      if (partial) {
        partial.classList.remove('partial');
      }

      const firstHidden = root.querySelector(':scope > .rc-tag.hidden-chip');

      if (firstHidden) {
        firstHidden.classList.remove('hidden-chip');
      }

      this.observeChips();
    },

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
      class="targets-list-chips-wrapper"
    >
      <div
        ref="chipsContainer"
        class="targets-list-chips"
        :class="{ 'collapsed': !showAll, 'observed': observed }"
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
        <a
          v-if="showAll"
          class="see-all-link"
          @click.prevent="showAll = false"
        >
          {{ t('generic.hide') }}
        </a>
      </div>
      <a
        v-if="isOverflow && !showAll"
        class="see-all-link"
        @click.prevent="showAll = true"
      >
        {{ t('generic.showAll') }}
      </a>
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
  .targets-list-chips-wrapper {
    display: flex;
    align-items: flex-start;
  }
  .targets-list-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    flex: 1;
    min-width: 0;

    &.collapsed.observed {
      flex-wrap: nowrap;
      overflow: hidden;

      :deep(.rc-tag) {
        flex-shrink: 0;
      }

      :deep(.rc-tag.partial) {
        flex-shrink: 1;
        min-width: 0;
      }

      .hidden-chip {
        display: none;
      }
    }

  }
  .see-all-link {
    color: var(--link);
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    line-height: 24px;
    flex-shrink: 0;
    padding-left: 8px;
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
