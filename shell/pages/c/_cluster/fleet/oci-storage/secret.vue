<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsyaml from 'js-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { SECRET_TYPES } from '@shell/config/secret';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { Selector } from '@shell/types/fleet';
import CruResource from '@shell/components/CruResource';
import SortableTable from '@shell/components/SortableTable';
import TabTitle from '@shell/components/TabTitle';
import ClusterSelectionFields from '@shell/components/fleet/FleetClusterTargets/ClusterSelectionFields.vue';
import TargetsList from '@shell/components/fleet/FleetClusterTargets/TargetsList.vue';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import { RcContentGroup } from '@components/Layout';
import { RcSection } from '@components/RcSection';
import { RcTag } from '@components/Pill';
import PrototypeBanner from '@shell/components/fleet/FleetOCIStorage/PrototypeBanner.vue';
import EndpointFields from '@shell/components/fleet/FleetOCIStorage/EndpointFields.vue';
import RegistryChain from '@shell/components/fleet/FleetOCIStorage/RegistryChain.vue';
import {
  FALLBACK_SECRET, PUSH_ENTRY, pullOrder, reference, setMatches
} from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { CredentialSet, OCIStorageSecret, PushRegistry, RegistryEndpoint } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.form';
const NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const route = useRoute();
const router = useRouter();
const { t, entryLabel } = useFleetOCIStorageLabels();
const { workspace, data, saveSecret } = useFleetOCIStorage();

const originalName = route.params.id as string | undefined;
const original = data.value.secrets.find((s) => s.name === originalName);
const mode = originalName ? _EDIT : _CREATE;

const emptyEndpoint = (): RegistryEndpoint => ({
  host:             '',
  namespace:        '',
  agentUsername:    '',
  hasAgentPassword: false,
  tlsMode:          'system',
  caBundle:         '',
  basicHTTP:        false,
});

const draft = reactive<OCIStorageSecret>(original ? JSON.parse(JSON.stringify(original)) : {
  // The first secret in a workspace is usually the one every GitRepo falls back to
  name:        data.value.secrets.some((s) => s.name === FALLBACK_SECRET) ? '' : FALLBACK_SECRET,
  description: '',
  ageMinutes:  0,
  push:        {
    ...emptyEndpoint(), username: '', hasPassword: false
  },
  credentialSets: [],
});

const pushPassword = ref('');
const onlyChanged = ref(false);
const errors = ref<string[]>([]);
const nextSelectorKey = ref(1000);
const resource = { type: 'secret' };

const listLocation = { name: 'c-cluster-fleet-oci-storage', params: { cluster: BLANK_CLUSTER } };

const isFallback = computed(() => draft.name === FALLBACK_SECRET);
const agentGetsPush = computed(() => !!draft.push.username && !draft.push.agentUsername);

const clustersOptions = computed(() => data.value.clusters.map((c) => ({ label: c.name, value: c.name })));
const clusterGroupsOptions = computed(() => {
  const groups = new Set(data.value.clusters.flatMap((c) => c.groups));

  return [...groups].map((group) => ({ label: group, value: group }));
});

function targets(set: CredentialSet) {
  return data.value.clusters.filter((c) => setMatches(set, c)).map((c) => ({
    name:           c.name,
    nameDisplay:    c.name,
    detailLocation: {},
  }));
}

const nameRules = [
  (value: string) => (value && !NAME_REGEX.test(value) ? t(`${ ROOT }.nameError`) : undefined),
  (value: string) => (value !== originalName && data.value.secrets.some((s) => s.name === value) ? t(`${ ROOT }.nameTaken`) : undefined),
];

function setNameError(set: CredentialSet, index: number): string | undefined {
  if (!set.name) {
    return undefined;
  }

  if (!NAME_REGEX.test(set.name)) {
    return t(`${ ROOT }.nameError`);
  }

  if (set.name === PUSH_ENTRY) {
    return t(`${ ROOT }.setNameReserved`, { name: PUSH_ENTRY });
  }

  return draft.credentialSets.some((other, i) => i !== index && other.name === set.name) ? t(`${ ROOT }.setNameTaken`) : undefined;
}

