<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import { RcTag } from '@components/Pill';
import { STATE } from '@shell/config/table-headers';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { REGISTRY_STATE_COLORS, reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { OCI_TABLE_SCHEMAS } from '@shell/components/fleet/FleetOCIStorage/tableConfig';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const ROOT = 'fleet.ociStorage.registries';

const store = useStore();
const router = useRouter();
const {
  t, age, size, registryMessage
} = useFleetOCIStorageLabels();
const {
  data, registryStatuses, deleteRegistry, setSource
} = useFleetOCIStorage();

const STATE_SORT = {
  error: 0, degraded: 1, replicating: 2, unused: 3, active: 4
};

const headers = [
  STATE,
  {
    name: 'name', labelKey: 'tableHeaders.name', value: 'name', sort: ['name'], width: 190
  },
  {
    name: 'reference', labelKey: `${ ROOT }.headers.reference`, value: 'reference', sort: ['reference']
  },
  {
    name: 'role', labelKey: `${ ROOT }.headers.role`, value: 'roleLabel', sort: ['roleSort', 'name']
  },
  {
    name: 'access', labelKey: `${ ROOT }.headers.access`, value: 'agentAccess', sort: ['agentAccess']
  },
  {
    name: 'clusters', labelKey: `${ ROOT }.headers.clusters`, value: 'clustersLabel', sort: ['activeCount'], align: 'right'
  },
  {
    name: 'artifacts', labelKey: `${ ROOT }.headers.artifacts`, value: 'artifactsLabel', sort: ['artifactCount'], align: 'right'
  },
  {
    name: 'activity', labelKey: `${ ROOT }.headers.activity`, value: 'activityLabel', sort: ['lastPull']
  },
];

function confirmDelete(name: string) {
  const routes = data.value.routes.filter((r) => r.registries.includes(name)).map((r) => r.name);
  const body = routes.length ? `${ t(`${ ROOT }.delete.body`) } ${ t(`${ ROOT }.delete.bodyUsed`, { routes: routes.join(', ') }) }` : t(`${ ROOT }.delete.body`);

  store.dispatch('management/promptModal', {
    component:      'GenericPrompt',
    componentProps: {
      title:       t(`${ ROOT }.delete.title`, { name }),
      body,
      applyMode:   'delete',
      actionColor: 'bg-error',
      applyAction: async() => deleteRegistry(name),
    },
  });
}

function confirmSetSource(name: string) {
  store.dispatch('management/promptModal', {
    component:      'GenericPrompt',
    componentProps: {
      title:       t(`${ ROOT }.setSource.title`, { name }),
      body:        t(`${ ROOT }.setSource.body`),
      applyMode:   'edit',
      applyAction: async() => setSource(name),
    },
  });
}

const rows = computed(() => registryStatuses.value.map((status) => {
  const { registry } = status;
  const location = {
    name:   'c-cluster-fleet-oci-storage-registry-id',
    params: { cluster: BLANK_CLUSTER, id: registry.name },
  };
  const description = registryMessage(status);
  const isSource = registry.role === 'source';

  return {
    key:           registry.name,
    name:          registry.name,
    nameSort:      registry.name,
    state:         status.state,
    stateSort:     STATE_SORT[status.state],
    description:   registry.description,
    reference:     reference(registry),
    host:          registry.host,
    namespace:     registry.namespace,
    role:          registry.role,
    roleLabel:     t(`fleet.ociStorage.role.${ registry.role }`),
    roleSort:      isSource ? 0 : 1,
    agentAccess:   registry.agentUsername || (isSource && registry.username) || t(`${ ROOT }.anonymous`),
    pushUser:      registry.username,
    tlsLabel:      registry.basicHTTP ? t('fleet.ociStorage.tls.basicHTTP') : t(`fleet.ociStorage.tls.${ registry.tlsMode }`),
    routesLabel:   data.value.routes.filter((r) => r.registries.includes(registry.name)).map((r) => r.name).join(', '),
    failingLabel:  status.failingClusters.map((c) => c.name).join(', '),
    lastPull:      status.lastPullMinutesAgo ?? Number.MAX_SAFE_INTEGER,
    activityLabel: [
      registry.lastPushMinutesAgo === null ? '' : t(`${ ROOT }.pushed`, { age: age(registry.lastPushMinutesAgo) }),
      status.lastPullMinutesAgo === null ? '' : t(`${ ROOT }.pulled`, { age: age(status.lastPullMinutesAgo) }),
    ].filter(Boolean).join(', '),
    clustersLabel:    t(`${ ROOT }.clusterCount`, { active: status.activeClusters.length, routed: status.routedClusters.length }),
    artifactsLabel:   status.artifactCount ? t(`${ ROOT }.artifactCount`, { count: status.artifactCount, size: size(status.sizeBytes) }) : '',
    isSource,
    registry,
    status,
    location,
    activeCount:      status.activeClusters.length,
    artifactCount:    status.artifactCount,
    stateDisplay:     t(`${ ROOT }.state.${ status.state }`),
    stateBackground:  REGISTRY_STATE_COLORS[status.state],
    stateDescription: description,
    stateObj:         { error: status.state === 'error' },
    availableActions: [
      {
        action: 'edit', label: t('fleet.ociStorage.actions.edit'), icon: 'icon icon-edit', enabled: true
      },
      {
        action: 'makeSource', label: t('fleet.ociStorage.actions.setSource'), icon: 'icon icon-upload', enabled: !isSource
      },
      { divider: true },
      {
        action: 'remove', label: t('fleet.ociStorage.actions.delete'), icon: 'icon icon-trash', enabled: !isSource
      },
    ],
    edit() {
      router.push(location);
    },
    makeSource() {
      confirmSetSource(registry.name);
    },
    remove() {
      confirmDelete(registry.name);
    },
  };
}));
</script>

<template>
  <ResourceTable
    :schema="OCI_TABLE_SCHEMAS.registry"
    :headers="headers"
    :rows="rows"
    :namespaced="false"
    :table-actions="false"
    key-field="key"
    default-sort-by="role"
    data-testid="fleet-oci-registries-table"
  >
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

    <template #cell:reference="{ row }">
      <span class="reference">{{ row.registry.host }}</span>
      <div class="text-muted cell-description reference">
        {{ row.registry.namespace }}
      </div>
    </template>

    <template #cell:role="{ row }">
      <RcTag :type="row.isSource ? 'active' : 'inactive'">
        {{ t(`fleet.ociStorage.role.${ row.role }`) }}
      </RcTag>
    </template>

    <template #cell:access="{ row }">
      <span
        v-if="row.registry.agentUsername"
        class="reference"
      >{{ row.registry.agentUsername }}</span>
      <span
        v-else-if="row.isSource && row.registry.username"
        v-clean-tooltip="t(`${ ROOT }.noAgentCredentials`)"
        class="reference text-warning"
      >
        <i
          class="icon icon-warning"
          aria-hidden="true"
        />
        {{ row.registry.username }}
      </span>
      <span
        v-else
        v-clean-tooltip="t(`${ ROOT }.anonymousTooltip`)"
      >{{ t(`${ ROOT }.anonymous`) }}</span>
      <div
        v-if="row.registry.basicHTTP || row.registry.tlsMode === 'skipVerify'"
        v-clean-tooltip="t(`${ ROOT }.tlsWarning`)"
        class="cell-description text-warning"
      >
        <i
          class="icon icon-warning"
          aria-hidden="true"
        />
        {{ row.registry.basicHTTP ? t('fleet.ociStorage.tls.basicHTTP') : t('fleet.ociStorage.tls.skipVerify') }}
      </div>
      <div
        v-else
        class="text-muted cell-description"
      >
        {{ t(`fleet.ociStorage.tls.${ row.registry.tlsMode }`) }}
      </div>
    </template>

    <template #cell:clusters="{ row }">
      <span v-clean-tooltip="t(`${ ROOT }.clusterTooltip`)">
        {{ row.clustersLabel }}
      </span>
    </template>

    <template #cell:artifacts="{ row }">
      <span
        v-if="row.artifactsLabel"
        class="no-wrap"
      >{{ row.artifactsLabel }}</span>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </template>

    <template #cell:activity="{ row }">
      <div
        v-if="row.registry.lastPushMinutesAgo !== null"
        class="no-wrap"
      >
        {{ t(`${ ROOT }.pushed`, { age: age(row.registry.lastPushMinutesAgo) }) }}
      </div>
      <div
        v-if="row.status.lastPullMinutesAgo !== null"
        class="no-wrap"
      >
        {{ t(`${ ROOT }.pulled`, { age: age(row.status.lastPullMinutesAgo) }) }}
      </div>
      <span
        v-if="row.registry.lastPushMinutesAgo === null && row.status.lastPullMinutesAgo === null"
        class="text-muted"
      >&mdash;</span>
    </template>
  </ResourceTable>
</template>

<style lang="scss" scoped>
.cell-description {
  font-size: 12px;
}

.reference {
  overflow-wrap: anywhere;
}

.no-wrap {
  white-space: nowrap;
}
</style>
