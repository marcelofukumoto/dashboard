<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsyaml from 'js-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { Selector } from '@shell/types/fleet';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';
import SortableTable from '@shell/components/SortableTable';
import TabTitle from '@shell/components/TabTitle';
import ClusterSelectionFields from '@shell/components/fleet/FleetClusterTargets/ClusterSelectionFields.vue';
import TargetsList from '@shell/components/fleet/FleetClusterTargets/TargetsList.vue';
import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import { RcContentGroup } from '@components/Layout';
import { RcSection } from '@components/RcSection';
import PrototypeBanner from '@shell/components/fleet/FleetOCIStorage/PrototypeBanner.vue';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import {
  DEFAULT_REPLICATION_WAIT_MINUTES,
  DEFAULT_ROUTE,
  reference,
  resolveCluster,
  routeMatches,
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { OCIRoute, OCIStorageData } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.routeForm';
const NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const route = useRoute();
const router = useRouter();
const { t, clusterStateDisplay } = useFleetOCIStorageLabels();
const {
  workspace, data, saveRoute, saveDefaultRegistries, forceUpdate
} = useFleetOCIStorage();

const originalName = route.params.id as string | undefined;
const isDefault = originalName === DEFAULT_ROUTE;
const original = data.value.routes.find((r) => r.name === originalName);
const mode = originalName ? _EDIT : _CREATE;

const draft = reactive<OCIRoute>(original ? JSON.parse(JSON.stringify(original)) : {
  name:                   '',
  description:            '',
  clusterNames:           [],
  clusterGroups:          [],
  selectors:              [],
  registries:             isDefault && data.value.defaultRegistries.length ? [...data.value.defaultRegistries] : [''],
  replicationWaitMinutes: DEFAULT_REPLICATION_WAIT_MINUTES,
});

const errors = ref<string[]>([]);
const applyNow = ref(false);
const nextSelectorKey = ref(100);
const resource = { type: 'secret' };

const listLocation = {
  name:   'c-cluster-fleet-oci-storage',
  params: { cluster: BLANK_CLUSTER },
  hash:   '#routing',
};
const addRegistryLocation = { name: 'c-cluster-fleet-oci-storage-registry-create', params: { cluster: BLANK_CLUSTER } };

const title = computed(() => {
  if (isDefault) {
    return t(`${ ROOT }.editDefault`);
  }

  return originalName ? t(`${ ROOT }.editTitle`, { name: originalName }) : t(`${ ROOT }.addTitle`);
});

const clustersOptions = computed(() => data.value.clusters.map((c) => ({ label: c.name, value: c.name })));
const clusterGroupsOptions = computed(() => {
  const groups = new Set(data.value.clusters.flatMap((c) => c.groups));

  return [...groups].map((group) => ({ label: group, value: group }));
});

const selectedRegistries = computed(() => draft.registries.filter(Boolean));

function registryOptions(current: string) {
  return data.value.registries
    .filter((r) => r.name === current || !draft.registries.includes(r.name))
    .map((r) => ({ label: `${ r.name } (${ reference(r) })`, value: r.name }));
}

const noMoreRegistries = computed(() => draft.registries.length >= data.value.registries.length);
const canAddFailover = computed(() => draft.registries.every(Boolean) && !noMoreRegistries.value);

function hypotheticalData(): OCIStorageData {
  const clean: OCIRoute = { ...draft, registries: selectedRegistries.value };

  if (isDefault) {
    return { ...data.value, defaultRegistries: clean.registries };
  }

  const routes = original ? data.value.routes.map((r) => (r.name === originalName ? clean : r)) : [...data.value.routes, clean];

  return { ...data.value, routes };
}

const matching = computed(() => {
  const clean: OCIRoute = { ...draft, registries: selectedRegistries.value };

  if (isDefault) {
    return data.value.clusters.filter((c) => !data.value.routes.some((r) => routeMatches(r, c)));
  }

  return data.value.clusters.filter((c) => routeMatches(clean, c));
});

const targets = computed(() => matching.value.map((c) => ({
  name:           c.name,
  nameDisplay:    c.name,
  detailLocation: {},
})));

const previewRows = computed(() => {
  const next = hypotheticalData();

  return matching.value.map((cluster) => {
    const before = resolveCluster(data.value, cluster);
    const after = resolveCluster(next, { ...cluster, appliedPrimary: null });
    const owner = after.route && after.route.name !== (draft.name || null) && !isDefault ? after.route.name : null;

    return {
      key:     cluster.name,
      name:    cluster.name,
      before:  before.chain,
      after:   after.chain,
      owner:   after.route?.name === draft.name ? null : owner,
      changed: before.chain.join() !== after.chain.join(),
      badge:   clusterStateDisplay(after.state),
    };
  });
});

const previewHeaders = [
  {
    name: 'name', labelKey: `${ ROOT }.headers.cluster`, value: 'name', sort: ['name']
  },
  { name: 'before', labelKey: `${ ROOT }.headers.now` },
  { name: 'after', labelKey: `${ ROOT }.headers.after` },
  {
    name: 'expected', labelKey: `${ ROOT }.headers.state`, width: 130
  },
];

const shadowedCount = computed(() => previewRows.value.filter((r) => r.owner).length);
const affected = computed(() => previewRows.value.filter((r) => r.changed).map((r) => r.key));

const nameRules = [
  (value: string) => (value && !NAME_REGEX.test(value) ? t(`${ ROOT }.nameError`) : undefined),
  (value: string) => ((value !== originalName && (value === DEFAULT_ROUTE || data.value.routes.some((r) => r.name === value))) ? t(`${ ROOT }.nameTaken`) : undefined),
];

const isValid = computed(() => {
  if (isDefault) {
    return true;
  }

  return !!draft.name && nameRules.every((rule) => !rule(draft.name)) && selectedRegistries.value.length > 0;
});

const routingYaml = computed(() => {
  const clean = {
    ...(draft.clusterNames.length ? { clusterNames: draft.clusterNames } : {}),
    ...(draft.clusterGroups.length ? { clusterGroups: draft.clusterGroups } : {}),
    ...(draft.selectors.length ? {
      clusterSelectors: draft.selectors.map(({ matchLabels, matchExpressions }) => ({
        ...(matchLabels ? { matchLabels } : {}),
        ...(matchExpressions?.length ? { matchExpressions } : {}),
      }))
    } : {}),
  };
  const spec = isDefault ? { default: { registries: selectedRegistries.value } } : {
    routes: [{
      name:               draft.name || '<name>',
      ...clean,
      registries:         selectedRegistries.value,
      replicationTimeout: `${ draft.replicationWaitMinutes }m`,
    }],
  };

  return jsyaml.dump({
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'OCIStorageRouting',
    metadata:   { name: 'default', namespace: workspace.value },
    spec,
  });
});

function done() {
  router.push(listLocation);
}

function save(buttonDone: (success: boolean) => void) {
  if (isDefault) {
    saveDefaultRegistries(selectedRegistries.value);
  } else {
    saveRoute({ ...draft, registries: selectedRegistries.value }, originalName);
  }

  if (applyNow.value) {
    forceUpdate(affected.value);
  }

  buttonDone(true);
  done();
}

function addFailover() {
  draft.registries.push('');
}

function removeRegistry(index: number) {
  draft.registries.splice(index, 1);

  if (!draft.registries.length) {
    draft.registries.push('');
  }
}

function moveRegistry(index: number, delta: number) {
  const [name] = draft.registries.splice(index, 1);

  draft.registries.splice(index + delta, 0, name);
}

function addSelector() {
  draft.selectors.push({ key: nextSelectorKey.value++ });
}

function updateSelector(index: number, value: Selector, key?: number) {
  draft.selectors[index] = { ...value, key };
}

function removeSelector(key?: number) {
  draft.selectors = draft.selectors.filter((s) => s.key !== key);
}
</script>

<template>
  <div data-testid="fleet-oci-route-form">
    <header class="form-header">
      <h1 class="m-0">
        <TabTitle :show-child="false">
          {{ t('fleet.ociStorage.title') }}
        </TabTitle>
        <router-link :to="listLocation">
          {{ t('fleet.ociStorage.title') }}
        </router-link>:
        {{ title }}
      </h1>
    </header>

    <PrototypeBanner />

    <CruResource
      :mode="mode"
      :resource="resource"
      :subtypes="[]"
      :can-yaml="false"
      :validation-passed="isValid"
      :errors="errors"
      @error="(e) => errors = e"
      @finish="save"
      @cancel="done"
    >
      <RcContentGroup>
        <div
          v-if="!isDefault"
          class="row"
        >
          <div class="col span-4">
            <LabeledInput
              v-model:value="draft.name"
              :label="t(`${ ROOT }.name`)"
              :required="true"
              :rules="nameRules"
              :require-dirty="false"
              data-testid="fleet-oci-route-name"
            />
          </div>
          <div class="col span-8">
            <LabeledInput
              v-model:value="draft.description"
              :label="t(`${ ROOT }.description`)"
            />
          </div>
        </div>

        <RcSection
          v-if="!isDefault"
          :title="t(`${ ROOT }.matchTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.matchIntro`) }}
          </p>
          <div class="row">
            <div class="col span-8">
              <ClusterSelectionFields
                :selected-clusters="draft.clusterNames"
                :selected-cluster-groups="draft.clusterGroups"
                :cluster-selectors="draft.selectors"
                :clusters-options="clustersOptions"
                :cluster-groups-options="clusterGroupsOptions"
                :mode="mode"
                @select-clusters="draft.clusterNames = $event"
                @select-cluster-groups="draft.clusterGroups = $event"
                @add-match-expressions="addSelector"
                @update-match-expressions="updateSelector"
                @remove-match-expressions="removeSelector"
              />
            </div>
            <div class="col span-4">
              <TargetsList
                :clusters="targets"
                :compact="true"
                :empty-label="t(`${ ROOT }.previewEmpty`)"
              />
            </div>
          </div>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.registriesTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.registriesIntro`) }}
          </p>
          <div
            v-for="(name, index) in draft.registries"
            :key="index"
            class="registry-row"
            :data-testid="`fleet-oci-route-registry-${ index }`"
          >
            <LabeledSelect
              class="registry-select"
              :value="name"
              :label="index === 0 ? t(`${ ROOT }.primary`) : t(`${ ROOT }.failover`, { n: index })"
              :options="registryOptions(name)"
              :required="index === 0 && !isDefault"
              @update:value="draft.registries[index] = $event"
            />
            <RcButton
              variant="ghost"
              size="small"
              :class="{ 'no-move': index === 0 }"
              :aria-label="t('fleet.ociStorage.actions.moveUp')"
              @click="moveRegistry(index, -1)"
            >
              <i
                class="icon icon-chevron-up"
                aria-hidden="true"
              />
            </RcButton>
            <RcButton
              variant="ghost"
              size="small"
              :class="{ 'no-move': index === draft.registries.length - 1 }"
              :aria-label="t('fleet.ociStorage.actions.moveDown')"
              @click="moveRegistry(index, 1)"
            >
              <i
                class="icon icon-chevron-down"
                aria-hidden="true"
              />
            </RcButton>
            <RcButton
              variant="ghost"
              size="small"
              :aria-label="t('fleet.ociStorage.actions.delete')"
              @click="removeRegistry(index)"
            >
              <i
                class="icon icon-x"
                aria-hidden="true"
              />
            </RcButton>
          </div>
          <div class="registry-actions">
            <RcButton
              variant="secondary"
              size="small"
              :disabled="!canAddFailover"
              data-testid="fleet-oci-route-add-failover"
              @click="addFailover"
            >
              <i
                class="icon icon-plus mmr-1"
                aria-hidden="true"
              />
              {{ t(`${ ROOT }.addFailover`) }}
            </RcButton>
            <span
              v-if="noMoreRegistries"
              class="text-deemphasized"
            >
              {{ t(`${ ROOT }.noMoreRegistries`) }}
              <router-link :to="addRegistryLocation">
                {{ t(`${ ROOT }.addRegistryLink`) }}
              </router-link>
            </span>
          </div>
          <div
            v-if="!isDefault"
            class="row"
          >
            <div class="col span-4">
              <UnitInput
                v-model:value="draft.replicationWaitMinutes"
                min="1"
                :label="t(`${ ROOT }.waitLabel`)"
                :tooltip="t(`${ ROOT }.waitTooltip`)"
                :suffix="t(`${ ROOT }.waitSuffix`)"
                data-testid="fleet-oci-route-wait"
              />
            </div>
          </div>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.previewTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <Banner
            v-if="shadowedCount"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.shadowedInfo`, { count: shadowedCount })"
            data-testid="fleet-oci-route-shadowed"
          />
          <SortableTable
            :headers="previewHeaders"
            :rows="previewRows"
            :search="false"
            :row-actions="false"
            :table-actions="false"
            :paging="false"
            no-rows-key="fleet.ociStorage.routeForm.previewEmpty"
            key-field="key"
            data-testid="fleet-oci-route-preview"
          >
            <template #cell:before="{ row }">
              <RegistryChain :registries="row.before" />
            </template>
            <template #cell:after="{ row }">
              <span
                v-if="row.owner"
                class="text-muted"
              >{{ t(`${ ROOT }.shadowed`, { route: row.owner }) }}</span>
              <RegistryChain
                v-else
                :registries="row.after"
              />
            </template>
            <template #cell:expected="{ row }">
              <BadgeState :value="row.badge" />
            </template>
          </SortableTable>
          <template v-if="affected.length">
            <Checkbox
              v-model:value="applyNow"
              :label="t(`${ ROOT }.forceUpdate`)"
              data-testid="fleet-oci-route-apply-now"
            />
            <p
              v-if="!applyNow"
              class="text-deemphasized"
            >
              {{ t(`${ ROOT }.forceUpdateHint`) }}
            </p>
          </template>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.yaml`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <pre
            class="yaml-preview"
            data-testid="fleet-oci-route-yaml"
          >{{ routingYaml }}</pre>
        </RcSection>
      </RcContentGroup>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.form-header {
  margin-bottom: 16px;
}

.registry-row {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 800px;

  .registry-select {
    flex: 1;
    margin-right: 8px;
  }

  .no-move {
    visibility: hidden;
  }
}

.registry-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.yaml-preview {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background: var(--body-bg);
  overflow-x: auto;
}
</style>
