<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import SortableTable from '@shell/components/SortableTable';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { RcStatusBadge, RcStatusIndicator, RcTag } from '@components/Pill';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import { DEFAULT_ROUTE, isFailing } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ClusterPullState, ClusterStatus, OCIRoute } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.routing';

const emit = defineEmits<{(e: 'open-cluster', status: ClusterStatus): void}>();

const store = useStore();
const router = useRouter();
const { t } = useFleetOCIStorageLabels();
const {
  data, statuses, deleteRoute, moveRoute
} = useFleetOCIStorage();

const headers = [
  {
    name: 'order', labelKey: `${ ROOT }.headers.order`, width: 90
  },
  { name: 'name', labelKey: 'tableHeaders.name' },
  { name: 'match', labelKey: `${ ROOT }.headers.match` },
  { name: 'registries', labelKey: `${ ROOT }.headers.registries` },
  { name: 'clusters', labelKey: `${ ROOT }.headers.clusters` },
];

function matchChips(route: OCIRoute): string[] {
  return [
    ...route.clusterNames.map((name) => t(`${ ROOT }.cluster`, { name })),
    ...route.clusterGroups.map((name) => t(`${ ROOT }.group`, { name })),
    ...route.selectors.flatMap((selector) => [
      ...Object.entries(selector.matchLabels || {}).map(([key, value]) => `${ key }=${ value }`),
      ...(selector.matchExpressions || []).filter((e) => e.key).map((e) => `${ e.key } ${ e.operator } ${ (e.values || []).join(',') }`.trim()),
    ]),
  ];
}

function health(clusters: ClusterStatus[]) {
  return {
    failing:  clusters.filter((s) => isFailing(s.state)).length,
    failover: clusters.filter((s) => s.state === 'failover').length,
    waiting:  clusters.filter((s) => s.state === 'waiting').length,
    pending:  clusters.filter((s) => s.state === 'updatePending').length,
  };
}

function dotStatus(state: ClusterPullState): 'success' | 'warning' | 'error' | 'info' {
  if (isFailing(state)) {
    return 'error';
  }

  if (state === 'failover') {
    return 'warning';
  }

  return state === 'pulled' ? 'success' : 'info';
}

function confirmDelete(name: string) {
  store.dispatch('management/promptModal', {
    component:      'GenericPrompt',
    componentProps: {
      title:       t(`${ ROOT }.delete.title`, { name }),
      body:        t(`${ ROOT }.delete.body`),
      applyMode:   'delete',
      actionColor: 'bg-error',
      applyAction: async() => deleteRoute(name),
    },
  });
}

function location(name: string) {
  return {
    name:   'c-cluster-fleet-oci-storage-route-id',
    params: { cluster: BLANK_CLUSTER, id: name },
  };
}

const rows = computed(() => {
  const routes = data.value.routes;
  const out = routes.map((route, index) => {
    const clusters = statuses.value.filter((s) => s.route?.name === route.name);

    return {
      key:              route.name,
      name:             route.name,
      order:            index + 1,
      description:      route.description,
      location:         location(route.name),
      chips:            matchChips(route),
      registries:       route.registries,
      clusters,
      health:           health(clusters),
      canMoveUp:        index > 0,
      canMoveDown:      index < routes.length - 1,
      availableActions: [
        {
          action: 'edit', label: t('fleet.ociStorage.actions.edit'), icon: 'icon icon-edit', enabled: true
        },
        {
          action: 'up', label: t('fleet.ociStorage.actions.moveUp'), icon: 'icon icon-chevron-up', enabled: index > 0
        },
        {
          action: 'down', label: t('fleet.ociStorage.actions.moveDown'), icon: 'icon icon-chevron-down', enabled: index < routes.length - 1
        },
        { divider: true },
        {
          action: 'remove', label: t('fleet.ociStorage.actions.delete'), icon: 'icon icon-trash', enabled: true
        },
      ],
      edit() {
        router.push(location(route.name));
      },
      up() {
        moveRoute(route.name, -1);
      },
      down() {
        moveRoute(route.name, 1);
      },
      remove() {
        confirmDelete(route.name);
      },
    };
  });

  const defaultClusters = statuses.value.filter((s) => !s.route);

  out.push({
    key:              DEFAULT_ROUTE,
    name:             t(`${ ROOT }.defaultRoute`),
    order:            routes.length + 1,
    description:      t(`${ ROOT }.defaultDescription`),
    location:         location(DEFAULT_ROUTE),
    chips:            [],
    registries:       data.value.defaultRegistries,
    clusters:         defaultClusters,
    health:           health(defaultClusters),
    canMoveUp:        false,
    canMoveDown:      false,
    availableActions: [
      {
        action: 'edit', label: t('fleet.ociStorage.actions.edit'), icon: 'icon icon-edit', enabled: true
      },
    ],
    edit() {
      router.push(location(DEFAULT_ROUTE));
    },
    up() {},
    down() {},
    remove() {},
  });

  return out;
});

