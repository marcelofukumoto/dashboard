<script setup lang="ts">
import { computed } from 'vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import { BadgeState } from '@components/BadgeState';
import DeploymentPanel from '@shell/components/fleet/FleetOCIStorage/DeploymentPanel.vue';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { DeploymentStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const props = defineProps<{ deploymentKey: string, initial: DeploymentStatus }>();

const emit = defineEmits(['close']);

const { t, deploymentStateDisplay } = useFleetOCIStorageLabels();
const { deployments } = useFleetOCIStorage();

const status = computed(() => deployments.value.find((d) => d.key === props.deploymentKey) || props.initial);
const badge = computed(() => deploymentStateDisplay(status.value.state));
const title = computed(() => t('fleet.ociStorage.panel.title', { bundle: status.value.bundle.name, cluster: status.value.cluster.name }));
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
      <DeploymentPanel
        :status="status"
        @navigate="emit('close')"
      />
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
