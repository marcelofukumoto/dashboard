<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import TabHeader from './TabHeader.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

/**
 * CounterTab
 * Show a button that when clicked decrements a counter that's shown to the user. The
 * counter's initial value should be 42.
 */
export default defineComponent({
  name: 'CounterTab',

  components: { TabHeader },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);
    const count = ref(42);

    const canDecrement = computed(() => count.value > 0);
    const canReset = computed(() => count.value !== 42);
    const showWarning = computed(() => count.value <= 0);

    const decrementCounter = () => {
      count.value--;
    };

    const resetCounter = () => {
      count.value = 42;
    };

    return {
      count,
      decrementCounter,
      resetCounter,
      canDecrement,
      canReset,
      showWarning,
      t
    };
  }
});
</script>

<template>
  <div>
    <TabHeader
      title-key="interview.counter.title"
      description-key="interview.counter.description"
      heading-id="counter-label"
    />

    <fieldset class="mt-15">
      <legend class="sr-only">
        {{ t('interview.counter.counterControls') }}
      </legend>

      <div class="counter-display">
        <span
          aria-live="polite"
          aria-atomic="true"
          role="status"
          :aria-labelledby="'counter-label'"
          class="counter-value"
        >
          {{ t('interview.counter.currentValue', { count }) }}
        </span>
      </div>

      <button
        class="btn btn-sm role-secondary mt-15"
        :aria-label="t('interview.counter.decrementLabel')"
        :disabled="!canDecrement"
        @click="decrementCounter"
      >
        {{ t('interview.counter.decrementButton') }}
      </button>
      <button
        class="btn btn-sm role-tertiary mt-15"
        :aria-label="t('interview.counter.resetLabel')"
        :disabled="!canReset"
        @click="resetCounter"
      >
        {{ t('interview.counter.resetButton') }}
      </button>
    </fieldset>

    <p
      v-if="showWarning"
      class="mt-10 text-warning"
    >
      {{ t('interview.counter.zeroMessage') }}
    </p>
  </div>
</template>

<style scoped>
.counter-display {
  font-size: 1.2rem;
  font-weight: bold;
}

.counter-value {
  color: var(--primary);
}

.text-warning {
  color: var(--warning);
  font-style: italic;
}

</style>
