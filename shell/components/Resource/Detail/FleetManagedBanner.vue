<script setup lang="ts">
import { computed } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { Banner } from '@components/Banner';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { FLEET } from '@shell/config/types';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { BLANK_CLUSTER } from '@shell/store/store-types';

const SOURCE_TYPES: Record<string, string> = {
  gitrepo: FLEET.GIT_REPO,
  helmop:  FLEET.HELM_OP,
  bundle:  FLEET.BUNDLE,
};

const props = defineProps<{ resource?: { metadata?: { labels?: Record<string, string> } } }>();

const labels = computed(() => props.resource?.metadata?.labels || {});

const isFleetManaged = computed(() => !!labels.value[FLEET_LABELS.MANAGED_BY_KIND]);

const sourceLocation = computed<RouteLocationRaw | undefined>(() => {
  const kind = labels.value[FLEET_LABELS.MANAGED_BY_KIND];
  const namespace = labels.value[FLEET_LABELS.MANAGED_BY_NAMESPACE];
  const id = labels.value[FLEET_LABELS.MANAGED_BY_NAME];
  const resource = SOURCE_TYPES[kind];

  if (!resource || !namespace || !id) {
    return undefined;
  }

  if (kind === 'bundle') {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster: BLANK_CLUSTER, product: FLEET_NAME, resource, namespace, id
      }
    };
  }

  return {
    name:   'c-cluster-fleet-application-resource-namespace-id',
    params: {
      cluster: BLANK_CLUSTER, resource, namespace, id
    }
  };
});
</script>

<template>
  <Banner
    v-if="isFleetManaged"
    color="info"
    data-testid="fleet-managed-banner"
  >
    <t
      k="resourceDetail.masthead.fleetManaged"
      :raw="true"
    />
    <router-link
      v-if="sourceLocation"
      :to="sourceLocation"
      class="ml-5"
      data-testid="fleet-managed-banner-link"
    >
      {{ t('resourceDetail.masthead.fleetManagedLink') }}
    </router-link>
  </Banner>
</template>
