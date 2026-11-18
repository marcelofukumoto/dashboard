<script setup lang="ts">
import { computed } from 'vue';
import SortableTable from '@shell/components/SortableTable';
import { RcTag } from '@components/Pill';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { OCIStorageSecret } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.sets';

const props = defineProps<{ secret: OCIStorageSecret }>();

const { t, matchChips, tlsLabel } = useFleetOCIStorageLabels();

const headers = [
  {
    name: 'order', labelKey: `${ ROOT }.headers.order`, width: 70
  },
  { name: 'name', labelKey: 'tableHeaders.name' },
  { name: 'matches', labelKey: `${ ROOT }.headers.matches` },
  { name: 'registry', labelKey: `${ ROOT }.headers.registry` },
  { name: 'credentials', labelKey: `${ ROOT }.headers.credentials` },
];

// Order is the meaning here, so the table never sorts: sets in the secret's order, then the push registry
const rows = computed(() => [
  ...props.secret.credentialSets.map((set, index) => ({
    key:       set.name,
    order:     index + 1,
    name:      set.name,
    isPush:    false,
    chips:     matchChips(set),
    reference: reference(set),
    user:      set.agentUsername,
    tls:       tlsLabel(set),
  })),
  {
    key:       '__push__',
    order:     props.secret.credentialSets.length + 1,
    name:      t('fleet.ociStorage.pushEntry'),
    isPush:    true,
    chips:     [],
    reference: reference(props.secret.push),
    user:      props.secret.push.agentUsername || props.secret.push.username,
    tls:       tlsLabel(props.secret.push),
  },
]);
</script>

<template>
  <SortableTable
    class="credential-set-list"
    :headers="headers"
    :rows="rows"
    :search="false"
    :row-actions="false"
    :table-actions="false"
    :paging="false"
    key-field="key"
    data-testid="fleet-oci-set-list"
  >
    <template #cell:order="{ row }">
      <span class="order">{{ row.order }}</span>
    </template>
    <template #cell:name="{ row }">
      <span :class="{ 'text-muted': row.isPush }">{{ row.name }}</span>
    </template>
    <template #cell:matches="{ row }">
      <span
        v-if="row.isPush"
        class="text-muted"
      >{{ t(`${ ROOT }.everyCluster`) }}</span>
      <span
        v-else
        class="chips"
        :data-testid="`fleet-oci-set-matches-${ row.key }`"
      >
        <RcTag
          v-for="chip in row.chips"
          :key="chip"
          type="inactive"
        >{{ chip }}</RcTag>
      </span>
    </template>
    <template #cell:registry="{ row }">
      <span class="reference">{{ row.reference }}</span>
      <div class="text-muted cell-description">
        {{ row.tls }}
      </div>
    </template>
    <template #cell:credentials="{ row }">
      <span v-if="row.user">{{ row.user }}</span>
      <span
        v-else
        class="text-muted"
      >{{ t('fleet.ociStorage.anonymous') }}</span>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.order {
  font-weight: 600;
}

.chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.reference {
  overflow-wrap: anywhere;
}

.cell-description {
  font-size: 12px;
}
</style>
