<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import SortableTable from '@shell/components/SortableTable';
import { STATE } from '@shell/config/table-headers';
import DeploymentDrawer from '@shell/components/fleet/FleetOCIStorage/DeploymentDrawer.vue';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { DeploymentState, DeploymentStatus } from '@shell/components/fleet/FleetOCIStorage/types';

type Column = 'bundle' | 'cluster' | 'pulledFrom';

const ROOT = 'fleet.ociStorage.deployments';

const STATE_SORT: Record<DeploymentState, number> = {
  failed: 0, retrying: 1, fallback: 2, ready: 3
};

const props = defineProps<{
  deployments: DeploymentStatus[];
  columns: Column[];
}>();

const store = useStore();
const {
  t, entryLabel, deploymentStateDisplay, deploymentMessage
} = useFleetOCIStorageLabels();

const COLUMNS: Record<Column, object> = {
  bundle: {
    name: 'bundle', labelKey: `${ ROOT }.headers.bundle`, value: 'bundleName', sort: ['bundleName', 'clusterName']
  },
  cluster: {
    name: 'cluster', labelKey: `${ ROOT }.headers.cluster`, value: 'clusterName', sort: ['clusterName', 'bundleName']
  },
  pulledFrom: {
    name: 'pulledFrom', labelKey: `${ ROOT }.headers.pulledFrom`, value: 'pulledFromLabel', sort: ['pulledFromLabel']
  },
};

const headers = computed(() => [STATE, ...props.columns.map((c) => COLUMNS[c])]);

function open(status: DeploymentStatus) {
  store.commit('slideInPanel/open', {
    component:      DeploymentDrawer,
    componentProps: {
      deploymentKey:      status.key,
      initial:            status,
      onClose:            () => store.commit('slideInPanel/close'),
      width:              'wide',
      height:             'full',
      closeOnRouteChange: ['name', 'params', 'query'],
      triggerFocusTrap:   true,
    },
  });
}

const rows = computed(() => props.deployments.map((status) => ({
  key:              status.key,
  status,
  bundleName:       status.bundle.name,
  clusterName:      status.cluster.name,
  pulledFromLabel:  status.pulledFrom ? entryLabel(status.pulledFrom) : '',
  reference:        status.pulledFrom ? reference(status.pulledFrom.endpoint) : '',
  nameSort:         status.key,
  stateSort:        STATE_SORT[status.state],
  ...deploymentStateDisplay(status.state),
  stateDescription: deploymentMessage(status),
  availableActions: [{
    action: 'view', label: t('fleet.ociStorage.actions.viewDetails'), icon: 'icon icon-info', enabled: true
  }],
  view() {
    open(status);
  },
})));
</script>

<template>
  <SortableTable
    :headers="headers"
    :rows="rows"
    :table-actions="false"
    :row-actions="false"
    :paging="false"
    :search="false"
    :sub-rows-description="true"
    default-sort-by="state"
    key-field="key"
    no-rows-key="fleet.ociStorage.deployments.none"
    data-testid="fleet-oci-pull-status"
  >
    <template #cell:bundle="{ row }">
      <a
        href="#"
        :data-testid="`fleet-oci-pull-${ row.key }`"
        @click.prevent="open(row.status)"
      >{{ row.bundleName }}</a>
    </template>

    <template #cell:cluster="{ row }">
      <a
        href="#"
        :data-testid="`fleet-oci-pull-cluster-${ row.key }`"
        @click.prevent="open(row.status)"
      >{{ row.clusterName }}</a>
    </template>

    <template #cell:pulledFrom="{ row }">
      <template v-if="row.pulledFromLabel">
        <span>{{ row.pulledFromLabel }}</span>
        <div class="text-muted cell-description">
          {{ row.reference }}
        </div>
      </template>
      <span
        v-else
        class="text-muted"
      >{{ t(`${ ROOT }.nothingPulled`) }}</span>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.cell-description {
  font-size: 12px;
  word-break: break-all;
}
</style>
