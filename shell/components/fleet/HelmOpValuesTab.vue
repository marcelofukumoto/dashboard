<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import YamlEditor from '@shell/components/YamlEditor';
import FleetValuesFrom from '@shell/components/fleet/FleetValuesFrom.vue';

import type { ButtonGroupOption } from '@shell/types/components/buttonGroup';

interface HelmOpResource {
  spec: { helm: { valuesFrom?: unknown } };
  metadata: { namespace: string };
}

const yaml = ref<{ refresh?:() => void } | null>(null);
const effectiveEditor = ref<{ updateValue?: (v: string) => void; refresh?: () => void } | null>(null);

const refreshYaml = () => {
  nextTick(() => {
    yaml.value?.refresh?.();
    effectiveEditor.value?.refresh?.();
  });
};

defineExpose({ refreshYaml });

const props = withDefaults(defineProps<{
  value: HelmOpResource;
  mode: string;
  realMode: string;
  chartValues: string;
  chartValuesInit: string;
  yamlForm: string;
  yamlFormOptions: ButtonGroupOption[];
  yamlDiffModeOptions: ButtonGroupOption[];
  isYamlDiff: boolean;
  editorMode: string;
  diffMode: string;
  isRealModeEdit: boolean;
  hideTitle?: boolean;
  isSuseAppCollection?: boolean;
  bgBorder?: boolean;
  hideBanner?: boolean;
  compact?: boolean;
  effectiveValues?: string;
}>(), {
  hideTitle:           false,
  isSuseAppCollection: false,
  bgBorder:            false,
  hideBanner:          false,
  effectiveValues:     '',
});

// The read-only Effective values pane does not react to its value prop, so push
// updates into it when the parent recomputes the merged (defaults + your values) YAML.
watch(() => props.effectiveValues, (neu) => {
  nextTick(() => {
    effectiveEditor.value?.updateValue?.(neu || '');
    effectiveEditor.value?.refresh?.();
  });
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:yaml-form'): void;
  (e: 'update:chart-values', value: string): void;
  (e: 'update:diff-mode', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const updateYamlForm = () => {
  emit('update:yaml-form');
};

const updateChartValues = (value: string) => {
  emit('update:chart-values', value);
};

const updateDiffMode = (value: string) => {
  emit('update:diff-mode', value);
};

const updateValuesFrom = (valuesFrom: unknown) => {
  props.value.spec.helm.valuesFrom = valuesFrom;
};
</script>

<template>
  <div class="helmop-values-tab-container">
    <div v-if="compact">
      {{ t('fleet.helmOp.values.descriptionCompact') }}
    </div>
    <div data-testid="helmop-values-tab">
      <Banner
        v-if="!hideBanner"
        color="info"
        class="description mt-0"
        :label-key="isSuseAppCollection ? 'fleet.helmOp.values.appCoDescription' : 'fleet.helmOp.values.description'"
        data-testid="helmop-values-info-banner"
      />

      <h2 v-if="!hideTitle">
        {{ t('fleet.helmOp.values.title') }}
      </h2>

      <div class="mb-15">
        <div
          v-if="isRealModeEdit"
          class="yaml-form-controls"
        >
          <ButtonGroup
            :value="yamlForm"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            :options="yamlFormOptions"
            @update:value="updateYamlForm"
          />
          <div
            class="yaml-form-controls-spacer"
          >
          &nbsp;
          </div>
          <ButtonGroup
            v-if="isYamlDiff"
            :value="diffMode"
            :options="yamlDiffModeOptions"
            inactive-class="bg-disabled btn-sm"
            active-class="bg-primary btn-sm"
            @update:value="updateDiffMode"
          />
        </div>

        <div class="values-panes">
          <div class="values-pane">
            <div
              v-if="effectiveValues"
              class="values-pane__label"
            >
              Your values <span class="values-pane__hint">(only these are saved)</span>
            </div>
            <YamlEditor
              ref="yaml"
              :class="{ 'bg-border': bgBorder }"
              :value="chartValues"
              :mode="mode"
              :initial-yaml-values="chartValuesInit"
              :scrolling="true"
              :editor-mode="editorMode"
              :hide-preview-buttons="true"
              data-testid="helmop-values-yaml-editor"
              @update:value="updateChartValues"
            />
          </div>
          <div
            v-if="effectiveValues"
            class="values-pane"
          >
            <div class="values-pane__label">
              Effective values <span class="values-pane__hint">(chart defaults + your values, read-only)</span>
            </div>
            <YamlEditor
              ref="effectiveEditor"
              :class="{ 'bg-border': bgBorder }"
              :value="effectiveValues"
              mode="view"
              editor-mode="VIEW_CODE"
              :scrolling="true"
              :hide-preview-buttons="true"
              data-testid="helmop-effective-yaml-editor"
            />
          </div>
        </div>
      </div>

      <div class="mb-20">
        <FleetValuesFrom
          :value="value.spec.helm.valuesFrom"
          :namespace="value.metadata.namespace"
          :mode="realMode"
          :compact="compact"
          data-testid="helmop-values-from"
          @update:value="updateValuesFrom"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.yaml-form-controls {
  display: flex;
  margin-bottom: 15px;
}

.yaml-form-controls-spacer {
  flex: 1;
}

.bg-border {
  border: 2px solid var(--body-bg);
}

.helmop-values-tab-container {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.values-panes {
  display: flex;
  gap: 12px;

  .values-pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 50%;
    min-width: 0;

    &__label {
      font-weight: 600;
      margin-bottom: 6px;
    }

    &__hint {
      font-weight: normal;
      color: var(--input-label);
    }
  }
}
</style>
