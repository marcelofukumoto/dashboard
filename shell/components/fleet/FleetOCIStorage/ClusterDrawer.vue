<script setup lang="ts">
import { computed } from 'vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import { BadgeState } from '@components/BadgeState';
import { RcButton } from '@components/RcButton';
import ClusterPullPanel from '@shell/components/fleet/FleetOCIStorage/ClusterPullPanel.vue';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ClusterStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const props = defineProps<{ clusterName: string, initial: ClusterStatus }>();

const emit = defineEmits(['close']);

const { t, clusterStateDisplay } = useFleetOCIStorageLabels();
const { statuses, forceUpdate } = useFleetOCIStorage();

const status = computed(() => statuses.value.find((s) => s.cluster.name === props.clusterName) || props.initial);
const badge = computed(() => clusterStateDisplay(status.value.state));
const title = computed(() => t('fleet.ociStorage.panel.title', { name: props.clusterName }));
</script>

<template>
  <Drawer
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      <span class="drawer-title">
        <BadgeState :value="badge" />
        {{ title }}
      </span>
    </template>
    <template #body>
      <ClusterPullPanel
        :status="status"
        @navigate="emit('close')"
      />
    </template>
    <template
      v-if="status.state === 'updatePending'"
      #additional-actions
    >
      <RcButton
        variant="primary"
        size="large"
        class="ml-10"
        data-testid="fleet-oci-drawer-force-update"
        @click="forceUpdate([clusterName])"
      >
        {{ t('fleet.ociStorage.actions.forceUpdate') }}
      </RcButton>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
.drawer-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
