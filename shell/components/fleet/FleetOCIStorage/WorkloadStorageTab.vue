<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@components/Banner';
import PullStatusTable from '@shell/components/fleet/FleetOCIStorage/PullStatusTable.vue';
import { FALLBACK_SECRET } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { OCI_STORAGE_ROUTE, secretLocation } from '@shell/components/fleet/FleetOCIStorage/locations';
import { useSampleDeployments } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

const ROOT = 'fleet.ociStorage.workload';

// One of the two: a GitRepo's tab lists every bundle on every cluster, a Bundle's tab lists its clusters
const props = defineProps<{ gitRepo?: string, bundle?: string }>();

const { t } = useFleetOCIStorageLabels();
const { deployments, secretOf } = useSampleDeployments();

const rows = computed(() => deployments.value.filter((d) => (props.gitRepo ? d.gitRepo.name === props.gitRepo : d.bundle.name === props.bundle)));
const gitRepoName = computed(() => props.gitRepo || rows.value[0]?.gitRepo.name || '');
const secret = computed(() => secretOf(gitRepoName.value));
const explicit = computed(() => !!rows.value[0]?.gitRepo.secret);
const listLocation = { name: OCI_STORAGE_ROUTE, params: { cluster: BLANK_CLUSTER } };
</script>

<template>
  <div
    class="workload-storage"
    data-testid="fleet-oci-workload-tab"
  >
    <Banner
      color="warning"
      class="m-0"
      :label="t('fleet.ociStorage.prototype.mockPage')"
    />

    <p
      v-if="secret"
      class="secret-line"
      data-testid="fleet-oci-workload-secret"
    >
      {{ t(`${ ROOT }.${ explicit ? 'named' : 'fallback' }`, { name: FALLBACK_SECRET }) }}
      <router-link :to="secretLocation(secret.name)">
        {{ secret.name }}
      </router-link>.
      {{ t(`${ ROOT }.order`) }}
      <router-link :to="listLocation">
        {{ t(`${ ROOT }.open`) }}
      </router-link>
    </p>

    <PullStatusTable
      :deployments="rows"
      :columns="gitRepo ? ['bundle', 'cluster', 'pulledFrom'] : ['cluster', 'pulledFrom']"
    />
  </div>
</template>

<style lang="scss" scoped>
.workload-storage {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .secret-line {
    margin: 0;
  }
}
</style>
