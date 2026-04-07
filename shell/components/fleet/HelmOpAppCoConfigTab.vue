<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { set } from '@shell/utils/object';
import { isPrerelease } from '@shell/utils/version';
import { ZERO_TIME, FLEET_APPCO_AUTH_GENERATE_NAME } from '@shell/config/types';
import dayjs from 'dayjs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LazyImage from '@shell/components/LazyImage';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import Labels from '@shell/components/form/Labels';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { RcSection } from '@components/RcSection';
import HelmOpResourcesSection from '@shell/components/fleet/HelmOpResourcesSection.vue';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';
import HelmOpValuesTab from '@shell/components/fleet/HelmOpValuesTab.vue';
import HelmOpTargetTab from '@shell/components/fleet/HelmOpTargetTab.vue';

const props = defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  realMode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  appCoChartEntries: {
    type:    Object,
    default: () => ({})
  },
  appCoChartsLoading: {
    type:    Boolean,
    default: false
  },
  // Values tab props
  chartValues: {
    type:    String,
    default: ''
  },
  chartValuesInit: {
    type:    String,
    default: ''
  },
  yamlForm: {
    type:    String,
    default: ''
  },
  yamlFormOptions: {
    type:    Array,
    default: () => []
  },
  yamlDiffModeOptions: {
    type:    Array,
    default: () => []
  },
  isYamlDiff: {
    type:    Boolean,
    default: false
  },
  editorMode: {
    type:    String,
    default: ''
  },
  diffMode: {
    type:    String,
    default: ''
  },
  isRealModeEdit: {
    type:    Boolean,
    default: false
  },
  // Target tab props
  targetsCreated: {
    type:    String,
    default: ''
  },
  // Advanced tab props
  sourceType: {
    type:     String,
    required: true
  },
  isSuseAppCollection: {
    type:    Boolean,
    default: false
  },
  tempCachedValues: {
    type:    Object,
    default: () => ({})
  },
  correctDriftEnabled: {
    type:    Boolean,
    default: false
  },
  pollingInterval: {
    type:    Number,
    default: undefined
  },
  isPollingEnabled: {
    type:    Boolean,
    default: false
  },
  showPollingIntervalMinValueWarning: {
    type:    Boolean,
    default: false
  },
  enablePollingTooltip: {
    type:    String,
    default: null
  },
  isNullOrStaticVersion: {
    type:    Boolean,
    default: false
  },
  downstreamSecretsList: {
    type:    Array,
    default: () => []
  },
  downstreamConfigMapsList: {
    type:    Array,
    default: () => []
  },
  registerBeforeHook: {
    type:     Function,
    required: true
  },
});

const emit = defineEmits([
  'update:value',
  'update:targets',
  'targets-created',
  'update:yaml-form',
  'update:chart-values',
  'update:diff-mode',
  'update:auth',
  'update:cached-auth',
  'update:correct-drift',
  'update:downstream-resources',
  'toggle-polling',
  'update:polling-interval',
  'update:validate-polling-interval',
]);

const store = useStore();
const { t } = useI18n(store);

const selectedChartName = computed(() => props.value.spec?.helm?.chart || '');

const selectedChartVersions = computed(() => {
  const chart = selectedChartName.value;

  if (!chart || !props.appCoChartEntries[chart]) {
    return [];
  }

  return props.appCoChartEntries[chart];
});

const versionOptions = computed(() => {
  return selectedChartVersions.value
    .filter((entry) => !isPrerelease(entry.version))
    .map((entry) => {
      const isZeroTime = !entry.created || entry.created === ZERO_TIME;

      return {
        label: entry.version,
        value: entry.version,
        date:  isZeroTime ? '' : dayjs(entry.created).format('MMM D, YYYY'),
      };
    })
    .sort((a, b) => b.value.localeCompare(a.value, undefined, { numeric: true, sensitivity: 'base' }));
});

const selectedVersion = computed(() => props.value.spec?.helm?.version || '');

const selectedChartEntry = computed(() => {
  const chart = selectedChartName.value;
  const version = selectedVersion.value;

  if (!chart || !props.appCoChartEntries[chart]) {
    return null;
  }

  return props.appCoChartEntries[chart].find((e) => e.version === version) || props.appCoChartEntries[chart][0] || null;
});

const chartIcon = computed(() => selectedChartEntry.value?.icon || '');

const chartSubHeaderItems = computed(() => {
  const items = [];
  const entry = selectedChartEntry.value;

  if (!entry) {
    return items;
  }

  if (entry.version) {
    items.push({
      icon:        'icon-version-alt',
      iconTooltip: { key: 'tableHeaders.version' },
      label:       entry.version,
    });
  }

  if (entry.created) {
    const isZeroTime = entry.created === ZERO_TIME;

    items.push({
      icon:        'icon-refresh-alt',
      iconTooltip: { key: 'tableHeaders.lastUpdated' },
      label:       isZeroTime ? t('generic.na') : dayjs(entry.created).format('MMM D, YYYY'),
    });
  }

  return items;
});

const onVersionSelect = (val) => {
  set(props.value, 'spec.helm.version', val);
};

const appCoLockedSecrets = computed(() => {
  return props.downstreamSecretsList.filter((name) => name.startsWith(FLEET_APPCO_AUTH_GENERATE_NAME));
});
</script>

