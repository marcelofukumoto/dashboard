<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

/**
 * TabHeader Component
 * Displays a heading and description for a tab.
 * Props:
 *  - titleKey: i18n key for the heading text
 *  - descriptionKey: i18n key for the description text
 *  - headingId: unique id for accessibility
 */
export default defineComponent({
  name: 'TabHeader',

  props: {
    titleKey: {
      type:     String,
      required: true
    },
    descriptionKey: {
      type:     String,
      required: true
    },
    headingId: {
      type:     String,
      required: true
    }
  },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    return { t };
  }

});
</script>

<template>
  <div class="mb-10">
    <h2 :id="headingId">
      {{ t(titleKey) }}
    </h2>
    <p
      :id="`${headingId}-desc`"
      class="mt-15"
    >
      {{ t(descriptionKey) }}
    </p>
  </div>
</template>
