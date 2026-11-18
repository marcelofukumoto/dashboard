<script setup lang="ts">
import { computed } from 'vue';
import SortableTable from '@shell/components/SortableTable';
import { Banner } from '@components/Banner';
import { BadgeState } from '@components/BadgeState';
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const ROOT = 'fleet.ociStorage.clusterTab';

const props = defineProps<{ cluster: { metadata: { name: string, labels?: Record<string, string> } } }>();

const {
  t, entryLabel, deploymentStateDisplay, deploymentMessage
} = useFleetOCIStorageLabels();
const { data, deployments, ordersForCluster } = useFleetOCIStorage();

const listLocation = { name: 'c-cluster-fleet-oci-storage', params: { cluster: BLANK_CLUSTER } };

const orders = computed(() => ordersForCluster(props.cluster.metadata.name, props.cluster.metadata.labels).map((order) => ({
  ...order,
  labels: order.entries.map(entryLabel),
})));

const headers = [
  {
    name: 'bundle', labelKey: 'fleet.ociStorage.deployments.headers.bundle', value: 'bundle', sort: ['bundle']
  },
  {
    name: 'state', labelKey: 'tableHeaders.state', width: 130
  },
  { name: 'message', labelKey: `${ ROOT }.headers.message` },
];

const rows = computed(() => deployments.value
  .filter((d) => d.cluster.name === props.cluster.metadata.name)
  .map((d) => ({
    key:     d.key,
    bundle:  d.bundle.name,
    badge:   deploymentStateDisplay(d.state),
    message: deploymentMessage(d) || t(`${ ROOT }.pulledFrom`, { entry: d.pulledFrom ? entryLabel(d.pulledFrom) : '' }),
  })));
</script>

<template>
  <div
    class="cluster-storage"
    data-testid="fleet-oci-cluster-tab"
  >
    <Banner
      color="warning"
      class="m-0"
      :label="t('fleet.ociStorage.prototype.label')"
    />

    <div
      v-if="!data.secrets.length"
      class="empty"
    >
      <p class="text-deemphasized">
        {{ t('fleet.ociStorage.empty.title') }}
      </p>
      <RcButton
        variant="secondary"
        size="small"
        :to="listLocation"
      >
        {{ t('fleet.ociStorage.workspace.open') }}
      </RcButton>
    </div>

    <template v-else>
      <section>
        <h3>{{ t(`${ ROOT }.ordersTitle`) }}</h3>
        <p class="text-deemphasized">
          {{ t(`${ ROOT }.ordersIntro`) }}
        </p>
        <dl
          class="orders"
          data-testid="fleet-oci-cluster-orders"
        >
          <template
            v-for="order in orders"
            :key="order.secret.name"
          >
            <dt>
              {{ order.secret.name }}
              <RcTag
                v-if="order.isDefault"
                type="active"
              >
                {{ t('fleet.ociStorage.secrets.default') }}
              </RcTag>
            </dt>
            <dd><RegistryChain :registries="order.labels" /></dd>
          </template>
        </dl>
      </section>

      <section>
        <h3>{{ t(`${ ROOT }.deploymentsTitle`) }}</h3>
        <SortableTable
          :headers="headers"
          :rows="rows"
          :search="false"
          :row-actions="false"
          :table-actions="false"
          :paging="false"
          :no-rows-key="`${ ROOT }.noDeployments`"
          key-field="key"
        >
          <template #cell:state="{ row }">
            <BadgeState :value="row.badge" />
          </template>
        </SortableTable>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.cluster-storage {
  display: flex;
  flex-direction: column;
  gap: 24px;

  h3 {
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 12px;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.orders {
  display: grid;
  grid-template-columns: minmax(160px, max-content) 1fr;
  gap: 8px 24px;
  margin: 0;
  max-width: 900px;

  dt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: normal;
    color: var(--muted);
  }

  dd {
    margin: 0;
  }
}
</style>
