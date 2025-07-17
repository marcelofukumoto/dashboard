<script lang="ts">
import { useStore } from 'vuex';
import TabHeader from './TabHeader.vue';
import { defineComponent, ref } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { swapObject } from '../utils/jsonswap';

/**
 * JSONSwapTab
 * ● Prompt the user to supply a JSON file
 * ● Show the file contents to the user
 * ● Allow the user to press a button that swaps primitive values and keys around
 *   o For example,
 *     ▪ ` { "a": 1 }` becomes `{ 1: "a"} `
 *     ▪ `{ “b”: { }, “c”: [ ] }` does not change
 *● Show the result of the swap to the user
 */
export default defineComponent({
  name: 'JsonSwapTab',

  components: { TabHeader },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    const jsonContent = ref('');
    const swappedJson = ref('');
    const fileInput = ref<HTMLInputElement | null>(null);

    const handleFileUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (onLoadEvent) => {
          jsonContent.value = onLoadEvent.target?.result as string;
          swappedJson.value = '';
        };
        reader.readAsText(file);
      }
    };

    const swapJsonKeysValues = () => {
      try {
        const parsed = JSON.parse(jsonContent.value);
        const swapped = swapObject(parsed);

        swappedJson.value = JSON.stringify(swapped, null, 2);
      } catch (error) {
        swappedJson.value = t('interview.jsonswap.invalidJson');
      }
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    return {
      jsonContent,
      swappedJson,
      handleFileUpload,
      swapJsonKeysValues,
      triggerFileInput,
      fileInput,
      t
    };
  }
});
</script>

<template>
  <div class="p-4">
    <TabHeader
      title-key="interview.jsonswap.title"
      description-key="interview.jsonswap.description"
      heading-id="jsonswap-label"
    />

    <fieldset class="mt-10">
      <legend class="sr-only">
        {{ t('interview.jsonswap.uploadLegend') }}
      </legend>
      <button
        data-v-66e29f26=""
        type="button"
        class="btn role-primary"
        role="button"
        :aria-label="t('interview.jsonswap.uploadLabel')"
        style="display: inline-flex;"
        @click="triggerFileInput"
      >
        <i
          class="icon icon-upload"
        /> <span>{{ t('interview.jsonswap.uploadLabel') }}</span>
      </button>
      <input
        id="jsonswap-file-input"
        ref="fileInput"
        type="file"
        accept=".json"
        :aria-describedby="'jsonswap-file-desc'"
        style="display: none;"
        @change="handleFileUpload"
      >

      <span
        id="jsonswap-file-desc"
        class="sr-only"
      >
        {{ t('interview.jsonswap.uploadDescription') }}
      </span>
    </fieldset>

    <div
      v-if="jsonContent"
      class="mt-10"
      role="region"
      aria-labelledby="jsonswap-original-label"
    >
      <h4 id="jsonswap-original-label">
        {{ t('interview.jsonswap.originalJson') }}
      </h4>
      <pre
        class="bg-light p-2 border rounded"
        aria-live="polite"
      >{{ jsonContent }}</pre>
    </div>

    <button
      v-if="jsonContent"
      class="btn role-secondary mt-10"
      :aria-label="t('interview.jsonswap.swapButtonLabel')"
      @click="swapJsonKeysValues"
    >
      {{ t('interview.jsonswap.swapButton') }}
    </button>

    <div
      v-if="swappedJson"
      class="mt-10"
      role="region"
      aria-labelledby="jsonswap-swapped-label"
    >
      <h4 id="jsonswap-swapped-label">
        {{ t('interview.jsonswap.swappedJson') }}
      </h4>
      <pre
        class="bg-light p-2 border rounded"
        aria-live="polite"
      >{{ swappedJson }}</pre>
    </div>
  </div>
</template>