const setNameRules = computed(() => draft.credentialSets.map((set, index) => [() => setNameError(set, index)]));

const hostValid = (host: string) => !!host && !/^[a-z]+:\/\//i.test(host) && !/\s/.test(host);

const isValid = computed(() => !!draft.name &&
  nameRules.every((rule) => !rule(draft.name)) &&
  hostValid(draft.push.host) &&
  draft.credentialSets.every((set, index) => !!set.name && !setNameError(set, index) && hostValid(set.host)));

const previewRows = computed(() => data.value.clusters.map((cluster) => {
  const before = original ? pullOrder(original, cluster).map(entryLabel) : [];
  const after = pullOrder(draft, cluster).map(entryLabel);

  return {
    key:     cluster.name,
    name:    cluster.name,
    before,
    after,
    changed: before.join() !== after.join(),
  };
}).filter((row) => !onlyChanged.value || row.changed));

const previewHeaders = computed(() => [
  {
    name: 'name', labelKey: `${ ROOT }.headers.cluster`, value: 'name', sort: ['name']
  },
  ...(original ? [{ name: 'before', labelKey: `${ ROOT }.headers.now` }] : []),
  { name: 'after', labelKey: original ? `${ ROOT }.headers.after` : `${ ROOT }.headers.order` },
]);

function endpointData(endpoint: RegistryEndpoint) {
  return {
    reference: reference(endpoint) || '<reference>',
    ...(endpoint.agentUsername ? { agentUsername: endpoint.agentUsername, agentPassword: '<password>' } : {}),
    ...(endpoint.tlsMode === 'skipVerify' ? { insecureSkipTLS: 'true' } : {}),
    ...(endpoint.basicHTTP ? { basicHTTP: 'true' } : {}),
    ...(endpoint.tlsMode === 'customCA' ? { cacerts: '<pem-ca-bundle>' } : {}),
  };
}

const secretYaml = computed(() => {
  const push = draft.push as PushRegistry;
  const stringData: Record<string, string> = {
    ...endpointData(push),
    ...(push.username ? { username: push.username, password: '<password>' } : {}),
  };

  if (draft.credentialSets.length) {
    stringData.credentialSets = jsyaml.dump(draft.credentialSets.map((set) => ({
      name: set.name || '<name>',
      ...endpointData(set),
      ...(set.clusterNames.length ? { clusterNames: set.clusterNames } : {}),
      ...(set.clusterGroups.length ? { clusterGroups: set.clusterGroups } : {}),
      ...(set.selectors.length ? {
        clusterSelectors: set.selectors.map(({ matchLabels, matchExpressions }) => ({
          ...(matchLabels ? { matchLabels } : {}),
          ...(matchExpressions?.length ? { matchExpressions } : {}),
        }))
      } : {}),
    })));
  }

  return jsyaml.dump({
    apiVersion: 'v1',
    kind:       'Secret',
    metadata:   { name: draft.name || '<name>', namespace: workspace.value },
    type:       SECRET_TYPES.FLEET_OCI_STORAGE,
    stringData,
  });
});

function patchPush(patch: Partial<PushRegistry>) {
  Object.assign(draft.push, patch);
}

function patchSet(index: number, patch: Partial<CredentialSet>) {
  Object.assign(draft.credentialSets[index], patch);
}

function addSet() {
  draft.credentialSets.push({
    name: '', ...emptyEndpoint(), clusterNames: [], clusterGroups: [], selectors: []
  });
}

function removeSet(index: number) {
  draft.credentialSets.splice(index, 1);
}

function moveSet(index: number, delta: number) {
  const [set] = draft.credentialSets.splice(index, 1);

  draft.credentialSets.splice(index + delta, 0, set);
}

function addSelector(index: number) {
  draft.credentialSets[index].selectors.push({ key: nextSelectorKey.value++ });
}

function updateSelector(index: number, position: number, value: Selector, key?: number) {
  draft.credentialSets[index].selectors[position] = { ...value, key };
}

function removeSelector(index: number, key?: number) {
  const set = draft.credentialSets[index];

  set.selectors = set.selectors.filter((s) => s.key !== key);
}

