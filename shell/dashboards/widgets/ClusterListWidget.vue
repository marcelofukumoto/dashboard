<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { BadgeState } from '@components/BadgeState';
import { MANAGEMENT } from '@shell/config/types';

const props = defineProps<{ config: Record<string, any> }>();

const store = useStore();
const { t } = useI18n(store);

const loading = ref(true);

const schema = computed(() => store.getters['management/schemaFor'](MANAGEMENT.CLUSTER));

const clusters = computed(() => {
  const all = store.getters['management/all'](MANAGEMENT.CLUSTER) || [];
  const filtered = props.config?.unhealthyOnly ? all.filter((c: any) => c.stateColor !== 'text-success') : all;

  return filtered.slice(0, Number(props.config?.limit) || 10);
});

onMounted(async() => {
  if (schema.value) {
    await store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
  }

  loading.value = false;
});
</script>

<template>
  <div class="cluster-list-widget">
    <div
      v-if="loading"
      class="text-muted"
    >
      {{ t('generic.loading') }}
    </div>
    <div
      v-else-if="!clusters.length"
      class="text-muted"
    >
      {{ t('dashboardWidgets.clusters.none') }}
    </div>
    <ul
      v-else
      class="cluster-list"
      data-testid="cluster-list-widget"
    >
      <li
        v-for="cluster in clusters"
        :key="cluster.id"
        class="cluster-row"
      >
        <router-link
          v-if="cluster.canExplore"
          :to="{ name: 'c-cluster-explorer', params: { cluster: cluster.id } }"
        >
          {{ cluster.nameDisplay }}
        </router-link>
        <span v-else>{{ cluster.nameDisplay }}</span>
        <BadgeState
          :color="cluster.stateBackground"
          :label="cluster.stateDisplay"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.cluster-list-widget {
  height: 100%;
  overflow: auto;
  padding: 4px 16px 16px;

  .cluster-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .cluster-row {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    line-height: 26px;
  }
}
</style>
