<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import ClusterPullPanel from '@shell/components/fleet/FleetOCIStorage/ClusterPullPanel.vue';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const props = defineProps<{ cluster: { metadata: { name: string, labels?: Record<string, string> } } }>();

const { t } = useFleetOCIStorageLabels();
const { data, statusForRealCluster } = useFleetOCIStorage();

const addRegistryLocation = { name: 'c-cluster-fleet-oci-storage', params: { cluster: BLANK_CLUSTER } };
const status = computed(() => statusForRealCluster(props.cluster.metadata.name, props.cluster.metadata.labels));
</script>

<template>
  <div data-testid="fleet-oci-cluster-tab">
    <Banner
      color="warning"
      :label="t('fleet.ociStorage.prototype.label')"
    />
    <ClusterPullPanel
      v-if="data.registries.length"
      :status="status"
    />
    <div
      v-else
      class="no-registry"
    >
      <p class="text-deemphasized">
        {{ t('fleet.ociStorage.empty.title') }}
      </p>
      <RcButton
        variant="secondary"
        size="small"
        :to="addRegistryLocation"
      >
        {{ t('fleet.ociStorage.workspace.open') }}
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.no-registry {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
</style>