function done() {
  router.push(listLocation);
}

function save(buttonDone: (success: boolean) => void) {
  const saved: OCIStorageSecret = JSON.parse(JSON.stringify(draft));

  saved.push.hasPassword = saved.push.hasPassword || !!pushPassword.value;
  saved.credentialSets.forEach((set) => {
    set.caBundle = set.tlsMode === 'customCA' ? set.caBundle : '';
  });
  saveSecret(saved, originalName);
  buttonDone(true);
  done();
}
</script>

<template>
  <div data-testid="fleet-oci-secret-form">
    <header class="form-header">
      <h1 class="m-0">
        <TabTitle :show-child="false">
          {{ t('fleet.ociStorage.title') }}
        </TabTitle>
        <router-link :to="listLocation">
          {{ t('fleet.ociStorage.title') }}
        </router-link>:
        {{ originalName ? t(`${ ROOT }.editTitle`, { name: originalName }) : t(`${ ROOT }.createTitle`) }}
      </h1>
    </header>

    <PrototypeBanner />

    <CruResource
      :mode="mode"
      :resource="resource"
      :subtypes="[]"
      :can-yaml="false"
      :cancel-event="true"
      :validation-passed="isValid"
      :errors="errors"
      @error="(e) => errors = e"
      @finish="save"
      @cancel="done"
    >
      <RcContentGroup>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              v-model:value="draft.name"
              :label="t(`${ ROOT }.name`)"
              :mode="mode"
              :required="true"
              :rules="nameRules"
              :require-dirty="false"
              data-testid="fleet-oci-secret-name"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model:value="draft.description"
              :label="t(`${ ROOT }.description`)"
              :mode="mode"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="workspace"
              :label="t(`${ ROOT }.workspace`)"
              :disabled="true"
            />
          </div>
        </div>
        <Banner
          color="info"
          class="m-0"
          data-testid="fleet-oci-secret-fallback-info"
          :label="isFallback ? t(`${ ROOT }.fallbackInfo`, { name: FALLBACK_SECRET }) : t(`${ ROOT }.namedInfo`, { name: FALLBACK_SECRET })"
        />

        <RcSection
          :title="t(`${ ROOT }.pushTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.pushIntro`) }}
          </p>
          <EndpointFields
            :endpoint="draft.push"
            id-prefix="fleet-oci-push"
            :mode="mode"
            @change="patchPush"
          >
            <template #push-credentials>
              <div class="row">
                <div class="col span-6">
                  <LabeledInput
                    v-model:value="draft.push.username"
                    :label="t(`${ ROOT }.pushUser`)"
                    autocomplete="off"
                    :mode="mode"
                    data-testid="fleet-oci-push-user"
                  />
                </div>
                <div class="col span-6">
                  <LabeledInput
                    v-model:value="pushPassword"
                    type="password"
                    :label="t(`${ ROOT }.pushPassword`)"
                    :placeholder="draft.push.hasPassword ? t(`${ ROOT }.passwordUnchanged`) : ''"
                    autocomplete="new-password"
                    :mode="mode"
                  />
                </div>
              </div>
            </template>
          </EndpointFields>
          <Banner
            v-if="agentGetsPush"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.agentWarning`)"
            data-testid="fleet-oci-push-agent-warning"
          />
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.setsTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.setsIntro`) }}
          </p>
          <Banner
            color="info"
            class="m-0"
            :label="t(`${ ROOT }.replicationInfo`)"
          />

          <div
            v-for="(set, index) in draft.credentialSets"
            :key="index"
            class="credential-set"
            :data-testid="`fleet-oci-set-${ index }`"
          >
            <div class="set-header">
              <span class="set-order">{{ index + 1 }}</span>
              <LabeledInput
                class="set-name"
                :value="set.name"
                :label="t(`${ ROOT }.setName`)"
                :required="true"
                :rules="setNameRules[index]"
                :require-dirty="false"
                :mode="mode"
                :data-testid="`fleet-oci-set-${ index }-name`"
                @update:value="patchSet(index, { name: $event })"
              />
              <RcButton
                variant="ghost"
                size="small"
                :disabled="index === 0"
                :aria-label="t('fleet.ociStorage.actions.moveUp')"
                :data-testid="`fleet-oci-set-${ index }-up`"
                @click="moveSet(index, -1)"
              >
                <i
                  class="icon icon-chevron-up"
                  aria-hidden="true"
                />
              </RcButton>
              <RcButton
                variant="ghost"
                size="small"
                :disabled="index === draft.credentialSets.length - 1"
                :aria-label="t('fleet.ociStorage.actions.moveDown')"
                :data-testid="`fleet-oci-set-${ index }-down`"
                @click="moveSet(index, 1)"
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
                :data-testid="`fleet-oci-set-${ index }-remove`"
                @click="removeSet(index)"
              >
                <i
                  class="icon icon-trash"
                  aria-hidden="true"
                />
              </RcButton>
            </div>

            <EndpointFields
              :endpoint="set"
              :id-prefix="`fleet-oci-set-${ index }`"
              :mode="mode"
              @change="patchSet(index, $event)"
            />

            <h4 class="m-0">
              {{ t(`${ ROOT }.matchTitle`) }}
            </h4>
            <div class="row match-row">
              <div class="col span-8">
                <ClusterSelectionFields
                  :selected-clusters="set.clusterNames"
                  :selected-cluster-groups="set.clusterGroups"
                  :cluster-selectors="set.selectors"
                  :clusters-options="clustersOptions"
                  :cluster-groups-options="clusterGroupsOptions"
                  :mode="mode"
                  @select-clusters="patchSet(index, { clusterNames: $event })"
                  @select-cluster-groups="patchSet(index, { clusterGroups: $event })"
                  @add-match-expressions="addSelector(index)"
                  @update-match-expressions="(position, value, key) => updateSelector(index, position, value, key)"
                  @remove-match-expressions="removeSelector(index, $event)"
                />
              </div>
              <div class="col span-4">
                <TargetsList
                  :clusters="targets(set)"
                  :compact="true"
                  :empty-label="t(`${ ROOT }.matchesNone`)"
                />
              </div>
            </div>
          </div>

          <div class="set-actions">
            <RcButton
              variant="secondary"
              size="small"
              data-testid="fleet-oci-add-set"
              @click="addSet"
            >
              <i
                class="icon icon-plus mmr-1"
                aria-hidden="true"
              />
              {{ t(`${ ROOT }.addSet`) }}
            </RcButton>
          </div>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.previewTitle`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.previewIntro`) }}
          </p>
          <Checkbox
            v-if="original"
            v-model:value="onlyChanged"
            :label="t(`${ ROOT }.onlyChanged`)"
            data-testid="fleet-oci-preview-only-changed"
          />
          <SortableTable
            :headers="previewHeaders"
            :rows="previewRows"
            :search="false"
            :row-actions="false"
            :table-actions="false"
            :paging="false"
            no-rows-key="fleet.ociStorage.form.previewEmpty"
            key-field="key"
            data-testid="fleet-oci-secret-preview"
          >
            <template #cell:before="{ row }">
              <RegistryChain :registries="row.before" />
            </template>
            <template #cell:after="{ row }">
              <span class="after">
                <RegistryChain :registries="row.after" />
                <RcTag
                  v-if="original && row.changed"
                  type="active"
                >{{ t(`${ ROOT }.changed`) }}</RcTag>
              </span>
            </template>
          </SortableTable>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.yaml`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.yamlIntro`) }}
          </p>
          <pre
            class="yaml-preview"
            data-testid="fleet-oci-secret-yaml"
          >{{ secretYaml }}</pre>
        </RcSection>
      </RcContentGroup>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.form-header {
  margin-bottom: 16px;
}

.credential-set {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
}

.set-header {
  display: flex;
  align-items: center;
  gap: 4px;

  .set-order {
    min-width: 28px;
    font-size: 18px;
    font-weight: 600;
  }

  .set-name {
    flex: 1;
    max-width: 360px;
    margin-right: 8px;
  }
}

.match-row {
  margin: 0;
}

.set-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.after {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
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
