<script setup lang="ts">
import { computed, ref } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { FALLBACK_SECRET } from '@shell/components/fleet/FleetOCIStorage/resolve';
import CredentialSetList from '@shell/components/fleet/FleetOCIStorage/CredentialSetList.vue';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const ROOT = 'fleet.ociStorage.gitRepo';
const DEFAULT = '';

const props = defineProps<{
  secret?: string;
  workspace: string;
  mode: string;
}>();

const emit = defineEmits<{(e: 'update:value', value: string | undefined): void}>();

const { t } = useFleetOCIStorageLabels();
const { data } = useFleetOCIStorage();

const hasMockSecrets = computed(() => data.value.secrets.length > 0);
const selected = ref<string>(DEFAULT);

const hasFallback = computed(() => data.value.secrets.some((s) => s.name === FALLBACK_SECRET));

const options = computed(() => [
  {
    label: hasFallback.value ? t(`${ ROOT }.useFallback`, { name: FALLBACK_SECRET }) : t(`${ ROOT }.noFallback`, { name: FALLBACK_SECRET }),
    value: DEFAULT,
  },
  ...data.value.secrets
    .filter((s) => s.name !== FALLBACK_SECRET)
    .map((s) => ({ label: s.name, value: s.name })),
]);

const effective = computed(() => {
  const name = selected.value || FALLBACK_SECRET;

  return data.value.secrets.find((s) => s.name === name) || null;
});

const editLocation = computed(() => ({
  name:   'c-cluster-fleet-oci-storage-secret-id',
  params: { cluster: BLANK_CLUSTER, id: effective.value?.name || '' },
}));

// The mock secrets don't exist on the server, so writing one to the spec would break the GitRepo
function select(value: string) {
  selected.value = value;
  emit('update:value', undefined);
}
</script>

<template>
  <div
    v-if="hasMockSecrets"
    class="gitrepo-storage"
    data-testid="fleet-oci-gitrepo-storage"
  >
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          :value="selected"
          :label="t(`${ ROOT }.secret`)"
          :options="options"
          :mode="mode"
          data-testid="fleet-oci-gitrepo-secret"
          @update:value="select"
        />
      </div>
    </div>

    <template v-if="effective">
      <p class="text-deemphasized">
        {{ t(`${ ROOT }.orderIntro`, { name: effective.name }) }}
        <router-link :to="editLocation">
          {{ t(`${ ROOT }.edit`) }}
        </router-link>
      </p>
      <CredentialSetList :secret="effective" />
    </template>
    <p
      v-else
      class="text-deemphasized"
    >
      {{ t(`${ ROOT }.etcd`) }}
    </p>

    <p class="text-muted mock-note">
      {{ t(`${ ROOT }.mockNote`) }}
    </p>
  </div>

  <div
    v-else
    class="row mt-20"
  >
    <div class="col span-6">
      <FleetOCIStorageSecret
        :secret="props.secret"
        :workspace="workspace"
        :mode="mode"
        @update:value="emit('update:value', $event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gitrepo-storage {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;

  p {
    margin: 0;
  }
}

.mock-note {
  font-size: 12px;
}
</style>
