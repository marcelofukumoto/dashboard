<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { FLEET } from '@shell/config/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { RcButton } from '@components/RcButton';
import PrototypeBanner from '@shell/components/fleet/FleetOCIStorage/PrototypeBanner.vue';
import SecretsTable from '@shell/components/fleet/FleetOCIStorage/SecretsTable.vue';
import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import { startOCIStorageGuide } from '@shell/components/fleet/FleetOCIStorage/guide';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

// Configuration only. How each bundle pulled lives with the workload: on its GitRepo, Bundle and cluster pages

const ROOT = 'fleet.ociStorage';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useFleetOCIStorageLabels();
const { workspace, data } = useFleetOCIStorage();

const createLocation = { name: 'c-cluster-fleet-oci-storage-secret-create', params: { cluster: BLANK_CLUSTER } };

const hasSecrets = computed(() => data.value.secrets.length > 0);

function showSampleData() {
  store.commit('updateWorkspace', { value: SCENARIO_WORKSPACE, getters: store.getters });
}

onMounted(() => {
  store.dispatch('management/findAll', { type: FLEET.CLUSTER });

  // ?guide (or ?guide=4 for a given step) opens the guided tour, so a link can be shared
  if (route.query.guide !== undefined) {
    startOCIStorageGuide(router, store, (Number(route.query.guide) || 1) - 1);
  }
});
</script>

<template>
  <div data-testid="fleet-oci-storage-page">
    <Masthead
      :resource="FLEET.OCI_STORAGE"
      :type-display="t(`${ ROOT }.title`)"
      :is-creatable="false"
      :show-favorite="false"
      component-testid="fleet-oci-storage"
    >
      <template #subHeader>
        <p class="text-deemphasized">
          {{ t(`${ ROOT }.subtitle`) }}
        </p>
      </template>
      <template #createButton>
        <RcButton
          v-if="hasSecrets"
          variant="primary"
          size="large"
          :to="createLocation"
          data-testid="fleet-oci-create-secret"
        >
          {{ t('generic.create') }}
        </RcButton>
      </template>
    </Masthead>

    <PrototypeBanner />

    <div
      v-if="!hasSecrets"
      class="empty-state"
      data-testid="fleet-oci-empty"
    >
      <i
        class="icon icon-storage"
        aria-hidden="true"
      />
      <h2>{{ t(`${ ROOT }.empty.title`) }}</h2>
      <p class="text-deemphasized">
        {{ t(`${ ROOT }.empty.description`) }}
      </p>
      <RcButton
        variant="primary"
        size="large"
        :to="createLocation"
        data-testid="fleet-oci-empty-create"
      >
        {{ t(`${ ROOT }.actions.createSecret`) }}
      </RcButton>
      <a
        v-if="workspace !== SCENARIO_WORKSPACE"
        href="#"
        data-testid="fleet-oci-show-sample"
        @click.prevent="showSampleData"
      >{{ t(`${ ROOT }.prototype.sample`, { workspace: SCENARIO_WORKSPACE }) }}</a>
    </div>

    <SecretsTable
      v-else
      class="mt-20"
    />
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 16px;
  text-align: center;

  .icon {
    font-size: 48px;
    color: var(--muted);
  }

  h2, p {
    margin: 0;
  }
}
</style>
