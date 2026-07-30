<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import DashboardWidgetFrame from '@shell/components/Dashboard/DashboardWidgetFrame.vue';
import {
  GRID_COLUMNS, GRID_ROW_HEIGHT, clampToGrid, compact, gridRows, resolveCollisions
} from '@shell/dashboards/layout';
import { createWidgetInstance } from '@shell/dashboards/registry';
import { DashboardContext, DashboardWidgetDefinition, DashboardWidgetInstance } from '@shell/types/dashboards';

const props = defineProps<{
  widgets: DashboardWidgetInstance[];
  definitions: Record<string, DashboardWidgetDefinition>;
  context: DashboardContext;
  editing: boolean;
}>();

const emit = defineEmits<{(e: 'update', widgets: DashboardWidgetInstance[]): void, (e: 'configure', widget: DashboardWidgetInstance): void}>();

const store = useStore();
const { t } = useI18n(store);

const gridEl = ref<HTMLElement | null>(null);
const working = ref<DashboardWidgetInstance[] | null>(null);
const ghost = ref<DashboardWidgetInstance | null>(null);

type DragMode = 'move' | 'resize' | 'create';

interface DragState {
  mode: DragMode;
  id?: string;
  definition?: DashboardWidgetDefinition;
  startX: number;
  startY: number;
  orig: DashboardWidgetInstance;
  base: DashboardWidgetInstance[];
  cellWidth: number;
}

const drag = ref<DragState | null>(null);

const layout = computed(() => working.value || props.widgets);

const rowCount = computed(() => {
  const rows = gridRows(layout.value) + (ghost.value ? ghost.value.h : 0);

  return props.editing ? Math.max(rows + 2, 8) : Math.max(rows, 1);
});

function definitionFor(widget: DashboardWidgetInstance): DashboardWidgetDefinition | undefined {
  return props.definitions[widget.type];
}

function titleFor(widget: DashboardWidgetInstance): string {
  const definition = definitionFor(widget);

  if (widget.title) {
    return widget.title;
  }

  if (!definition) {
    return widget.type;
  }

  const fallback = definition.labelKey ? t(definition.labelKey) : (definition.label || definition.id);

  return definition.title?.(widget.config || {}, { store, context: props.context }) || fallback;
}

function tileStyle(widget: DashboardWidgetInstance) {
  return {
    left: `${ (widget.x / GRID_COLUMNS) * 100 }%`,
    width: `${ (widget.w / GRID_COLUMNS) * 100 }%`,
    top: `${ widget.y * GRID_ROW_HEIGHT }px`,
    height: `${ widget.h * GRID_ROW_HEIGHT }px`,
  };
}

function cellWidth(): number {
  return (gridEl.value?.clientWidth || GRID_COLUMNS) / GRID_COLUMNS;
}

function attach() {
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function detach() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
}

function beginDrag(mode: 'move' | 'resize', widget: DashboardWidgetInstance, ev: PointerEvent) {
  if (!props.editing || ev.button !== 0) {
    return;
  }

  ev.preventDefault();

  drag.value = {
    mode,
    id: widget.id,
    startX: ev.clientX,
    startY: ev.clientY,
    orig: { ...widget },
    base: props.widgets.map((w) => ({ ...w })),
    cellWidth: cellWidth(),
  };

  working.value = drag.value.base;
  attach();
}

/**
 * Called by the palette when the user starts dragging a new widget across.
 * The widget follows the pointer and is only added if it is dropped on the grid.
 */
function beginPaletteDrag(definition: DashboardWidgetDefinition, ev: PointerEvent) {
  const instance = createWidgetInstance(definition, props.widgets, { x: 0, y: 0 });

  drag.value = {
    mode: 'create',
    definition,
    startX: ev.clientX,
    startY: ev.clientY,
    orig: instance,
    base: props.widgets.map((w) => ({ ...w })),
    cellWidth: cellWidth(),
  };

  attach();
}

function pointToCell(ev: PointerEvent, w: number, h: number): { x: number, y: number } | null {
  const rect = gridEl.value?.getBoundingClientRect();

  if (!rect || ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) {
    return null;
  }

  const cw = rect.width / GRID_COLUMNS;

  return {
    x: Math.max(0, Math.min(GRID_COLUMNS - w, Math.round((ev.clientX - rect.left) / cw - w / 2))),
    y: Math.max(0, Math.round((ev.clientY - rect.top) / GRID_ROW_HEIGHT - h / 2)),
  };
}

