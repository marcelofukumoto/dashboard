<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

defineProps<{
  title: string;
  icon?: string;
  source?: string;
  editing: boolean;
  configurable: boolean;
}>();

const emit = defineEmits<{(e: 'configure'): void, (e: 'remove'): void, (e: 'move', ev: PointerEvent): void, (e: 'resize', ev: PointerEvent): void}>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <section
    class="widget-frame"
    :class="{ 'widget-frame--editing': editing }"
  >
    <header
      class="widget-header"
      @pointerdown="editing && emit('move', $event)"
    >
      <span
        v-if="editing"
        class="widget-grip"
        aria-hidden="true"
      />
      <i
        v-if="icon"
        class="icon"
        :class="icon"
      />
      <h3 class="widget-title">
        {{ title }}
      </h3>
      <span
        v-if="source"
        class="widget-source"
      >{{ source }}</span>
      <div
        v-if="editing"
        class="widget-actions"
      >
        <button
          v-if="configurable"
          type="button"
          class="btn role-link widget-action"
          :aria-label="t('customDashboard.widget.configure')"
          data-testid="dashboard-widget-configure"
          @pointerdown.stop
          @click="emit('configure')"
        >
          <i class="icon icon-gear" />
        </button>
        <button
          type="button"
          class="btn role-link widget-action"
          :aria-label="t('customDashboard.widget.remove')"
          data-testid="dashboard-widget-remove"
          @pointerdown.stop
          @click="emit('remove')"
        >
          <i class="icon icon-close" />
        </button>
      </div>
    </header>
    <div class="widget-body">
      <slot />
      <!-- In edit mode the widget content is inert so the whole tile can be dragged -->
      <div
        v-if="editing"
        class="widget-shield"
        @pointerdown="emit('move', $event)"
      />
    </div>
    <span
      v-if="editing"
      class="widget-resize"
      :title="t('customDashboard.widget.resize')"
      data-testid="dashboard-widget-resize"
      @pointerdown.stop="emit('resize', $event)"
    />
  </section>
</template>

<style lang="scss" scoped>
.widget-frame {
  background: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md, 4px);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;

  &--editing {
    border-style: dashed;

    .widget-header {
      cursor: grab;
    }
  }
}

.widget-header {
  align-items: center;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 6px;
  flex: 0 0 auto;
  padding: 6px 10px;

  .widget-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .widget-source {
    background: var(--nav-bg);
    border-radius: 10px;
    color: var(--muted);
    font-size: 10px;
    padding: 1px 8px;
    text-transform: uppercase;
  }

  .widget-actions {
    display: flex;
    margin-left: auto;
  }

  .widget-action {
    line-height: 1;
    min-height: auto;
    padding: 2px 4px;
  }

  .widget-grip {
    background-image: radial-gradient(var(--muted) 1px, transparent 1px);
    background-size: 3px 3px;
    height: 12px;
    width: 8px;
  }
}

.widget-body {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
}

.widget-shield {
  cursor: grab;
  inset: 0;
  position: absolute;
}

.widget-resize {
  border-bottom: 2px solid var(--muted);
  border-right: 2px solid var(--muted);
  bottom: 4px;
  cursor: nwse-resize;
  height: 10px;
  position: absolute;
  right: 4px;
  width: 10px;
}
</style>
