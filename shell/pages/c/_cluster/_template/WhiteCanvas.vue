<script>
import { CONFIG_MAP } from '@shell/config/types';
import TemplateCode from './TemplateCode.vue';

// The White Canvas: a single, special page bound to ONE hardcoded ConfigMap.
//
// Unlike the generic template engine (which discovers many label-tagged ConfigMaps and
// registers a nav entry + route per page), this page renders exactly one ConfigMap's
// `view.vue` and nothing else. It is meant for a fast, real-time authoring loop: an agent
// keeps rewriting default/white-canvas, and this page live-recompiles on every change.
//
// Real-time mechanism (no polling): the template engine already dispatches
// cluster/findAll(configmap) during cluster load, which opens a live socket watch on
// ConfigMaps. When the canvas ConfigMap is updated, the socket pushes the change, the
// Steve store swaps the resource, the `source` computed re-evaluates, and TemplateCode's
// `source` watcher recompiles + remounts the component. We re-assert the watch in fetch()
// so the page works even if opened before the engine ran.
export const CANVAS_NAMESPACE = 'default';
export const CANVAS_NAME = 'white-canvas';
export const CANVAS_ID = `${ CANVAS_NAMESPACE }/${ CANVAS_NAME }`;
const CODE_SOURCE_KEY = 'view.vue';

export default {
  name:       'WhiteCanvas',
  components: { TemplateCode },

  async fetch() {
    // Opens (or reuses) the live socket watch on ConfigMaps and ensures the canvas CM is
    // in the store cache. Swallow errors so a missing type/permission just shows the empty
    // state rather than breaking the page.
    try {
      await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
    } catch (e) {
      // no-op: computed falls back to the waiting state
    }
  },

  computed: {
    canvasId() {
      return CANVAS_ID;
    },

    canvasConfigMap() {
      // Read via the store getter each time so socket-driven updates re-trigger this
      // computed (and therefore `source`) reactively.
      return this.$store.getters['cluster/byId'](CONFIG_MAP, CANVAS_ID);
    },

    source() {
      return this.canvasConfigMap?.data?.[CODE_SOURCE_KEY] || '';
    },
  },
};
</script>

<template>
  <div class="white-canvas">
    <TemplateCode
      v-if="source"
      :source="source"
    />
    <div
      v-else
      class="white-canvas__empty text-muted"
    >
      <h2 class="mb-10">
        White Canvas
      </h2>
      <p>
        Waiting for the canvas ConfigMap
        <code>{{ canvasId }}</code> to define a <code>view.vue</code>.
      </p>
      <p>Ask the White Canvas agent to build something — it updates live here.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.white-canvas {
  height: 100%;

  &__empty {
    padding: 40px 20px;

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 1px 6px;
    }
  }
}
</style>
