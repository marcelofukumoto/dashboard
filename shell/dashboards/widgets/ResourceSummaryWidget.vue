<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import WorkloadCard from '@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadCard.vue';
import { DashboardContext } from '@shell/types/dashboards';
import { labelForType, storeForContext, summaryCounts } from '@shell/dashboards/widget-utils';

const props = defineProps<{
  config: Record<string, any>;
  context: DashboardContext;
}>();

const store = useStore();
const { t } = useI18n(store);

const type = computed(() => props.config?.resource);

const schema = computed(() => (type.value ? store.getters[`${ storeForContext(props.context) }/schemaFor`](type.value) : null));

const counts = computed(() => (type.value ? summaryCounts(store, props.context, type.value) : null));

const name = computed(() => (type.value ? labelForType(store, props.context, type.value) : ''));

const rows = computed(() => {
  const c = counts.value;

  if (!c) {
    return [];
  }

  return [
    {
      label: t('dashboardWidgets.resourceSummary.healthy'), color: 'success', counts: c.useful ? [{ label: '', count: c.useful }] : []
    },
    {
      label: t('dashboardWidgets.resourceSummary.warning'), color: 'warning', counts: c.warningCount ? [{ label: '', count: c.warningCount }] : []
    },
    {
      label: t('dashboardWidgets.resourceSummary.notHealthy'), color: 'error', counts: c.errorCount ? [{ label: '', count: c.errorCount }] : []
    },
  ];
});

const location = computed(() => {
  const product = store.getters['currentProduct'];

  if (!type.value || !product) {
    return null;
  }

  return {
    name: 'c-cluster-product-resource',
    params: { product: product.name, resource: type.value },
  };
});
</script>

<template>
  <div class="resource-summary-widget">
    <div
      v-if="!type"
      class="widget-placeholder"
    >
      {{ t('dashboardWidgets.unconfigured') }}
    </div>
    <div
      v-else-if="!schema || !counts"
      class="widget-placeholder"
    >
      {{ t('dashboardWidgets.resourceSummary.noCounts', { type }) }}
    </div>
    <template v-else>
      <!-- The widget header already names the resource, so only the count is needed here -->
      <router-link
        v-if="location"
        :to="location"
        class="total"
        :aria-label="name"
        data-testid="resource-summary-widget-total"
      >
        <span class="total-count">{{ counts.total }}</span>
      </router-link>
      <WorkloadCard
        class="breakdown"
        :rows="rows"
        :aria-label="name"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.resource-summary-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;

  .total {
    align-items: baseline;
    color: var(--body-text);
    display: flex;
    gap: 8px;
    padding: 4px 16px 0;

    &:hover .total-count {
      color: var(--link);
    }

    .total-count {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.1;
    }

  }

  .breakdown {
    padding-top: 0;
  }
}

.widget-placeholder {
  align-items: center;
  color: var(--muted);
  display: flex;
  height: 100%;
  justify-content: center;
  padding: 12px;
  text-align: center;
}
</style>
