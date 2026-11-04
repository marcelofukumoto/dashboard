<script setup lang="ts">
import { computed } from 'vue';
import SortableTable from '@shell/components/SortableTable';
import { RcButton } from '@components/RcButton';
import { RcStatusBadge } from '@components/Pill';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { STATE } from '@shell/config/table-headers';
import { ARTIFACT_STATE_COLORS } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ArtifactAvailability, ArtifactRegistryStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.artifacts';
const PANEL = 'fleet.ociStorage.panel';

const AVAILABILITY_STATUS: Record<ArtifactAvailability, 'success' | 'info' | 'none'> = {
  pushed:    'success',
  available: 'success',
  pending:   'info',
  unknown:   'none',
};

const { t, age, size } = useFleetOCIStorageLabels();
const { artifactStatuses } = useFleetOCIStorage();

const headers = [
  STATE,
  {
    name: 'bundle', labelKey: `${ ROOT }.headers.bundle`, value: 'bundle', sort: ['bundle'], width: 240
  },
  {
    name: 'artifact', labelKey: `${ ROOT }.headers.artifact`, width: 170
  },
  {
    name: 'size', labelKey: `${ ROOT }.headers.size`, value: 'sizeBytes', sort: ['sizeBytes'], align: 'right', width: 90
  },
  {
    name: 'pushed', labelKey: `${ ROOT }.headers.pushed`, value: 'pushed', sort: ['pushed'], width: 110
  },
  { name: 'registries', labelKey: `${ ROOT }.headers.registries` },
  {
    name: 'clusters', labelKey: `${ ROOT }.headers.clusters`, value: 'pulledCount', sort: ['pulledCount'], align: 'right', width: 90
  },
];

const pullHeaders = [
  {
    name: 'cluster', labelKey: 'fleet.ociStorage.routeForm.headers.cluster', value: 'cluster', sort: ['cluster']
  },
  { name: 'pullState', labelKey: 'tableHeaders.state' },
  {
    name: 'registry', labelKey: `${ PANEL }.headers.registry`, value: 'registry', sort: ['registry', 'cluster']
  },
  { name: 'when', labelKey: `${ PANEL }.headers.pulled` },
  { name: 'duration', labelKey: `${ PANEL }.headers.duration` },
];

function availabilityStatus(availability: ArtifactAvailability) {
  return AVAILABILITY_STATUS[availability];
}

function availabilityTooltip(registry: ArtifactRegistryStatus): string {
  return t(`${ ROOT }.availability.${ registry.availability }`, {
    pulled: registry.pulled, total: registry.total, minutes: registry.pendingMinutes
  });
}

const rows = computed(() => artifactStatuses.value.map((status) => ({
  key:             status.artifact.bundle,
  bundle:          status.artifact.bundle,
  status,
  source:          `${ status.artifact.sourceKind } ${ status.artifact.source }`,
  sizeBytes:       status.artifact.sizeBytes,
  pushed:          status.artifact.pushedMinutesAgo,
  pulledCount:     status.pulledCount,
  total:           status.pulls.length,
  shortId:         `${ status.artifact.id.slice(0, 12) }...`,
  stateDisplay:    t(`${ ROOT }.state.${ status.state }`),
  stateBackground: ARTIFACT_STATE_COLORS[status.state],
  stateObj:        { error: status.state === 'failed' },
  pullRows:        status.pulls.map((pull) => ({
    key:      `${ status.artifact.bundle }/${ pull.cluster }`,
    cluster:  pull.cluster,
    registry: pull.registry || '',
    state:    pull.state,
    when:     pull.minutesAgo,
    duration: pull.durationMs,
  })),
})));

function pullBadge(state: string): 'success' | 'info' | 'error' {
  if (state === 'pulled') {
    return 'success';
  }

  return state === 'failed' ? 'error' : 'info';
}
</script>

<template>
  <div>
    <p class="text-deemphasized mmb-4">
      {{ t(`${ ROOT }.intro`) }}
    </p>
    <SortableTable
      :headers="headers"
      :rows="rows"
      :table-actions="false"
      :row-actions="false"
      :paging="false"
      :sub-rows="true"
      :sub-expandable="true"
      :sub-expand-column="true"
      key-field="key"
      default-sort-by="pushed"
      data-testid="fleet-oci-artifacts-table"
    >
      <template #cell:bundle="{ row }">
        {{ row.bundle }}
        <div class="text-muted cell-description">
          {{ row.source }}
          <template v-if="row.status.artifact.pinnedRegistry">
            &middot; {{ t(`${ ROOT }.pinned`, { registry: row.status.artifact.pinnedRegistry }) }}
          </template>
        </div>
      </template>

      <template #cell:artifact="{ row }">
        <span class="artifact-id">
          <span v-clean-tooltip="row.status.artifact.id">{{ row.shortId }}</span>
          <RcButton
            variant="ghost"
            size="small"
            :aria-label="t('generic.copyToClipboard')"
            @click.stop="copyTextToClipboard(row.status.artifact.id)"
          >
            <i
              class="icon icon-copy"
              aria-hidden="true"
            />
          </RcButton>
        </span>
      </template>

      <template #cell:size="{ row }">
        {{ size(row.sizeBytes) }}
      </template>

      <template #cell:pushed="{ row }">
        {{ age(row.pushed) }}
      </template>

      <template #cell:registries="{ row }">
        <span class="registries">
          <RcStatusBadge
            v-for="registry in row.status.registries"
            :key="registry.registry"
            v-clean-tooltip="availabilityTooltip(registry)"
            :status="availabilityStatus(registry.availability)"
          >
            <span class="chip-text">{{ registry.registry }}</span>
            <span
              v-if="registry.availability === 'pending'"
              class="chip-text pending-minutes"
            >{{ t(`${ ROOT }.pendingShort`, { minutes: registry.pendingMinutes }) }}</span>
          </RcStatusBadge>
        </span>
      </template>

      <template #cell:clusters="{ row }">
        {{ row.pulledCount }}/{{ row.total }}
      </template>

      <template #sub-row="{ row, fullColspan, onRowMouseEnter, onRowMouseLeave }">
        <tr
          class="sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :headers="pullHeaders"
              :rows="row.pullRows"
              :search="false"
              :row-actions="false"
              :table-actions="false"
              :paging="false"
              key-field="key"
            >
              <template #cell:pullState="{ row: pull }">
                <RcStatusBadge :status="pullBadge(pull.state)">
                  {{ t(`${ PANEL }.pull.${ pull.state }`) }}
                </RcStatusBadge>
              </template>
              <template #cell:when="{ row: pull }">
                {{ pull.when === null ? '&mdash;' : age(pull.when) }}
              </template>
              <template #cell:duration="{ row: pull }">
                {{ pull.duration === null ? '&mdash;' : `${ pull.duration } ms` }}
              </template>
            </SortableTable>
          </td>
        </tr>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.cell-description {
  font-size: 12px;
}

.registries {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px 6px;
}

.chip-text {
  white-space: nowrap;
}

.pending-minutes {
  margin-left: 4px;
}

.artifact-id {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
