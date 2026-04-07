<script setup>
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
});
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        v-model:value="value.spec.serviceAccount"
        :mode="mode"
        label-key="fleet.helmOp.serviceAccount.label"
        placeholder-key="fleet.helmOp.serviceAccount.placeholder"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        v-model:value="value.spec.namespace"
        :mode="mode"
        label-key="fleet.helmOp.targetNamespace.label"
        placeholder-key="fleet.helmOp.targetNamespace.placeholder"
        label="Target Namespace"
        placeholder="Optional: Require all resources to be in this namespace"
      />
    </div>
  </div>
</template>
