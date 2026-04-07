<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  realMode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  targetsCreated: {
    type:    String,
    default: ''
  },
  hideAdditionalOptions: {
    type:    Boolean,
    default: false
  }
});

const emit = defineEmits(['update:targets', 'targets-created']);

const store = useStore();
const { t } = useI18n(store);

const updateTargets = (value) => {
  emit('update:targets', value);
};

const onTargetsCreated = (value) => {
  emit('targets-created', value);
};
</script>

<template>
  <div>
    <h2>{{ t('fleet.helmOp.target.label') }}</h2>
    <FleetClusterTargets
      :targets="value.spec.targets"
      :matching="value.targetClusters"
      :namespace="value.metadata.namespace"
      :mode="realMode"
      :created="targetsCreated"
      @update:value="updateTargets"
      @created="onTargetsCreated"
    />

    <template v-if="!hideAdditionalOptions">
      <h3 class="mmt-16 mb-20">
        {{ t('fleet.helmOp.target.additionalOptions') }}
      </h3>
      <HelmOpTargetOptionsSection
        :value="value"
        :mode="mode"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
</style>