function onPointerMove(ev: PointerEvent) {
  const state = drag.value;

  if (!state) {
    return;
  }

  if (state.mode === 'create') {
    const cell = pointToCell(ev, state.orig.w, state.orig.h);

    if (!cell) {
      ghost.value = null;
      working.value = null;

      return;
    }

    ghost.value = { ...state.orig, ...cell };
    working.value = resolveCollisions(state.base, ghost.value);

    return;
  }

  const dx = Math.round((ev.clientX - state.startX) / state.cellWidth);
  const dy = Math.round((ev.clientY - state.startY) / GRID_ROW_HEIGHT);
  const min = state.definition?.minSize || props.definitions[state.orig.type]?.minSize;

  const moved = state.mode === 'move' ? clampToGrid({
    ...state.orig, x: state.orig.x + dx, y: state.orig.y + dy
  }) : clampToGrid({
    ...state.orig,
    w: Math.max(min?.w || 1, state.orig.w + dx),
    h: Math.max(min?.h || 1, state.orig.h + dy),
  });

  working.value = resolveCollisions(state.base, moved);
}

function onPointerUp() {
  const state = drag.value;
  const dropped = ghost.value;

  if (state && working.value && (state.mode !== 'create' || dropped)) {
    emit('update', compact(working.value));
  }

  drag.value = null;
  ghost.value = null;
  working.value = null;
  detach();
}

onBeforeUnmount(detach);

defineExpose({ beginPaletteDrag });
</script>

<template>
  <div
    ref="gridEl"
    class="dashboard-grid"
    :class="{ 'dashboard-grid--editing': editing }"
    :style="{ height: `${ rowCount * GRID_ROW_HEIGHT }px` }"
    data-testid="dashboard-grid"
  >
    <div
      v-if="editing && !layout.length && !ghost"
      class="grid-empty"
      data-testid="dashboard-grid-empty"
    >
      {{ t('customDashboard.emptyEditing') }}
    </div>

    <div
      v-for="widget in layout"
      :key="widget.id"
      class="grid-tile"
      :class="{ 'grid-tile--dragging': drag && drag.id === widget.id }"
      :style="tileStyle(widget)"
      :data-widget-type="widget.type"
      :data-widget-id="widget.id"
    >
      <DashboardWidgetFrame
        :title="titleFor(widget)"
        :icon="definitionFor(widget)?.icon"
        :source="definitionFor(widget)?.source"
        :editing="editing"
        :configurable="!!definitionFor(widget)?.configFields?.length"
        @move="beginDrag('move', widget, $event)"
        @resize="beginDrag('resize', widget, $event)"
        @configure="emit('configure', widget)"
        @remove="emit('update', compact(layout.filter((w) => w.id !== widget.id)))"
      >
        <component
          :is="definitionFor(widget)?.component"
          v-if="definitionFor(widget)"
          :config="widget.config"
          :context="context"
        />
        <div
          v-else
          class="grid-unknown"
        >
          {{ t('customDashboard.unknownWidget', { type: widget.type }) }}
        </div>
      </DashboardWidgetFrame>
    </div>

    <div
      v-if="ghost"
      class="grid-ghost"
      :style="tileStyle(ghost)"
      data-testid="dashboard-grid-ghost"
    />
  </div>
</template>

<style lang="scss" scoped>
.dashboard-grid {
  position: relative;
  transition: height 0.1s linear;
  width: 100%;

  &--editing {
    background-image:
      linear-gradient(to right, var(--border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--border) 1px, transparent 1px);
    background-size: calc(100% / 12) 56px;
    border-radius: 4px;
  }
}

.grid-tile {
  padding: 6px;
  position: absolute;
  transition: left 0.12s ease, top 0.12s ease, width 0.12s ease, height 0.12s ease;

  &--dragging {
    transition: none;
    z-index: 10;
  }
}

.grid-ghost {
  padding: 6px;
  pointer-events: none;
  position: absolute;
  z-index: 5;

  &::after {
    background: var(--primary);
    border-radius: 4px;
    content: '';
    display: block;
    height: 100%;
    opacity: 0.25;
  }
}

.grid-empty {
  align-items: center;
  border: 1px dashed var(--border);
  border-radius: 4px;
  color: var(--muted);
  display: flex;
  height: 100%;
  justify-content: center;
}

.grid-unknown {
  color: var(--muted);
  padding: 12px;
}
</style>
