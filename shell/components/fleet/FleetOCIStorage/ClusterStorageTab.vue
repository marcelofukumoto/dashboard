<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@components/Banner';
import { RcTag } from '@components/Pill';
import PullStatusTable from '@shell/components/fleet/FleetOCIStorage/PullStatusTable.vue';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import { FALLBACK_SECRET, pullOrder } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { secretLocation } from '@shell/components/fleet/FleetOCIStorage/locations';
import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import { sampleWorkspaceData, useSampleDeployments } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { OCICluster } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.clusterTab';

const props = defineProps<{ cluster: { metadata: { name: string, namespace?: string, labels?: Record<string, string> }, nameDisplay?: string } }>();

const { t, entryLabel } = useFleetOCIStorageLabels();
const { deployments } = useSampleDeployments();

const inScenario = computed(() => props.cluster.metadata.namespace === SCENARIO_WORKSPACE);
const data = computed(() => sampleWorkspaceData());

// The scenario's view of this cluster; another workspace's cluster is matched on its own labels only
const scenarioCluster = computed<OCICluster>(() => data.value.clusters.find((c) => (c.fleetName || c.name) === props.cluster.metadata.name) || {
  name:               props.cluster.nameDisplay || props.cluster.metadata.name,
  labels:             props.cluster.metadata.labels || {},
  groups:             [],
  reach:              {},
  defaultReach:       'ok',
  lastPullMinutesAgo: null,
});

const orders = computed(() => (inScenario.value ? data.value.secrets : []).map((secret) => ({
  secret,
  isDefault: secret.name === FALLBACK_SECRET,
  labels:    pullOrder(secret, scenarioCluster.value).map(entryLabel),
})));

const rows = computed(() => deployments.value.filter((d) => d.cluster.name === scenarioCluster.value.name));
</script>

<template>
  <div
    class="cluster-storage"
    data-testid="fleet-oci-cluster-tab"
  >
    <Banner
      color="warning"
      class="m-0"
      :label="t('fleet.ociStorage.prototype.mockPage')"
    />

    <p
      v-if="!orders.length"
      class="text-deemphasized"
    >
      {{ t('fleet.ociStorage.empty.title') }}
    </p>

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
              <router-link :to="secretLocation(order.secret.name)">
                {{ order.secret.name }}
              </router-link>
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
        <PullStatusTable
          :deployments="rows"
          :columns="['bundle', 'pulledFrom']"
        />
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
  }

  dd {
    margin: 0;
  }
}
</style>
