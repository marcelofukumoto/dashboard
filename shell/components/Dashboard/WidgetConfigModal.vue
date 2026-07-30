<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import AppModal from '@shell/components/AppModal.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { TextAreaAutoGrow } from '@components/Form/TextArea';
import { Checkbox } from '@components/Form/Checkbox';
import { clone } from '@shell/utils/object';
import { DashboardContext, DashboardWidgetConfigField, DashboardWidgetDefinition, DashboardWidgetInstance } from '@shell/types/dashboards';

const props = defineProps<{
  widget: DashboardWidgetInstance;
  definition: DashboardWidgetDefinition;
  context: DashboardContext;
}>();

const emit = defineEmits<{(e: 'close'): void, (e: 'save', widget: DashboardWidgetInstance): void}>();

const store = useStore();
const { t } = useI18n(store);

const config = ref<Record<string, any>>(clone(props.widget.config || {}));
const title = ref<string>(props.widget.title || '');

// Make sure every declared field has a value, so the inputs are always controlled
(props.definition.configFields || []).forEach((field) => {
  if (config.value[field.name] === undefined) {
    const fallback = field.type === 'boolean' ? false : (field.type === 'number' ? 0 : '');

    config.value[field.name] = field.default !== undefined ? field.default : fallback;
  }
});

const fields = computed(() => props.definition.configFields || []);

function fieldLabel(field: DashboardWidgetConfigField): string {
  return field.labelKey ? t(field.labelKey) : (field.label || field.name);
}

function optionsFor(field: DashboardWidgetConfigField) {
  if (typeof field.options === 'function') {
    return field.options({ store, context: props.context });
  }

  return field.options || [];
}

function save() {
  emit('save', {
    ...props.widget,
    title: title.value.trim() || undefined,
    config: clone(config.value),
  });
}
</script>

<template>
  <AppModal
    :width="520"
    name="widget-config"
    data-testid="dashboard-widget-config-modal"
    @close="emit('close')"
  >
    <div class="widget-config">
      <h2>{{ t('customDashboard.widget.configureTitle') }}</h2>

      <LabeledInput
        v-model:value="title"
        class="mb-10"
        :label="t('customDashboard.widget.titleField')"
        :placeholder="definition.labelKey ? t(definition.labelKey) : definition.label"
        data-testid="dashboard-widget-config-title"
      />

      <template
        v-for="field in fields"
        :key="field.name"
      >
        <LabeledSelect
          v-if="field.type === 'select'"
          v-model:value="config[field.name]"
          class="mb-10"
          :label="fieldLabel(field)"
          :options="optionsFor(field)"
          :data-testid="`dashboard-widget-config-${ field.name }`"
        />
        <TextAreaAutoGrow
          v-else-if="field.type === 'text'"
          v-model:value="config[field.name]"
          class="mb-10"
          :min-height="80"
          :placeholder="fieldLabel(field)"
          :data-testid="`dashboard-widget-config-${ field.name }`"
        />
        <Checkbox
          v-else-if="field.type === 'boolean'"
          v-model:value="config[field.name]"
          class="mb-10"
          :label="fieldLabel(field)"
          :data-testid="`dashboard-widget-config-${ field.name }`"
        />
        <LabeledInput
          v-else
          v-model:value="config[field.name]"
          class="mb-10"
          :type="field.type === 'number' ? 'number' : 'text'"
          :label="fieldLabel(field)"
          :placeholder="field.placeholder"
          :data-testid="`dashboard-widget-config-${ field.name }`"
        />
      </template>

      <p
        v-if="!fields.length"
        class="text-muted"
      >
        {{ t('customDashboard.widget.noConfig') }}
      </p>

      <div class="config-actions">
        <button
          type="button"
          class="btn role-secondary"
          @click="emit('close')"
        >
          {{ t('generic.cancel') }}
        </button>
        <button
          type="button"
          class="btn role-primary"
          data-testid="dashboard-widget-config-save"
          @click="save"
        >
          {{ t('generic.save') }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.widget-config {
  padding: 16px;

  h2 {
    margin-bottom: 16px;
  }

  .config-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
