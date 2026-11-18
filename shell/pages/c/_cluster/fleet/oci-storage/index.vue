<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { FLEET } from '@shell/config/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import FleetStatus from '@shell/components/fleet/FleetStatus';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import PrototypeBanner from '@shell/components/fleet/FleetOCIStorage/PrototypeBanner.vue';
import SecretsTable from '@shell/components/fleet/FleetOCIStorage/SecretsTable.vue';
import DeploymentsTable from '@shell/components/fleet/FleetOCIStorage/DeploymentsTable.vue';
import DeploymentDrawer from '@shell/components/fleet/FleetOCIStorage/DeploymentDrawer.vue';
import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import { startOCIStorageGuide } from '@shell/components/fleet/FleetOCIStorage/guide';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { DeploymentStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useFleetOCIStorageLabels();
const {
  workspace, data, deployments, secretStatuses
} = useFleetOCIStorage();

const tabs = useTemplateRef<{ select:(name: string) => void }>('tabs');
const activeTab = ref('secrets');
const deploymentsTable = useTemplateRef<{ showFailing:() => void }>('deploymentsTable');

const createLocation = { name: 'c-cluster-fleet-oci-storage-secret-create', params: { cluster: BLANK_CLUSTER } };

const hasSecrets = computed(() => data.value.secrets.length > 0);
const failingCount = computed(() => deployments.value.filter((d) => d.state === 'failed').length);

const deploymentCounts = computed(() => {
  const entry = (state: string, color: string, status: string) => {
    const count = deployments.value.filter((d) => d.state === state).length;

    return {
      label: t(`${ ROOT }.deployments.state.${ state }`), color, status, count, value: count
    };
  };

  return [
    entry('ready', 'success', 'ready'),
    entry('fallback', 'warning', 'fallback'),
    entry('retrying', 'info', 'retrying'),
    entry('failed', 'error', 'failed'),
  ];
});

const secretCounts = computed(() => {
  const entry = (state: string, color: string, status: string) => {
    const count = secretStatuses.value.filter((s) => s.state === state).length;

    return {
      label: t(`${ ROOT }.secrets.state.${ state }`), color, status, count, value: count
    };
  };

  return [
    entry('active', 'success', 'ready'),
    entry('unused', 'darker', 'unused'),
    entry('error', 'error', 'error'),
  ];
});

function showSampleData() {
  store.commit('updateWorkspace', { value: SCENARIO_WORKSPACE, getters: store.getters });
}

function showFailing() {
  tabs.value?.select('deployments');
  deploymentsTable.value?.showFailing();
}

function openDeployment(status: DeploymentStatus) {
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
          v-if="hasSecrets && activeTab === 'secrets'"
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

    <template v-else>
      <div
        class="summary"
        data-testid="fleet-oci-summary"
      >
        <FleetStatus
          :title="t(`${ ROOT }.summary.secrets`)"
          :values="secretCounts"
          value-key="count"
        />
        <FleetStatus
          :title="t(`${ ROOT }.summary.deployments`)"
          :values="deploymentCounts"
          value-key="count"
        />
      </div>

      <Banner
        v-if="failingCount"
        color="error"
        data-testid="fleet-oci-failing-banner"
      >
        <div class="banner-with-action">
          <span>{{ t(`${ ROOT }.banners.failing`, { count: failingCount }) }}</span>
          <RcButton
            variant="link"
            size="small"
            data-testid="fleet-oci-show-failing"
            @click="showFailing"
          >
            {{ t(`${ ROOT }.actions.showFailing`) }}
          </RcButton>
        </div>
      </Banner>

      <Tabbed
        ref="tabs"
        class="mt-20"
        default-tab="secrets"
        :use-hash="true"
        @changed="({ selectedName }) => activeTab = selectedName"
      >
        <Tab
          name="secrets"
          :label="t(`${ ROOT }.tabs.secrets`)"
          :weight="2"
        >
          <SecretsTable />
        </Tab>
        <Tab
          name="deployments"
          :label="t(`${ ROOT }.tabs.deployments`)"
          :weight="1"
          :display-alert-icon="failingCount > 0"
        >
          <DeploymentsTable
            ref="deploymentsTable"
            @open-deployment="openDeployment"
          />
        </Tab>
      </Tabbed>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.banner-with-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  width: 100%;
}

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
