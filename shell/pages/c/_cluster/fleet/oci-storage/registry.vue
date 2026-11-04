<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsyaml from 'js-yaml';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { SECRET_TYPES } from '@shell/config/secret';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import CruResource from '@shell/components/CruResource';
import FileSelector from '@shell/components/form/FileSelector';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabTitle from '@shell/components/TabTitle';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { RcContentGroup } from '@components/Layout';
import { RcSection } from '@components/RcSection';
import PrototypeBanner from '@shell/components/fleet/FleetOCIStorage/PrototypeBanner.vue';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { ConnectionCheck, OCIRegistry, TestOutcome } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.registryForm';
const CONTROLLER = '__controller__';
const NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const CHECK_ICON: Record<TestOutcome, string> = {
  ok:      'icon-checkmark text-success',
  warning: 'icon-warning text-warning',
  error:   'icon-error text-error',
  skipped: '',
};

const route = useRoute();
const router = useRouter();
const { t } = useFleetOCIStorageLabels();
const {
  workspace, data, sourceRegistry, saveRegistry, forceUpdate, testConnection
} = useFleetOCIStorage();

const originalName = route.params.id as string | undefined;
const original = data.value.registries.find((r) => r.name === originalName);
const mode = originalName ? _EDIT : _CREATE;
const hasSource = !!sourceRegistry.value;

const draft = reactive<OCIRegistry>(original ? { ...original } : {
  name:               '',
  description:        '',
  host:               '',
  namespace:          '',
  role:               hasSource ? 'mirror' : 'source',
  username:           '',
  hasPassword:        false,
  agentUsername:      '',
  hasAgentPassword:   false,
  tlsMode:            'system',
  caBundle:           '',
  basicHTTP:          false,
  controllerAccess:   'ok',
  lastPushMinutesAgo: null,
});

const pushPassword = ref('');
const agentPassword = ref('');
const errors = ref<string[]>([]);
const applyNow = ref(false);
const testFrom = ref(CONTROLLER);
const checks = ref<ConnectionCheck[] | null>(null);
const testing = ref(false);
const resource = { type: 'secret' };

const listLocation = { name: 'c-cluster-fleet-oci-storage', params: { cluster: BLANK_CLUSTER } };

const isSource = computed(() => draft.role === 'source');
const isCurrentSource = original?.role === 'source';
const visibleChecks = computed(() => (checks.value || []).filter((check) => check.outcome !== 'skipped'));
const resolved = computed(() => reference(draft));

const roleOptions = computed(() => [
  { label: t(`${ ROOT }.roleSource`), value: 'source' },
  { label: t(`${ ROOT }.roleMirror`), value: 'mirror' },
]);

const tlsOptions = computed(() => [
  { label: t(`${ ROOT }.tlsSystem`), value: 'system' },
  { label: t(`${ ROOT }.tlsCustom`), value: 'customCA' },
  { label: t(`${ ROOT }.tlsSkip`), value: 'skipVerify' },
]);

const testFromOptions = computed(() => [
  { label: t(`${ ROOT }.testController`), value: CONTROLLER },
  ...data.value.clusters.map((c) => ({ label: c.name, value: c.name })),
]);

const takesOverSource = computed(() => isSource.value && !!sourceRegistry.value && sourceRegistry.value.name !== originalName);

