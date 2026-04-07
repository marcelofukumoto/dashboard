<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  correctDriftEnabled: {
    type:     Boolean,
    required: true
  },
  downstreamSecretsList: {
    type:     Array,
    required: true
  },
  downstreamConfigMapsList: {
    type:     Array,
    required: true
  },
});

const emit = defineEmits([
  'update:correct-drift',
  'update:downstream-resources',
]);

const store = useStore();
const { t } = useI18n(store);

const updateCorrectDrift = (value) => {
  emit('update:correct-drift', value);
};

const updateDownstreamResources = (kind, list) => {
  emit('update:downstream-resources', { kind, list });
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <FleetSecretSelector
          :value="downstreamSecretsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          @update:value="updateDownstreamResources('Secret', $event)"
        />
      </div>
    </div>
    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <FleetConfigMapSelector
          :value="downstreamConfigMapsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          @update:value="updateDownstreamResources('ConfigMap', $event)"
        />
      </div>
    </div>
    <div class="resource-handling">
      <Checkbox
        :value="correctDriftEnabled"
        :tooltip="t('fleet.helmOp.resources.correctDriftTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.correctDrift"
        :mode="mode"
        @update:value="updateCorrectDrift"
      />
      <Checkbox
        v-model:value="value.spec.keepResources"
        :tooltip="t('fleet.helmOp.resources.keepResourcesTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.keepResources"
        :mode="mode"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-handling {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