<template>
  <div class="appco-config-tab">
    <div class="appco-main-section">
      <!-- Chart header -->
      <div
        v-if="selectedChartName"
        class="chart-header"
        data-testid="appco-config-chart-header"
      >
        <div class="chart-header-icon">
          <LazyImage
            v-if="chartIcon"
            :src="chartIcon"
            class="chart-icon"
          />
          <div
            v-else
            class="chart-icon-placeholder"
          >
            <i class="icon icon-helm" />
          </div>
        </div>
        <div class="chart-header-info">
          <h3 class="chart-header-title">
            {{ selectedChartName }}
          </h3>
          <AppChartCardSubHeader :items="chartSubHeaderItems" />
        </div>
      </div>

      <!-- Chart version -->
      <div class="appco-main-content">
        <div class="col span-6">
          <LabeledSelect
            :value="selectedVersion"
            :options="versionOptions"
            :loading="appCoChartsLoading"
            :mode="mode"
            :label="t('fleet.helmOp.appCoConfig.chartVersion')"
            :searchable="true"
            option-key="value"
            data-testid="appco-config-version-select"
            @update:value="onVersionSelect"
          >
            <template #option="opt">
              <div class="version-option">
                <span>{{ opt.label }}</span>
                <span
                  v-if="opt.date"
                  class="version-option-date"
                >{{ opt.date }}</span>
              </div>
            </template>
            <template #selected-option="opt">
              <div class="version-option">
                <span>{{ opt.label }}</span>
                <span
                  v-if="opt.date"
                  class="version-option-date"
                >{{ opt.date }}</span>
              </div>
            </template>
          </LabeledSelect>
        </div>
        <!-- Name and Description -->
        <NameNsDescription
          :value="value"
          :namespaced="false"
          :mode="mode"
          :no-margin-bottom="true"
          :name-label="'fleet.helmOp.appCoConfig.name'"
          data-testid="appco-config-name-ns-description"
          @update:value="emit('update:value', $event)"
        />
      </div>
    </div>

    <!-- Deploy To -->
    <HelmOpTargetTab
      :value="value"
      :mode="mode"
      :real-mode="realMode"
      :is-view="isView"
      :targets-created="targetsCreated"
      :hide-additional-options="true"
      @update:targets="$emit('update:targets', $event)"
      @targets-created="$emit('targets-created', $event)"
    />

    <!-- Advanced section -->
    <RcSection
      :title="t('fleet.helmOp.appCoConfig.advanced')"
      mode="with-header"
      type="primary"
      expandable
      :expanded="false"
      data-testid="appco-config-advanced"
    >
      <div class="content-group">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.helm.releaseName"
              :mode="mode"
              :label-key="'fleet.helmOp.source.release.fullLabel'"
              :placeholder="t('fleet.helmOp.source.release.placeholder', null, true)"
            />
          </div>
        </div>
        <RcSection
          :title="t('fleet.helmOp.resources.label')"
          mode="with-header"
          type="secondary"
          expandable
          :expanded="false"
          data-testid="appco-config-resources"
        >
          <HelmOpResourcesSection
            :value="value"
            :mode="mode"
            :correct-drift-enabled="correctDriftEnabled"
            :downstream-secrets-list="downstreamSecretsList"
            :downstream-config-maps-list="downstreamConfigMapsList"
            :locked-secrets="appCoLockedSecrets"
            @update:correct-drift="$emit('update:correct-drift', $event)"
            @update:downstream-resources="$emit('update:downstream-resources', $event)"
          />
        </RcSection>
        <RcSection
          :title="t('fleet.helmOp.target.targetAdditionalOptions')"
          mode="with-header"
          type="secondary"
          expandable
          :expanded="false"
          data-testid="appco-config-target-options"
        >
          <HelmOpTargetOptionsSection
            :value="value"
            :mode="mode"
            :stacked="true"
          />
        </RcSection>
        <RcSection
          :title="t('generic.labelsAndAnnotations', {}, true)"
          mode="with-header"
          type="secondary"
          expandable
          :expanded="false"
          data-testid="appco-config-labels"
        >
          <Labels
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
            :add-icon="'icon-plus'"
          />
        </RcSection>
        <RcSection
          :title="t('fleet.helmOp.values.title')"
          mode="with-header"
          type="secondary"
          expandable
          :expanded="false"
          data-testid="appco-config-values"
        >
          <HelmOpValuesTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :is-view="isView"
            :chart-values="chartValues"
            :chart-values-init="chartValuesInit"
            :yaml-form="yamlForm"
            :yaml-form-options="yamlFormOptions"
            :yaml-diff-mode-options="yamlDiffModeOptions"
            :is-yaml-diff="isYamlDiff"
            :editor-mode="editorMode"
            :diff-mode="diffMode"
            :is-real-mode-edit="isRealModeEdit"
            @update:yaml-form="$emit('update:yaml-form', $event)"
            @update:chart-values="$emit('update:chart-values', $event)"
            @update:diff-mode="$emit('update:diff-mode', $event)"
          />
        </RcSection>
      </div>
    </RcSection>
  </div>
</template>

<style lang="scss" scoped>
.appco-config-tab {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.content-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appco-main-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.appco-main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 50px;
}

.chart-header-icon {
  flex-shrink: 0;

  .chart-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .chart-icon-placeholder {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--body-bg);
    border-radius: var(--border-radius);
    border: 1px solid var(--border);

    .icon {
      font-size: 28px;
    }
  }
}

.chart-header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-header-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
}

.version-option {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.version-option-date {
  color: var(--muted);
}
</style>