const isSimple = computed(() => !data.value.routes.length);
</script>

<template>
  <div>
    <p class="text-deemphasized mmb-4">
      {{ t(`${ ROOT }.intro`) }}
    </p>
    <Banner
      v-if="isSimple"
      color="info"
      :label="t(`${ ROOT }.singleRegistry`)"
    />
    <SortableTable
      :headers="headers"
      :rows="rows"
      :table-actions="false"
      :paging="false"
      :search="false"
      :sub-rows="true"
      :sub-expandable="true"
      :sub-expand-column="true"
      key-field="key"
      data-testid="fleet-oci-routes-table"
    >
      <template #cell:order="{ row }">
        <span class="order-cell">
          <span class="order-number">{{ row.order }}</span>
          <RcButton
            v-if="row.canMoveUp || row.canMoveDown"
            variant="ghost"
            size="small"
            :class="{ 'no-move': !row.canMoveUp }"
            :aria-label="t('fleet.ociStorage.actions.moveUp')"
            :data-testid="`fleet-oci-route-up-${ row.key }`"
            @click.stop="row.up()"
          >
            <i
              class="icon icon-chevron-up"
              aria-hidden="true"
            />
          </RcButton>
          <RcButton
            v-if="row.canMoveUp || row.canMoveDown"
            variant="ghost"
            size="small"
            :class="{ 'no-move': !row.canMoveDown }"
            :aria-label="t('fleet.ociStorage.actions.moveDown')"
            :data-testid="`fleet-oci-route-down-${ row.key }`"
            @click.stop="row.down()"
          >
            <i
              class="icon icon-chevron-down"
              aria-hidden="true"
            />
          </RcButton>
        </span>
      </template>

      <template #cell:name="{ row }">
        <router-link :to="row.location">
          {{ row.name }}
        </router-link>
        <div
          v-if="row.description"
          class="text-muted cell-description"
        >
          {{ row.description }}
        </div>
      </template>

      <template #cell:match="{ row }">
        <span
          v-if="row.key === 'default'"
          class="text-muted"
        >{{ t(`${ ROOT }.allOther`) }}</span>
        <span
          v-else
          class="chips"
        >
          <RcTag
            v-for="chip in row.chips"
            :key="chip"
            type="inactive"
          >
            {{ chip }}
          </RcTag>
        </span>
      </template>

      <template #cell:registries="{ row }">
        <RegistryChain
          v-if="row.registries.length"
          :registries="row.registries"
        />
        <span
          v-else
          class="text-error"
        >{{ t(`${ ROOT }.noRegistry`) }}</span>
      </template>

      <template #cell:clusters="{ row }">
        <span class="health">
          <span>{{ t(`${ ROOT }.clusterCount`, { count: row.clusters.length }) }}</span>
          <RcStatusBadge
            v-if="row.health.pending"
            status="info"
          >
            {{ t(`${ ROOT }.healthPending`, { count: row.health.pending }) }}
          </RcStatusBadge>
          <RcStatusBadge
            v-if="row.health.waiting"
            status="info"
          >
            {{ t(`${ ROOT }.healthWaiting`, { count: row.health.waiting }) }}
          </RcStatusBadge>
          <RcStatusBadge
            v-if="row.health.failover"
            status="warning"
          >
            {{ t(`${ ROOT }.healthFailover`, { count: row.health.failover }) }}
          </RcStatusBadge>
          <RcStatusBadge
            v-if="row.health.failing"
            status="error"
          >
            {{ t(`${ ROOT }.healthError`, { count: row.health.failing }) }}
          </RcStatusBadge>
        </span>
      </template>

      <template #sub-row="{ row, fullColspan, onRowMouseEnter, onRowMouseLeave }">
        <tr
          class="sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td :colspan="fullColspan">
            <div class="route-clusters">
              <a
                v-for="status in row.clusters"
                :key="status.cluster.name"
                href="#"
                class="route-cluster"
                @click.prevent="emit('open-cluster', status)"
              >
                <RcStatusIndicator
                  shape="disc"
                  :status="dotStatus(status.state)"
                />
                {{ status.cluster.name }}
              </a>
              <span
                v-if="!row.clusters.length"
                class="text-muted"
              >{{ t(`${ ROOT }.clusterCount`, { count: 0 }) }}</span>
            </div>
          </td>
        </tr>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.order-cell {
  display: inline-flex;
  align-items: center;
  gap: 2px;

  .order-number {
    min-width: 18px;
    font-weight: 600;
  }

  .no-move {
    visibility: hidden;
  }
}

.cell-description {
  font-size: 12px;
}

.chips, .health {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.route-clusters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 0 8px 32px;

  .route-cluster {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
