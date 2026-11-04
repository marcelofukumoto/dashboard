<script setup lang="ts">
import { computed, ref } from 'vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import SortableTable from '@shell/components/SortableTable';
import ButtonGroup from '@shell/components/ButtonGroup';
import { Checkbox } from '@components/Form/Checkbox';
import { RcTag } from '@components/Pill';
import { STATE } from '@shell/config/table-headers';
import { DEFAULT_ROUTE, needsAttention, reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ClusterPullState, ClusterStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.clusters';

const STATE_SORT: Record<ClusterPullState, number> = {
  noRoute:       0,
  unreachable:   1,
  authFailed:    2,
  tlsError:      3,
  failover:      4,
  waiting:       5,
  updatePending: 6,
  pulled:        7,
};

const attentionOnly = defineModel<boolean>('attentionOnly', { default: false });

const emit = defineEmits<{(e: 'open-cluster', status: ClusterStatus): void}>();

const {
  t, age, clusterStateDisplay, clusterMessage
} = useFleetOCIStorageLabels();
const { data, statuses, forceUpdate } = useFleetOCIStorage();

const group = ref('none');
const groupOptions = computed(() => [
  {
    tooltipKey: `${ ROOT }.group.none`, icon: 'icon-list-flat', value: 'none'
  },
  {
    tooltipKey: `${ ROOT }.group.registry`, icon: 'icon-storage', value: 'registryGroup'
  },
  {
    tooltipKey: `${ ROOT }.group.route`, icon: 'icon-folder', value: 'routeGroup'
  },
]);

const headers = [
  STATE,
  {
    name: 'name', labelKey: 'tableHeaders.name', value: 'name', sort: ['name']
  },
  {
    name: 'route', labelKey: `${ ROOT }.headers.route`, value: 'routeName', sort: ['routeName', 'name']
  },
  {
    name: 'registry', labelKey: `${ ROOT }.headers.registry`, value: 'registryName', sort: ['registryName', 'name']
  },
  { name: 'credentials', labelKey: `${ ROOT }.headers.credentials` },
  {
    name: 'bundles', labelKey: `${ ROOT }.headers.bundles`, value: 'pulledCount', sort: ['pulledCount'], align: 'right', width: 90
  },
  {
    name: 'lastPull', labelKey: `${ ROOT }.headers.lastPull`, value: 'lastPull', sort: ['lastPull']
  },
];

const defaultRouteLabel = computed(() => t('fleet.ociStorage.routing.defaultRoute'));

const rows = computed(() => statuses.value
  .filter((status) => !attentionOnly.value || needsAttention(status.state))
  .map((status) => {
    // A failing cluster still has a registry: the one it keeps trying is what the admin needs to see
    const registryName = status.pullingFrom || status.failedRegistry;
    const registry = data.value.registries.find((r) => r.name === registryName) || null;
    const noRegistry = t(`${ ROOT }.noRegistry`);

    return {
      key:           status.cluster.name,
      name:          status.cluster.name,
      status,
      registry,
      stateSort:     STATE_SORT[status.state],
      nameSort:      status.cluster.name,
      routeName:     status.route?.name || defaultRouteLabel.value,
      routeLocation: {
        name:   'c-cluster-fleet-oci-storage-route-id',
        params: { cluster: BLANK_CLUSTER, id: status.route?.name || DEFAULT_ROUTE },
      },
      registryLocation: {
        name:   'c-cluster-fleet-oci-storage-registry-id',
        params: { cluster: BLANK_CLUSTER, id: registryName || '' },
      },
      routeGroup:       status.route?.name || defaultRouteLabel.value,
      registryName:     registryName || '',
      registryGroup:    registryName || noRegistry,
      reference:        registry ? reference(registry) : '',
      agentUser:        registry ? (registry.agentUsername || registry.username || t('fleet.ociStorage.registries.anonymous')) : '',
      isFailover:       status.state === 'failover',
      pulledCount:      status.pulledCount,
      total:            status.pulls.length,
      lastPull:         status.cluster.lastPullMinutesAgo ?? Number.MAX_SAFE_INTEGER,
      ...clusterStateDisplay(status.state),
      stateDescription: clusterMessage(status),
      availableActions: [
        {
          action: 'view', label: t('fleet.ociStorage.actions.viewDetails'), icon: 'icon icon-info', enabled: true
        },
        {
          action: 'update', label: t('fleet.ociStorage.actions.forceUpdate'), icon: 'icon icon-refresh', enabled: status.state === 'updatePending'
        },
      ],
      view() {
        emit('open-cluster', status);
      },
      update() {
        forceUpdate([status.cluster.name]);
      },
    };
  }));

const groupBy = computed(() => (group.value === 'none' ? null : group.value));
</script>

<template>
  <SortableTable
    :headers="headers"
    :rows="rows"
    :table-actions="false"
    :paging="false"
    :group-by="groupBy"
    key-field="key"
    default-sort-by="state"
    data-testid="fleet-oci-clusters-table"
  >
    <template #header-middle>
      <div class="table-filters">
        <ButtonGroup
          v-model:value="group"
          :options="groupOptions"
          size="medium"
        />
        <Checkbox
          v-model:value="attentionOnly"
          :label="t(`${ ROOT }.attentionOnly`)"
          data-testid="fleet-oci-clusters-attention"
        />
      </div>
    </template>

    <template #cell:name="{ row }">
      <a
        href="#"
        :data-testid="`fleet-oci-cluster-${ row.name }`"
        @click.prevent="emit('open-cluster', row.status)"
      >{{ row.name }}</a>
    </template>

    <template #cell:route="{ row }">
      <router-link :to="row.routeLocation">
        {{ row.routeName }}
      </router-link>
    </template>

    <template #cell:registry="{ row }">
      <template v-if="row.registryName">
        <span class="pulling-from">
          <router-link :to="row.registryLocation">{{ row.registryName }}</router-link>
          <RcTag
            v-if="row.isFailover"
            type="inactive"
          >{{ t(`${ ROOT }.failoverTag`) }}</RcTag>
        </span>
        <div class="text-muted cell-description">
          {{ row.reference }}
        </div>
      </template>
      <span
        v-else
        class="text-muted"
      >{{ t(`${ ROOT }.noRegistry`) }}</span>
    </template>

    <template #cell:credentials="{ row }">
      <span v-if="row.agentUser">{{ row.agentUser }}</span>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </template>

    <template #cell:bundles="{ row }">
      {{ row.pulledCount }}/{{ row.total }}
    </template>

    <template #cell:lastPull="{ row }">
      {{ age(row.status.cluster.lastPullMinutesAgo) }}
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.table-filters {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pulling-from {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cell-description {
  font-size: 12px;
  word-break: break-all;
}
</style>
