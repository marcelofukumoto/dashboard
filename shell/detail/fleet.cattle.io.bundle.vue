<script>
import { FLEET } from '@shell/config/types';
import FleetResources from '@shell/components/fleet/FleetResources';
import FleetUtils from '@shell/utils/fleet';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import Loading from '@shell/components/Loading.vue';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import WorkloadStorageTab from '@shell/components/fleet/FleetOCIStorage/WorkloadStorageTab.vue';
import { ociStorageFor } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';

export default {
  name: 'FleetBundleDetail',

  components: {
    Loading, FleetResources, ResourceTabs, Tab, WorkloadStorageTab
  },
  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return { allBundleDeployments: [] };
  },

  async fetch() {
    const allDispatches = await checkSchemasForFindAllHash({
      allBundleDeployments: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE_DEPLOYMENT,
      },

      // must be loaded for bundle.targetClusters to work
      allFleetClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      },
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      }
    }, this.$store);

    this.allBundleDeployments = allDispatches.allBundleDeployments || [];
  },

  computed: {
    // Prototype: where each target cluster pulled this bundle from
    ociStorage() {
      return ociStorageFor({ namespace: this.value.metadata?.namespace, bundle: this.value.metadata?.name });
    },

    bundleResources() {
      if (!this.allBundleDeployments) {
        return [];
      }

      const bundleDeploymentsByClusterId = this.allBundleDeployments
        .reduce((res, bd) => {
          if (this.value.id === FleetUtils.bundleIdFromBundleDeploymentLabels(bd.metadata?.labels)) {
            res[FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels)] = bd;
          }

          return res;
        }, {});

      return this.value.targetClusters.reduce((res, cluster) => {
        const bd = bundleDeploymentsByClusterId[cluster.id];

        if (bd) {
          FleetUtils.resourcesFromBundleDeploymentStatus(bd.status)
            .forEach((r) => {
              const type = FleetUtils.resourceType(r);
              const key = `${ cluster.id }-${ type }-${ r.namespace }-${ r.name }`;

              res.push({
                ...r,
                key,
                type,
                id:          FleetUtils.resourceId(r),
                clusterId:   cluster.id,
                clusterName: cluster.nameDisplay,

                detailLocation: FleetUtils.detailLocation(r, cluster.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME]),
              });
            });
        }

        return res;
      }, []);
    },
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs
    v-else
    :value="value"
    mode="view"
    :need-related="false"
  >
    <Tab
      v-if="ociStorage.used"
      :label="t('fleet.ociStorage.workload.tab')"
      name="oci-storage"
      :weight="25"
      :display-alert-icon="ociStorage.failing > 0"
    >
      <WorkloadStorageTab :bundle="value.metadata.name" />
    </Tab>
    <Tab
      label="Resources"
      name="resources"
      :weight="20"
    >
      <FleetResources :rows="bundleResources" />
    </Tab>
  </ResourceTabs>
</template>
