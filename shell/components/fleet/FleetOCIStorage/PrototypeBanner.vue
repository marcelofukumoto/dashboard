<script setup lang="ts">
import { Banner } from '@components/Banner';
import { resetMockData } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const DESIGN_NOTES_URL = 'https://fleet-oci-design.mf-created-dashboard.ui.rancher.space/';

const { t } = useFleetOCIStorageLabels();
</script>

<template>
  <Banner
    color="warning"
    data-testid="fleet-oci-prototype-banner"
  >
    <div class="prototype-banner">
      <span>{{ t('fleet.ociStorage.prototype.label') }}</span>
      <a
        :href="DESIGN_NOTES_URL"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('fleet.ociStorage.prototype.notes') }}</a>
      <a
        href="#"
        data-testid="fleet-oci-prototype-reset"
        @click.prevent="resetMockData"
      >{{ t('fleet.ociStorage.prototype.reset') }}</a>
    </div>
  </Banner>
</template>

<style lang="scss" scoped>
.prototype-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
}
</style>
