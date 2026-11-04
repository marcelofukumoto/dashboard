<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
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
import RegistriesTable from '@shell/components/fleet/FleetOCIStorage/RegistriesTable.vue';
import RoutesTable from '@shell/components/fleet/FleetOCIStorage/RoutesTable.vue';
import ClustersTable from '@shell/components/fleet/FleetOCIStorage/ClustersTable.vue';
import ArtifactsTable from '@shell/components/fleet/FleetOCIStorage/ArtifactsTable.vue';
import ClusterDrawer from '@shell/components/fleet/FleetOCIStorage/ClusterDrawer.vue';
import { SCENARIO_WORKSPACE } from '@shell/components/fleet/FleetOCIStorage/mock';
import { isFailing, needsAttention } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ClusterStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage';

const store = useStore();
const { t } = useFleetOCIStorageLabels();
const {
  workspace, data, statuses, artifactStatuses, forceUpdate
} = useFleetOCIStorage();

const tabs = useTemplateRef<{ select:(name: string) => void }>('tabs');
const activeTab = ref('registries');
const clustersTable = useTemplateRef<{ showAttention:() => void }>('clustersTable');

const addRegistryLocation = { name: 'c-cluster-fleet-oci-storage-registry-create', params: { cluster: BLANK_CLUSTER } };
const addRouteLocation = { name: 'c-cluster-fleet-oci-storage-route-create', params: { cluster: BLANK_CLUSTER } };

const hasRegistries = computed(() => data.value.registries.length > 0);
const failingCount = computed(() => statuses.value.filter((s) => isFailing(s.state)).length);
const updatePending = computed(() => statuses.value.filter((s) => s.state === 'updatePending').map((s) => s.cluster.name));
const showPendingBanner = computed(() => updatePending.value.length > 0 && ['routing', 'clusters'].includes(activeTab.value));
const attentionCount = computed(() => statuses.value.filter((s) => needsAttention(s.state)).length);

const clusterCounts = computed(() => {
  const entry = (state: string, color: string, status: string) => {
    const count = statuses.value.filter((s) => s.state === state).length;

    return {
      label: t(`${ ROOT }.clusters.state.${ state }`), color, status, count, value: count
    };
  };

  return [
    entry('pulled', 'success', 'ready'),
    entry('updatePending', 'info', 'updatePending'),
    entry('waiting', 'info', 'waiting'),
    entry('failover', 'warning', 'failover'),
    entry('authFailed', 'error', 'authFailed'),
    entry('tlsError', 'error', 'tlsError'),
    entry('unreachable', 'error', 'unreachable'),
    entry('noRoute', 'error', 'noRoute'),
  ];
});

const artifactCounts = computed(() => {
  const entry = (state: string, color: string, status: string) => {
    const count = artifactStatuses.value.filter((a) => a.state === state).length;

    return {
      label: t(`${ ROOT }.artifacts.state.${ state }`), color, status, count, value: count
    };
  };

  return [
    entry('available', 'success', 'ready'),
    entry('replicating', 'info', 'replicating'),
    entry('failed', 'error', 'failed'),
  ];
});

function showSampleData() {
  store.commit('updateWorkspace', { value: SCENARIO_WORKSPACE, getters: store.getters });
}

function showFailingClusters() {
  tabs.value?.select('clusters');
  clustersTable.value?.showAttention();
}

function openCluster(status: ClusterStatus) {
  store.commit('slideInPanel/open', {
    component:      ClusterDrawer,
    componentProps: {
      clusterName:        status.cluster.name,
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
          v-if="hasRegistries && activeTab === 'routing'"
          variant="primary"
          size="large"
          :to="addRouteLocation"
          data-testid="fleet-oci-add-route"
        >
          {{ t(`${ ROOT }.actions.addRoute`) }}
        </RcButton>
        <RcButton
          v-else-if="hasRegistries && activeTab === 'registries'"
          variant="primary"
          size="large"
          :to="addRegistryLocation"
          data-testid="fleet-oci-add-registry"
        >
          {{ t(`${ ROOT }.actions.addRegistry`) }}
        </RcButton>
      </template>
    </Masthead>

    <PrototypeBanner />

    <div
      v-if="!hasRegistries"
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
        :to="addRegistryLocation"
        data-testid="fleet-oci-empty-add"
      >
        {{ t(`${ ROOT }.actions.addRegistry`) }}
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
          :title="t(`${ ROOT }.summary.clusters`)"
          :values="clusterCounts"
          value-key="count"
        />
        <FleetStatus
          :title="t(`${ ROOT }.summary.artifacts`)"
          :values="artifactCounts"
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
            @click="showFailingClusters"
          >
            {{ t(`${ ROOT }.actions.showClusters`) }}
          </RcButton>
        </div>
      </Banner>

      <Banner
        v-if="showPendingBanner"
        color="info"
        data-testid="fleet-oci-pending-banner"
      >
        <div class="banner-with-action">
          <span>{{ t(`${ ROOT }.banners.updatePending`, { count: updatePending.length }) }}</span>
          <RcButton
            variant="link"
            size="small"
            data-testid="fleet-oci-force-update-all"
            @click="forceUpdate(updatePending)"
          >
            {{ t(`${ ROOT }.actions.forceUpdateAll`) }}
          </RcButton>
        </div>
      </Banner>

      <Tabbed
        ref="tabs"
        class="mt-20"
        default-tab="registries"
        :use-hash="true"
        @changed="({ selectedName }) => activeTab = selectedName"
      >
        <Tab
          name="registries"
          :label="t(`${ ROOT }.tabs.registries`)"
          :weight="4"
        >
          <RegistriesTable />
        </Tab>
        <Tab
          name="routing"
          :label="t(`${ ROOT }.tabs.routing`)"
          :weight="3"
        >
          <RoutesTable @open-cluster="openCluster" />
        </Tab>
        <Tab
          name="clusters"
          :label="t(`${ ROOT }.tabs.clusters`)"
          :weight="2"
          :display-alert-icon="attentionCount > 0"
        >
          <ClustersTable
            ref="clustersTable"
            @open-cluster="openCluster"
          />
        </Tab>
        <Tab
          name="artifacts"
          :label="t(`${ ROOT }.tabs.artifacts`)"
          :weight="1"
        >
          <ArtifactsTable />
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
