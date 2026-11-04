<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import ResourceTable from '@shell/components/ResourceTable';
import { RcTag } from '@components/Pill';
import { STATE } from '@shell/config/table-headers';
import { queryFor } from '@shell/utils/table-views/query';
import type { TableViewState } from '@shell/types/table-views';
import { ATTENTION_STATES, DEFAULT_ROUTE, reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { backoff, useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { OCI_TABLE_SCHEMAS } from '@shell/components/fleet/FleetOCIStorage/tableConfig';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
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

const emit = defineEmits<{(e: 'open-cluster', status: ClusterStatus): void}>();

const {
  t, age, reason, clusterStateDisplay, clusterMessage
} = useFleetOCIStorageLabels();
const {
  workspace, data, statuses, forceUpdate
} = useFleetOCIStorage();

const table = useTemplateRef<{ view: TableViewState, openTabView:(view: TableViewState) => void }>('table');

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
  {
    name: 'credentials', labelKey: `${ ROOT }.headers.credentials`, value: 'agentUser', sort: ['agentUser']
  },
  {
    name: 'bundles', labelKey: `${ ROOT }.headers.bundles`, value: 'bundlesLabel', sort: ['pulledCount'], align: 'right', width: 90
  },
  {
    name: 'lastPull', labelKey: `${ ROOT }.headers.lastPull`, value: 'lastPullLabel', sort: ['lastPull']
  },
];

const defaultRouteLabel = computed(() => t('fleet.ociStorage.routing.defaultRoute'));

const rows = computed(() => statuses.value
  .map((status) => {
    // A failing cluster still has a registry: the one it keeps trying is what the admin needs to see
    const registryName = status.pullingFrom || status.failedRegistry;
    const registry = data.value.registries.find((r) => r.name === registryName) || null;
    const pendingMinutes = status.waitingOn[0]?.pendingOn[status.targetRegistry as string];
    const retry = pendingMinutes === undefined ? null : backoff(pendingMinutes);

    return {
      key:           status.cluster.name,
      name:          status.cluster.name,
      metadata:      { labels: status.cluster.labels },
      state:         status.state,
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
      registryName:         registryName || '',
      reference:            registry ? reference(registry) : '',
      namespaceLabel:       registry?.namespace || '',
      tlsLabel:             registry ? (registry.basicHTTP ? t('fleet.ociStorage.tls.basicHTTP') : t(`fleet.ociStorage.tls.${ registry.tlsMode }`)) : '',
      secretRef:            registry ? `${ workspace.value }/${ registry.name }` : '',
      chainLabel:           status.chain.join(', '),
      failedRegistryName:   status.failedRegistry || '',
      failureLabel:         reason(status.failedAccess),
      waitingOnLabel:       status.waitingOn.map((a) => a.bundle).join(', '),
      attempt:              retry?.attempt ?? '',
      nextRetryLabel:       retry ? t(`${ ROOT }.nextRetry`, { minutes: retry.nextMinutes }) : '',
      replicationWaitLabel: t(`${ ROOT }.replicationWait`, { minutes: status.replicationWaitMinutes }),
      agentUser:            registry ? (registry.agentUsername || registry.username || t('fleet.ociStorage.registries.anonymous')) : '',
      isFailover:           status.state === 'failover',
      pulledCount:          status.pulledCount,
      bundlesLabel:         `${ status.pulledCount }/${ status.pulls.length }`,
      lastPull:             status.cluster.lastPullMinutesAgo ?? Number.MAX_SAFE_INTEGER,
      lastPullLabel:        age(status.cluster.lastPullMinutesAgo),
      ...clusterStateDisplay(status.state),
      stateDescription:     clusterMessage(status),
      availableActions:     [
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

function showAttention() {
  const present = ATTENTION_STATES.filter((state) => statuses.value.some((status) => status.state === state));
  const query = queryFor(present.map((state) => t(`${ ROOT }.state.${ state }`)));

  if (table.value) {
    table.value.openTabView({ ...table.value.view, query });
  }
}

defineExpose({ showAttention });
</script>

<template>
  <ResourceTable
    ref="table"
    :schema="OCI_TABLE_SCHEMAS.cluster"
    :headers="headers"
    :rows="rows"
    :namespaced="false"
    :table-actions="false"
    key-field="key"
    default-sort-by="state"
    data-testid="fleet-oci-clusters-table"
  >
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
  </ResourceTable>
</template>

<style lang="scss" scoped>
.pulling-from {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
}

.cell-description {
  font-size: 12px;
  word-break: break-all;
}
</style>