const nameRules = [
  (value: string) => (value && !NAME_REGEX.test(value) ? t(`${ ROOT }.nameError`) : undefined),
  (value: string) => (value !== originalName && data.value.registries.some((r) => r.name === value) ? t(`${ ROOT }.nameTaken`) : undefined),
];
const hostRules = [(value: string) => (/^[a-z]+:\/\//i.test(value || '') || /\s/.test(value || '') ? t(`${ ROOT }.hostSchemeError`) : undefined)];

const isValid = computed(() => {
  return !!draft.name && !!draft.host && [...nameRules].every((rule) => !rule(draft.name)) && hostRules.every((rule) => !rule(draft.host));
});

const secretYaml = computed(() => {
  const secretData: Record<string, string> = { reference: resolved.value || '<reference>' };

  if (isSource.value && draft.username) {
    secretData.username = draft.username;
    secretData.password = '<password>';
  }

  if (draft.agentUsername) {
    secretData.agentUsername = draft.agentUsername;
    secretData.agentPassword = '<password>';
  }

  if (draft.tlsMode === 'skipVerify') {
    secretData.insecureSkipTLS = 'true';
  }

  if (draft.basicHTTP) {
    secretData.basicHTTP = 'true';
  }

  if (draft.tlsMode === 'customCA') {
    secretData.cacerts = '<pem-ca-bundle>';
  }

  return jsyaml.dump({
    apiVersion: 'v1',
    kind:       'Secret',
    metadata:   {
      name:      draft.name || '<name>',
      namespace: workspace.value,
      labels:    { 'fleet.cattle.io/oci-registry-role': draft.role },
    },
    type:       SECRET_TYPES.FLEET_OCI_STORAGE,
    stringData: secretData,
  });
});

function done() {
  router.push(listLocation);
}

function save(buttonDone: (success: boolean) => void) {
  const saved: OCIRegistry = {
    ...draft,
    hasPassword:      draft.hasPassword || !!pushPassword.value,
    hasAgentPassword: draft.hasAgentPassword || !!agentPassword.value,
    caBundle:         draft.tlsMode === 'customCA' ? draft.caBundle : '',
    username:         isSource.value ? draft.username : '',
  };

  saveRegistry(saved, originalName);

  if (applyNow.value) {
    forceUpdate();
  }

  buttonDone(true);
  done();
}

async function runTest() {
  testing.value = true;
  checks.value = null;
  await new Promise((resolve) => setTimeout(resolve, 600));

  const from = testFrom.value === CONTROLLER ? t(`${ ROOT }.testController`) : testFrom.value;

  checks.value = testConnection({ ...draft }, from);
  testing.value = false;
}

function readCaBundle(value: string) {
  draft.caBundle = value;
}
</script>

<template>
  <div data-testid="fleet-oci-registry-form">
    <header class="form-header">
      <h1 class="m-0">
        <TabTitle :show-child="false">
          {{ t('fleet.ociStorage.title') }}
        </TabTitle>
        <router-link :to="listLocation">
          {{ t('fleet.ociStorage.title') }}
        </router-link>:
        {{ originalName ? t(`${ ROOT }.editTitle`, { name: originalName }) : t(`${ ROOT }.addTitle`) }}
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
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              v-model:value="draft.name"
              :label="t(`${ ROOT }.name`)"
              :mode="mode"
              :required="true"
              :rules="nameRules"
              :require-dirty="false"
              data-testid="fleet-oci-registry-name"
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

        <RcSection
          :title="t(`${ ROOT }.endpoint`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value="draft.host"
                :label="t(`${ ROOT }.host`)"
                :placeholder="t(`${ ROOT }.hostPlaceholder`)"
                :required="true"
                :rules="hostRules"
                :require-dirty="false"
                data-testid="fleet-oci-registry-host"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="draft.namespace"
                :label="t(`${ ROOT }.namespace`)"
                :placeholder="t(`${ ROOT }.namespacePlaceholder`)"
                :tooltip="t(`${ ROOT }.namespaceTooltip`)"
                data-testid="fleet-oci-registry-namespace"
              />
            </div>
          </div>
          <p
            v-if="resolved"
            class="text-deemphasized"
            data-testid="fleet-oci-registry-resolves"
          >
            {{ t(`${ ROOT }.resolvesTo`, { reference: resolved }) }}
          </p>

          <RadioGroup
            v-model:value="draft.role"
            name="registry-role"
            :label="t(`${ ROOT }.role`)"
            :options="roleOptions"
            :mode="mode"
            :disabled="isCurrentSource"
            data-testid="fleet-oci-registry-role"
          />
          <p
            v-if="isCurrentSource"
            class="text-deemphasized"
          >
            {{ t(`${ ROOT }.sourceLocked`) }}
          </p>
          <Banner
            v-if="!isSource"
            color="info"
            class="m-0"
            :label="t(`${ ROOT }.mirrorInfo`, { source: sourceRegistry?.name || '' })"
          />
          <Banner
            v-if="takesOverSource"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.sourceChange`, { current: sourceRegistry?.name || '' })"
          />
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.credentials`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <div
            v-if="isSource"
            class="row"
          >
            <div class="col span-6">
              <LabeledInput
                v-model:value="draft.username"
                :label="t(`${ ROOT }.pushUser`)"
                autocomplete="off"
                data-testid="fleet-oci-registry-push-user"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="pushPassword"
                type="password"
                :label="t(`${ ROOT }.pushPassword`)"
                :placeholder="draft.hasPassword ? t(`${ ROOT }.passwordUnchanged`) : ''"
                autocomplete="new-password"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value="draft.agentUsername"
                :label="t(`${ ROOT }.agentUser`)"
                :tooltip="t(`${ ROOT }.agentUserTooltip`)"
                autocomplete="off"
                data-testid="fleet-oci-registry-agent-user"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value="agentPassword"
                type="password"
                :label="t(`${ ROOT }.agentPassword`)"
                :placeholder="draft.hasAgentPassword ? t(`${ ROOT }.passwordUnchanged`) : ''"
                autocomplete="new-password"
              />
            </div>
          </div>
          <Banner
            v-if="isSource && !draft.agentUsername"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.agentWarning`)"
            data-testid="fleet-oci-registry-agent-warning"
          />
          <p
            v-else-if="!isSource && !draft.agentUsername"
            class="text-deemphasized"
          >
            {{ t(`${ ROOT }.mirrorAnonymous`) }}
          </p>
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.perClusterHint`) }}
          </p>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.tls`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <RadioGroup
            v-model:value="draft.tlsMode"
            name="registry-tls"
            :options="tlsOptions"
            :mode="mode"
            data-testid="fleet-oci-registry-tls"
          />
          <div
            v-if="draft.tlsMode === 'customCA'"
            class="ca-bundle"
          >
            <LabeledInput
              v-model:value="draft.caBundle"
              type="multiline"
              :label="t(`${ ROOT }.caBundle`)"
              :min-height="100"
              data-testid="fleet-oci-registry-ca"
            />
            <FileSelector
              class="mmt-2"
              :label="t(`${ ROOT }.readFromFile`)"
              @selected="readCaBundle"
            />
          </div>
          <Banner
            v-if="draft.tlsMode === 'skipVerify'"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.skipWarning`)"
          />
          <Checkbox
            v-model:value="draft.basicHTTP"
            :label="t(`${ ROOT }.basicHTTP`)"
          />
          <Banner
            v-if="draft.basicHTTP"
            color="warning"
            class="m-0"
            :label="t(`${ ROOT }.basicHTTPWarning`)"
          />
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.test`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <p class="text-deemphasized">
            {{ t(`${ ROOT }.testIntro`) }}
          </p>
          <div class="row test-row">
            <div class="col span-4">
              <LabeledSelect
                v-model:value="testFrom"
                :label="t(`${ ROOT }.testFrom`)"
                :options="testFromOptions"
                data-testid="fleet-oci-registry-test-from"
              />
            </div>
            <div class="col span-4">
              <RcButton
                variant="secondary"
                size="large"
                :disabled="!draft.host || testing"
                data-testid="fleet-oci-registry-test"
                @click="runTest"
              >
                <i
                  v-if="testing"
                  class="icon icon-spinner icon-spin mmr-2"
                  aria-hidden="true"
                />
                {{ t(`${ ROOT }.testRun`) }}
              </RcButton>
            </div>
          </div>
          <ul
            v-if="checks"
            class="checks list-unstyled"
            data-testid="fleet-oci-registry-checks"
          >
            <li
              v-for="check in visibleChecks"
              :key="check.key"
            >
              <i
                class="icon"
                :class="CHECK_ICON[check.outcome]"
                aria-hidden="true"
              />
              {{ t(`${ ROOT }.check.${ check.key }${ check.outcome === 'error' ? 'Failed' : '' }`, check.params) }}
            </li>
          </ul>
        </RcSection>

        <RcSection
          :title="t(`${ ROOT }.yaml`)"
          type="primary"
          mode="with-header"
          :expandable="false"
        >
          <pre
            class="yaml-preview"
            data-testid="fleet-oci-registry-yaml"
          >{{ secretYaml }}</pre>
        </RcSection>

        <div
          v-if="originalName"
          class="apply-now"
        >
          <Banner
            color="info"
            class="m-0"
            :label="t(`${ ROOT }.changesInfo`)"
          />
          <Checkbox
            v-model:value="applyNow"
            :label="t('fleet.ociStorage.routeForm.forceUpdate')"
          />
        </div>
      </RcContentGroup>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.form-header {
  margin-bottom: 16px;
}

.test-row {
  align-items: center;
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;

  .icon {
    width: 16px;
    margin-right: 6px;
  }
}

.yaml-preview {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background: var(--body-bg);
  overflow-x: auto;
}

.apply-now {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
