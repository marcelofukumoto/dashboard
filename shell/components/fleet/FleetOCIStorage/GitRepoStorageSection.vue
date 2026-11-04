<script setup lang="ts">
import { computed, ref } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const ROOT = 'fleet.ociStorage.gitRepo';

const props = defineProps<{
  secret?: string;
  workspace: string;
  mode: string;
}>();

const emit = defineEmits<{(e: 'update:value', value: string | undefined): void}>();

const { t } = useFleetOCIStorageLabels();
const { data, sourceRegistry } = useFleetOCIStorage();

const hasMockRegistries = computed(() => data.value.registries.length > 0);
const storageMode = ref(props.secret ? 'pinned' : 'routing');
const pinnedRegistry = ref<string>();

const modeOptions = computed(() => [
  { label: t(`${ ROOT }.routing`), value: 'routing' },
  { label: t(`${ ROOT }.pinned`), value: 'pinned' },
]);

const registryOptions = computed(() => data.value.registries.map((r) => ({ label: `${ r.name } (${ reference(r) })`, value: r.name })));

const routes = computed(() => [
  ...data.value.routes.map((r) => ({
    key: r.name, name: r.name, registries: r.registries
  })),
  {
    key:        'default',
    name:       t('fleet.ociStorage.routing.defaultRoute'),
    registries: data.value.defaultRegistries,
  },
]);

const routingLocation = {
  name:   'c-cluster-fleet-oci-storage',
  params: { cluster: BLANK_CLUSTER },
  hash:   '#routing',
};

// The mock registries don't exist as secrets on the server, so writing one to the spec would break the GitRepo
function selectMode(value: string) {
  storageMode.value = value;
  emit('update:value', undefined);
}
</script>

<template>
  <div
    v-if="hasMockRegistries"
    class="gitrepo-storage"
    data-testid="fleet-oci-gitrepo-storage"
  >
    <RadioGroup
      :value="storageMode"
      name="oci-storage-mode"
      :options="modeOptions"
      :mode="mode"
      data-testid="fleet-oci-gitrepo-mode"
      @update:value="selectMode"
    />

    <template v-if="storageMode === 'routing'">
      <p class="text-deemphasized">
        {{ t(`${ ROOT }.routingDescription`, { source: sourceRegistry?.name || '' }) }}
        <router-link :to="routingLocation">
          {{ t(`${ ROOT }.viewRouting`) }}
        </router-link>
      </p>
      <dl
        class="routes"
        data-testid="fleet-oci-gitrepo-routes"
      >
        <template
          v-for="route in routes"
          :key="route.key"
        >
          <dt>{{ route.name }}</dt>
          <dd><RegistryChain :registries="route.registries" /></dd>
        </template>
      </dl>
    </template>

    <template v-else>
      <p class="text-deemphasized">
        {{ t(`${ ROOT }.pinnedDescription`) }}
      </p>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="pinnedRegistry"
            :label="t(`${ ROOT }.registry`)"
            :placeholder="t(`${ ROOT }.registryPlaceholder`)"
            :options="registryOptions"
            :mode="mode"
            data-testid="fleet-oci-gitrepo-pinned"
          />
        </div>
      </div>
      <p class="text-muted mock-note">
        {{ t(`${ ROOT }.mockNote`) }}
      </p>
    </template>
  </div>

  <div
    v-else
    class="row mt-20"
  >
    <div class="col span-6">
      <FleetOCIStorageSecret
        :secret="secret"
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

.routes {
  display: grid;
  grid-template-columns: minmax(160px, max-content) 1fr;
  gap: 8px 24px;
  margin: 0;
  max-width: 800px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);

  dt {
    font-weight: normal;
    color: var(--muted);
  }

  dd {
    margin: 0;
  }
}

.mock-note {
  font-size: 12px;
}
</style>
