<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { DashboardContext } from '@shell/types/dashboards';
import { storeForContext } from '@shell/dashboards/widget-utils';

const props = defineProps<{
  config: Record<string, any>;
  context: DashboardContext;
}>();

const store = useStore();
const { t } = useI18n(store);

const loading = ref(false);
const error = ref<string | null>(null);

const inStore = computed(() => storeForContext(props.context));
const type = computed(() => props.config?.resource);
const schema = computed(() => (type.value ? store.getters[`${ inStore.value }/schemaFor`](type.value) : null));

const rows = computed(() => (type.value ? store.getters[`${ inStore.value }/all`](type.value) || [] : []));

const headers = computed(() => {
  if (!schema.value) {
    return [];
  }

  const all = store.getters['type-map/headersFor'](schema.value) || [];
  const limit = Number(props.config?.columns) || 0;

  return limit > 0 ? all.slice(0, limit) : all;
});

const perPage = computed(() => Number(props.config?.rowsPerPage) || 5);

watch([type, schema], async() => {
  error.value = null;

  if (!type.value || !schema.value) {
    return;
  }

  loading.value = true;

  try {
    await store.dispatch(`${ inStore.value }/findAll`, { type: type.value });
  } catch (e: any) {
    error.value = e?.message || `${ e }`;
  } finally {
    loading.value = false;
  }
}, { immediate: true });
</script>

<template>
  <div class="resource-table-widget">
    <div
      v-if="!type"
      class="widget-placeholder"
    >
      {{ t('dashboardWidgets.unconfigured') }}
    </div>
    <div
      v-else-if="!schema"
      class="widget-placeholder"
    >
      {{ t('dashboardWidgets.resourceTable.noSchema', { type }) }}
    </div>
    <div
      v-else-if="error"
      class="widget-placeholder"
    >
      {{ error }}
    </div>
    <ResourceTable
      v-else
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :loading="loading"
      :rows-per-page="perPage"
      :table-actions="false"
      :row-actions="false"
      :groupable="false"
      :search="!!config.search"
      key-field="id"
      data-testid="resource-table-widget-table"
    />
  </div>
</template>

<style lang="scss" scoped>
.resource-table-widget {
  height: 100%;
  overflow: auto;
  padding: 0 12px 12px;

  :deep(table) {
    font-size: 13px;
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
