<script lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import TabHeader from './TabHeader.vue';
import { computed, defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { isValidParentheses } from '../utils/parentheses';
import { inputSanitizer } from '../utils/inputSanitizer';

/**
 * ParenthesesTab
 * ● Given a string which only contains characters `(`, `)`, `[`, `]`, `{`, `}` determine if each
 *   parentheses is closed in the correct order
 * ● For example
 *   ○ Input: `()`. Output: true
 *   ○ Input: `{}[]()`. Output: true
 *   ○ Input: `(]`. Output: false
 *   ○ Input: `[()]`. Output: true
 */
export default defineComponent({
  name: 'ParenthesesTab',

  components: { TabHeader },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    const parenthesesInput = ref('');
    const inputError = ref('');

    const parenthesesResult = computed(() => {
      if (!parenthesesInput.value) return 'empty';

      return String(isValidParentheses(parenthesesInput.value));
    });

    const comparisonColorClass = computed(() => {
      switch (parenthesesResult.value) {
      case 'true': return 'comparison-true';
      case 'false': return 'comparison-false';
      default: return '';
      }
    });

    const onParenthesesInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const regex = /[^()\[\]{}]/g;
      const invalid = regex.test(target.value);

      inputError.value = invalid ? t('interview.parentheses.inputError') : '';
      inputSanitizer(event, regex, (val) => {
        parenthesesInput.value = val;
      });
    };

    return {
      parenthesesInput,
      parenthesesResult,
      onParenthesesInput,
      comparisonColorClass,
      inputError,
      t
    };
  }
});
</script>

<template>
  <div class="p-4">
    <TabHeader
      title-key="interview.parentheses.title"
      description-key="interview.parentheses.description"
      heading-id="parentheses-label"
    />

    <!-- Input field for parentheses validation -->
    <div class="row mt-10">
      <div class="col span-3">
        <div class="labeled-input edit">
          <label :for="'parentheses-input'">{{ t('interview.parentheses.inputLabel') }}</label>

          <input
            id="parentheses-input"
            v-model="parenthesesInput"
            class="mt-10"
            :placeholder="t('interview.parentheses.inputPlaceholder')"
            @input="onParenthesesInput"
          >
        </div>
        <div
          class="text-error mt-2 parentheses-input-error"
          aria-live="polite"
        >
          {{ inputError }}
        </div>
      </div>
    </div>

    <!-- Display the result of the parentheses validation -->
    <div
      class="mt-10"
    >
      <h4>{{ t('interview.parentheses.resultLabel') }}</h4>
      <p
        aria-live="polite"
        :class="comparisonColorClass"
      >
        {{ parenthesesResult }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.parentheses-input-error {
  min-height: 1.5em;
}
.comparison-false {
  color: var(--error);
}
.comparison-true {
  color: var(--success);
}
</style>
