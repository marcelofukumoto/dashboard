<script setup lang="ts">
import {
  computed, getCurrentInstance, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import AppModal from '@shell/components/AppModal.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { TextAreaAutoGrow } from '@components/Form/TextArea';
import DashboardGrid from '@shell/components/Dashboard/DashboardGrid.vue';
import DashboardWidgetPalette from '@shell/components/Dashboard/DashboardWidgetPalette.vue';
import WidgetConfigModal from '@shell/components/Dashboard/WidgetConfigModal.vue';
import { availableDashboardWidgets, createWidgetInstance } from '@shell/dashboards/registry';
import { CLASSIC_DASHBOARD, useDashboards } from '@shell/dashboards/use-dashboards';
import { compact } from '@shell/dashboards/layout';
import { DashboardContext, DashboardWidgetDefinition, DashboardWidgetInstance } from '@shell/types/dashboards';

// Registers the built in widgets
import '@shell/dashboards/built-in';

const props = defineProps<{
  context: DashboardContext;
  /** When set, a tab is offered that takes the user back to the page's original content */
  classicLabel?: string;
}>();

const emit = defineEmits<{(e: 'update:classic', value: boolean): void}>();

const store = useStore();
const { t } = useI18n(store);
const $extension = (getCurrentInstance()?.proxy as any)?.$extension;

const {
  dashboards, current, isClassic, defaultId, seed, select, updateWidgets, add, rename, remove, setDefault, reset, exportDashboard, importDashboard
} = useDashboards(store, props.context);

const editing = ref(false);
const gridRef = ref<InstanceType<typeof DashboardGrid> | null>(null);
const configuring = ref<DashboardWidgetInstance | null>(null);
const prompt = ref<'add' | 'rename' | 'import' | 'export' | null>(null);
const promptValue = ref('');
const promptError = ref('');

const paletteWidgets = computed<DashboardWidgetDefinition[]>(() => availableDashboardWidgets(props.context, $extension));

const definitions = computed<Record<string, DashboardWidgetDefinition>>(() => paletteWidgets.value.reduce((acc, definition) => {
  acc[definition.id] = definition;

  return acc;
}, {} as Record<string, DashboardWidgetDefinition>));

const widgets = computed(() => current.value?.widgets || []);

const configuringDefinition = computed(() => (configuring.value ? definitions.value[configuring.value.type] : null));

onMounted(seed);

watch(isClassic, (value) => {
  if (value) {
    editing.value = false;
  }

  emit('update:classic', value);
}, { immediate: true });

function openPrompt(mode: 'add' | 'rename' | 'import' | 'export') {
  promptError.value = '';
  promptValue.value = mode === 'rename' ? (current.value?.name || '') : (mode === 'export' ? exportDashboard(current.value?.id || '') : '');
  prompt.value = mode;
}

async function confirmPrompt() {
  const value = promptValue.value.trim();

  try {
    if (prompt.value === 'add' && value) {
      await add(value);
      editing.value = true;
    } else if (prompt.value === 'rename' && value && current.value) {
      await rename(current.value.id, value);
    } else if (prompt.value === 'import') {
      await importDashboard(promptValue.value);
    }
  } catch (e: any) {
    promptError.value = e?.message || `${ e }`;

    return;
  }

  prompt.value = null;
}

async function duplicate() {
  if (current.value) {
    await add(t('customDashboard.copyOf', { name: current.value.name }), current.value);
    editing.value = true;
  }
}

async function onDelete() {
  if (current.value) {
    await remove(current.value.id);
  }
}

async function addFromPalette(definition: DashboardWidgetDefinition) {
  await updateWidgets(compact([...widgets.value, createWidgetInstance(definition, widgets.value)]));
  editing.value = true;
}

function startPaletteDrag(definition: DashboardWidgetDefinition, ev: PointerEvent) {
  gridRef.value?.beginPaletteDrag(definition, ev);
}

async function saveWidgetConfig(widget: DashboardWidgetInstance) {
  await updateWidgets(widgets.value.map((w) => (w.id === widget.id ? widget : w)));
  configuring.value = null;
}
</script>

<template>
  <div
    class="configurable-dashboard"
    data-testid="configurable-dashboard"
  >
    <div class="dashboard-bar">
      <ul
        class="dashboard-tabs"
        data-testid="dashboard-tabs"
      >
        <li v-if="classicLabel">
          <button
            type="button"
            class="dashboard-tab"
            :class="{ 'dashboard-tab--active': isClassic }"
            data-testid="dashboard-tab-classic"
            @click="select(CLASSIC_DASHBOARD)"
          >
            {{ classicLabel }}
          </button>
        </li>
        <li
          v-for="dashboard in dashboards"
          :key="dashboard.id"
        >
          <button
            type="button"
            class="dashboard-tab"
            :class="{ 'dashboard-tab--active': !isClassic && dashboard.id === current?.id }"
            :data-testid="`dashboard-tab-${ dashboard.id }`"
            @click="select(dashboard.id)"
          >
            {{ dashboard.name }}
            <i
              v-if="dashboard.id === defaultId"
              v-clean-tooltip="t('customDashboard.isDefault')"
              class="icon icon-pin"
            />
          </button>
        </li>
        <li>
          <button
            type="button"
            class="dashboard-tab dashboard-tab--add"
            :aria-label="t('customDashboard.addDashboard')"
            data-testid="dashboard-add"
            @click="openPrompt('add')"
          >
            <i class="icon icon-plus" />
          </button>
        </li>
      </ul>

      <div
        v-if="!isClassic"
        class="dashboard-actions"
      >
        <button
          v-if="editing"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-rename"
          @click="openPrompt('rename')"
        >
          {{ t('customDashboard.actions.rename') }}
        </button>
        <button
          v-if="editing"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-duplicate"
          @click="duplicate"
        >
          {{ t('customDashboard.actions.duplicate') }}
        </button>
        <button
          v-if="editing && current?.preset"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-reset"
          @click="reset(current.id)"
        >
          {{ t('customDashboard.actions.reset') }}
        </button>
        <button
          v-if="editing"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-share"
          @click="openPrompt('export')"
        >
          {{ t('customDashboard.actions.share') }}
        </button>
        <button
          v-if="editing"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-import"
          @click="openPrompt('import')"
        >
          {{ t('customDashboard.actions.import') }}
        </button>
        <button
          v-if="editing && current"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-set-default"
          @click="setDefault(current.id)"
        >
          {{ current.id === defaultId ? t('customDashboard.actions.unsetDefault') : t('customDashboard.actions.setDefault') }}
        </button>
        <button
          v-if="editing && dashboards.length > 1"
          type="button"
          class="btn btn-sm role-secondary"
          data-testid="dashboard-delete"
          @click="onDelete"
        >
          {{ t('customDashboard.actions.delete') }}
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="editing ? 'role-primary' : 'role-secondary'"
          data-testid="dashboard-edit-toggle"
          @click="editing = !editing"
        >
          {{ editing ? t('customDashboard.actions.done') : t('customDashboard.actions.customise') }}
        </button>
      </div>
    </div>

    <div
      v-if="!isClassic"
      class="dashboard-body"
      :class="{ 'dashboard-body--editing': editing }"
    >
      <DashboardWidgetPalette
        v-if="editing"
        class="dashboard-palette"
        :widgets="paletteWidgets"
        @drag="startPaletteDrag"
        @add="addFromPalette"
      />
      <DashboardGrid
        ref="gridRef"
        class="dashboard-canvas"
        :widgets="widgets"
        :definitions="definitions"
        :context="context"
        :editing="editing"
        @update="updateWidgets"
        @configure="configuring = $event"
      />
    </div>

    <WidgetConfigModal
      v-if="configuring && configuringDefinition"
      :widget="configuring"
      :definition="configuringDefinition"
      :context="context"
      @close="configuring = null"
      @save="saveWidgetConfig"
    />

    <AppModal
      v-if="prompt"
      :width="520"
      name="dashboard-prompt"
      @close="prompt = null"
    >
      <div class="dashboard-prompt">
        <h2>{{ t(`customDashboard.prompt.${ prompt }`) }}</h2>
        <TextAreaAutoGrow
          v-if="prompt === 'import' || prompt === 'export'"
          v-model:value="promptValue"
          :min-height="160"
          :placeholder="t('customDashboard.prompt.jsonPlaceholder')"
          data-testid="dashboard-prompt-json"
        />
        <LabeledInput
          v-else
          v-model:value="promptValue"
          :label="t('customDashboard.prompt.nameLabel')"
          data-testid="dashboard-prompt-name"
        />
        <p
          v-if="promptError"
          class="text-error mt-10"
        >
          {{ promptError }}
        </p>
        <div class="prompt-actions">
          <button
            type="button"
            class="btn role-secondary"
            @click="prompt = null"
          >
            {{ prompt === 'export' ? t('generic.close') : t('generic.cancel') }}
          </button>
          <button
            v-if="prompt !== 'export'"
            type="button"
            class="btn role-primary"
            data-testid="dashboard-prompt-confirm"
            @click="confirmPrompt"
          >
            {{ t('generic.ok') }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
.configurable-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-bar {
  align-items: flex-end;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.dashboard-tabs {
  display: flex;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;

  .dashboard-tab {
    background: transparent;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    color: var(--body-text);
    cursor: pointer;
    font-size: 14px;
    padding: 6px 14px;

    &:hover {
      color: var(--link);
    }

    &--active {
      background: var(--body-bg);
      border-color: var(--border);
      font-weight: 600;
      margin-bottom: -1px;
    }

    &--add {
      padding: 6px 10px;
    }
  }
}

.dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 6px;
}

.dashboard-body {
  display: flex;
  gap: 12px;

  .dashboard-canvas {
    flex: 1 1 auto;
    min-width: 0;
  }

  .dashboard-palette {
    flex: 0 0 240px;
    height: fit-content;
    order: 2;
  }
}

.dashboard-prompt {
  padding: 16px;

  h2 {
    margin-bottom: 16px;
  }

  .prompt-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
