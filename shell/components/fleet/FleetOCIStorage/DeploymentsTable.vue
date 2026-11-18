<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import ResourceTable from '@shell/components/ResourceTable';
import { STATE } from '@shell/config/table-headers';
import { queryFor } from '@shell/utils/table-views/query';
import type { TableViewState } from '@shell/types/table-views';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { OCI_TABLE_SCHEMAS } from '@shell/components/fleet/FleetOCIStorage/tableConfig';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { DeploymentState, DeploymentStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.deployments';

const STATE_SORT: Record<DeploymentState, number> = {
  failed: 0, retrying: 1, fallback: 2, ready: 3
};

const emit = defineEmits<{(e: 'open-deployment', status: DeploymentStatus): void}>();

const {
  t, entryLabel, reason, deploymentStateDisplay, deploymentMessage
} = useFleetOCIStorageLabels();
const { deployments } = useFleetOCIStorage();

const table = useTemplateRef<{ view: TableViewState, openTabView:(view: TableViewState) => void }>('table');

const headers = [
  STATE,
  {
    name: 'name', labelKey: `${ ROOT }.headers.bundle`, value: 'name', sort: ['name', 'clusterName']
  },
  {
    name: 'cluster', labelKey: `${ ROOT }.headers.cluster`, value: 'clusterName', sort: ['clusterName', 'name']
  },
  {
    name: 'secret', labelKey: `${ ROOT }.headers.secret`, value: 'secretName', sort: ['secretName', 'name']
  },
  {
    name: 'pulledFrom', labelKey: `${ ROOT }.headers.pulledFrom`, value: 'pulledFromLabel', sort: ['pulledFromLabel', 'name']
  },
];

const rows = computed(() => deployments.value.map((status) => {
  const pulledFrom = status.pulledFrom;

  return {
    key:            status.key,
    name:           status.bundle.name,
    nameSort:       status.bundle.name,
    gitRepoName:    status.gitRepo.name,
    clusterName:    status.cluster.name,
    metadata:       { labels: status.cluster.labels },
    secretName:     status.secret.name,
    secretLocation: {
      name:   'c-cluster-fleet-oci-storage-secret-id',
      params: { cluster: BLANK_CLUSTER, id: status.secret.name },
    },
    status,
    state:            status.state,
    stateSort:        STATE_SORT[status.state],
    ...deploymentStateDisplay(status.state),
    stateDescription: deploymentMessage(status),
    pulledFromLabel:  pulledFrom ? entryLabel(pulledFrom) : '',
    reference:        pulledFrom ? reference(pulledFrom.endpoint) : '',
    orderLabel:       status.attempts.map((a) => entryLabel(a.entry)).join(' > '),
    failureLabel:     status.firstFailure ? `${ entryLabel(status.firstFailure.entry) }: ${ reason(status.firstFailure.result) }` : '',
    artifactId:       status.bundle.artifactId,
    attempt:          status.retry?.attempt ?? '',
    nextRetryLabel:   status.retry ? t(`${ ROOT }.nextRetry`, { minutes: status.retry.nextMinutes }) : '',
    availableActions: [
      {
        action: 'view', label: t('fleet.ociStorage.actions.viewDetails'), icon: 'icon icon-info', enabled: true
      },
    ],
    view() {
      emit('open-deployment', status);
    },
  };
}));

function showFailing() {
  const query = queryFor([t(`${ ROOT }.state.failed`)]);

  if (table.value) {
    table.value.openTabView({ ...table.value.view, query });
  }
}

defineExpose({ showFailing });
</script>

<template>
  <div>
    <p class="text-deemphasized mmb-4">
      {{ t(`${ ROOT }.intro`) }}
    </p>
    <ResourceTable
      ref="table"
      :schema="OCI_TABLE_SCHEMAS.deployment"
      :headers="headers"
      :rows="rows"
      :namespaced="false"
      :table-actions="false"
      key-field="key"
      default-sort-by="state"
      data-testid="fleet-oci-deployments-table"
    >
      <template #cell:name="{ row }">
        <a
          href="#"
          :data-testid="`fleet-oci-deployment-${ row.key }`"
          @click.prevent="emit('open-deployment', row.status)"
        >{{ row.name }}</a>
        <div class="text-muted cell-description">
          {{ t(`${ ROOT }.gitRepo`, { name: row.gitRepoName }) }}
        </div>
      </template>

      <template #cell:secret="{ row }">
        <router-link :to="row.secretLocation">
          {{ row.secretName }}
        </router-link>
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
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.cell-description {
  font-size: 12px;
  word-break: break-all;
}
</style>
