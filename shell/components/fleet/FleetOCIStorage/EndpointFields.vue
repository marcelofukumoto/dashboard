<script setup lang="ts">
import { computed, ref } from 'vue';
import FileSelector from '@shell/components/form/FileSelector';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { Banner } from '@components/Banner';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { RegistryEndpoint } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.form';

const props = defineProps<{
  endpoint: RegistryEndpoint;
  idPrefix: string;
  mode: string;
}>();

const emit = defineEmits<{(e: 'change', patch: Partial<RegistryEndpoint>): void}>();

const { t } = useFleetOCIStorageLabels();

const agentPassword = ref('');
const resolved = computed(() => reference(props.endpoint));

const tlsOptions = computed(() => [
  { label: t(`${ ROOT }.tlsSystem`), value: 'system' },
  { label: t(`${ ROOT }.tlsCustom`), value: 'customCA' },
  { label: t(`${ ROOT }.tlsSkip`), value: 'skipVerify' },
]);

const hostRules = [(value: string) => (/^[a-z]+:\/\//i.test(value || '') || /\s/.test(value || '') ? t(`${ ROOT }.hostSchemeError`) : undefined)];

function change(patch: Partial<RegistryEndpoint>) {
  emit('change', patch);
}

function setAgentPassword(value: string) {
  agentPassword.value = value;
  if (value) {
    change({ hasAgentPassword: true });
  }
}
</script>

<template>
  <div class="endpoint-fields">
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="endpoint.host"
          :label="t(`${ ROOT }.host`)"
          :placeholder="t(`${ ROOT }.hostPlaceholder`)"
          :required="true"
          :rules="hostRules"
          :require-dirty="false"
          :mode="mode"
          :data-testid="`${ idPrefix }-host`"
          @update:value="change({ host: $event })"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="endpoint.namespace"
          :label="t(`${ ROOT }.namespace`)"
          :placeholder="t(`${ ROOT }.namespacePlaceholder`)"
          :tooltip="t(`${ ROOT }.namespaceTooltip`)"
          :mode="mode"
          :data-testid="`${ idPrefix }-namespace`"
          @update:value="change({ namespace: $event })"
        />
      </div>
    </div>
    <p
      v-if="resolved"
      class="text-deemphasized"
    >
      {{ t(`${ ROOT }.resolvesTo`, { reference: resolved }) }}
    </p>

    <slot name="push-credentials" />

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="endpoint.agentUsername"
          :label="t(`${ ROOT }.agentUser`)"
          :tooltip="t(`${ ROOT }.agentUserTooltip`)"
          autocomplete="off"
          :mode="mode"
          :data-testid="`${ idPrefix }-agent-user`"
          @update:value="change({ agentUsername: $event })"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="agentPassword"
          type="password"
          :label="t(`${ ROOT }.agentPassword`)"
          :placeholder="endpoint.hasAgentPassword ? t(`${ ROOT }.passwordUnchanged`) : ''"
          autocomplete="new-password"
          :mode="mode"
          @update:value="setAgentPassword"
        />
      </div>
    </div>

    <RadioGroup
      :value="endpoint.tlsMode"
      :name="`${ idPrefix }-tls`"
      :label="t(`${ ROOT }.tls`)"
      :options="tlsOptions"
      :mode="mode"
      :row="true"
      :data-testid="`${ idPrefix }-tls`"
      @update:value="change({ tlsMode: $event })"
    />
    <div
      v-if="endpoint.tlsMode === 'customCA'"
      class="ca-bundle"
    >
      <LabeledInput
        :value="endpoint.caBundle"
        type="multiline"
        :label="t(`${ ROOT }.caBundle`)"
        :min-height="80"
        :mode="mode"
        @update:value="change({ caBundle: $event })"
      />
      <FileSelector
        class="mmt-2"
        :label="t(`${ ROOT }.readFromFile`)"
        @selected="change({ caBundle: $event })"
      />
    </div>
    <Banner
      v-if="endpoint.tlsMode === 'skipVerify'"
      color="warning"
      class="m-0"
      :label="t(`${ ROOT }.skipWarning`)"
    />
    <Checkbox
      :value="endpoint.basicHTTP"
      :label="t(`${ ROOT }.basicHTTP`)"
      :mode="mode"
      @update:value="change({ basicHTTP: $event })"
    />
    <Banner
      v-if="endpoint.basicHTTP"
      color="warning"
      class="m-0"
      :label="t(`${ ROOT }.basicHTTPWarning`)"
    />
  </div>
</template>

<style lang="scss" scoped>
.endpoint-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;

  p {
    margin: 0;
  }

  .row {
    margin: 0;
  }
}
</style>
