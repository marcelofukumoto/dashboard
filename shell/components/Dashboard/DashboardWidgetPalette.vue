<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DashboardWidgetDefinition } from '@shell/types/dashboards';

defineProps<{ widgets: DashboardWidgetDefinition[] }>();

const emit = defineEmits<{(e: 'drag', definition: DashboardWidgetDefinition, ev: PointerEvent): void, (e: 'add', definition: DashboardWidgetDefinition): void}>();

const store = useStore();
const { t } = useI18n(store);

function label(definition: DashboardWidgetDefinition): string {
  return definition.labelKey ? t(definition.labelKey) : (definition.label || definition.id);
}

function description(definition: DashboardWidgetDefinition): string {
  return definition.descriptionKey ? t(definition.descriptionKey) : (definition.description || '');
}
</script>

<template>
  <aside
    class="widget-palette"
    data-testid="dashboard-widget-palette"
  >
    <h3 class="palette-title">
      {{ t('customDashboard.palette.title') }}
    </h3>
    <p class="palette-hint">
      {{ t('customDashboard.palette.hint') }}
    </p>
    <ul class="palette-list">
      <li
        v-for="definition in widgets"
        :key="definition.id"
        class="palette-item"
        :data-testid="`dashboard-palette-${ definition.id }`"
        @pointerdown.prevent="emit('drag', definition, $event)"
      >
        <i
          v-if="definition.icon"
          class="icon"
          :class="definition.icon"
        />
        <span class="palette-item-text">
          <span class="palette-item-label">
            {{ label(definition) }}
            <span
              v-if="definition.source"
              class="palette-item-source"
            >{{ definition.source }}</span>
          </span>
          <span
            v-if="description(definition)"
            class="palette-item-description"
          >{{ description(definition) }}</span>
        </span>
        <button
          type="button"
          class="btn role-link palette-add"
          :aria-label="t('customDashboard.palette.add', { name: label(definition) })"
          :data-testid="`dashboard-palette-add-${ definition.id }`"
          @pointerdown.stop
          @click="emit('add', definition)"
        >
          <i class="icon icon-plus" />
        </button>
      </li>
    </ul>
  </aside>
</template>

<style lang="scss" scoped>
.widget-palette {
  background: var(--nav-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md, 4px);
  padding: 12px;

  .palette-title {
    font-size: 14px;
    margin: 0;
  }

  .palette-hint {
    color: var(--muted);
    font-size: 12px;
    margin: 4px 0 10px;
  }

  .palette-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .palette-item {
    align-items: center;
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: grab;
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    user-select: none;

    &:hover {
      border-color: var(--primary);
    }
  }

  .palette-item-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .palette-item-label {
    align-items: center;
    display: flex;
    font-size: 13px;
    font-weight: 600;
    gap: 6px;
  }

  .palette-item-source {
    background: var(--nav-bg);
    border-radius: 10px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 400;
    padding: 1px 8px;
    text-transform: uppercase;
  }

  .palette-item-description {
    color: var(--muted);
    font-size: 11px;
  }

  .palette-add {
    line-height: 1;
    margin-left: auto;
    min-height: auto;
    padding: 2px 4px;
  }
}
</style>
