<script lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import TabHeader from './TabHeader.vue';
import { computed, defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { coinChange } from '../utils/coinchange';
import { inputSanitizer } from '../utils/inputSanitizer';

/**
 * CoinChangeTab
 * ● Given an array of coin denominations and a total amount, return the minimum
 *   number of coins that matches the amount, or null if not possible
 * ● For example
 *   o Input: coins = [1, 2, 5], amount = 11. Output: [5,5,1]
 *   o Input: coins = [2], amount = 3. Output: null
 * ● Input: coins = [1], amount = 0. Output: []
 */
export default defineComponent({
  name: 'CoinChangeTab',

  components: { TabHeader },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);
    const coins = ref('1,2,5');
    const amount = ref(11);
    const coinResult = ref('');
    const inputError = ref('');
    const MAX_AMOUNT = 10000000; // Set a reasonable limit for the amount
    const isCalculating = ref(false);

    const onCoinsInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const regex = /[^\d,]/g;
      const invalid = regex.test(target.value);

      inputError.value = invalid ? t('interview.coinchange.inputError') : '';

      inputSanitizer(event, regex, (val) => {
        coins.value = val;
      });
    };

    const coinsArray = computed(() => {
      return coins.value
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
    });

    const canSolve = computed(() => {
      return coinsArray.value.length > 0 &&
         amount.value >= 0 &&
         amount.value <= MAX_AMOUNT;
    });

    const validationError = computed(() => {
      if (amount.value > MAX_AMOUNT) {
        return t('interview.coinchange.amountTooLarge', { max: MAX_AMOUNT });
      }
      if (amount.value < 0) {
        return t('interview.coinchange.amountNonNegative');
      }
      if (coinsArray.value.length === 0) {
        return t('interview.coinchange.invalidCoins');
      }

      return '';
    });

    // Function to solve the coin change problem
    // This will be called when the user clicks the "Solve" button
    // It will validate the input, show a loading state, and then calculate the result
    // TO-DO add some cached for calculation results
    const solveCoins = async() => {
      if (!canSolve.value) {
        coinResult.value = validationError.value;

        return;
      }

      isCalculating.value = true;
      coinResult.value = t('interview.coinchange.calculating');

      // Allow UI to update before heavy calculation
      await new Promise((resolve) => setTimeout(resolve, 10));

      try {
        const result = coinChange(coinsArray.value, amount.value);

        coinResult.value = result ? JSON.stringify(result) : t('interview.coinchange.noSolution');
      } catch (error) {
        coinResult.value = t('interview.coinchange.calculationFailed');
      } finally {
        isCalculating.value = false;
      }
    };

    return {
      coins,
      amount,
      coinResult,
      solveCoins,
      onCoinsInput,
      inputError,
      isCalculating,
      t,
    };
  }
});
</script>

<template>
  <div class="p-4">
    <TabHeader
      title-key="interview.coinchange.title"
      description-key="interview.coinchange.description"
      heading-id="coinchange-label"
    />

    <div class="row mt-10">
      <div class="col span-3">
        <div class="labeled-input edit">
          <label :for="'coinchange-coins-input'">{{ t('interview.coinchange.coinsLabel') }}</label>

          <input
            id="coinchange-coins-input"
            v-model="coins"
            class="mt-5"
            :placeholder="t('interview.coinchange.coinsPlaceholder')"
            @input="onCoinsInput"
          >
        </div>
        <div
          class="text-error mt-2 coins-input-error"
          aria-live="polite"
        >
          {{ inputError }}
        </div>
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-3">
        <div class="labeled-input edit">
          <label :for="'coinchange-amount-input'">{{ t('interview.coinchange.amountLabel') }}</label>

          <input
            id="coinchange-amount-input"
            v-model.number="amount"
            type="number"
            class="input-sm mt-5"
            inputmode="numeric"
            pattern="[0-9]*"
            :placeholder="t('interview.coinchange.amountPlaceholder')"
          >
        </div>
      </div>
    </div>

    <button
      class="btn btn-sm role-secondary mt-10"
      @click="solveCoins"
    >
      {{ t('interview.coinchange.solveButton') }}
    </button>

    <div
      class="mt-10"
    >
      <h4>{{ t('interview.coinchange.resultLabel') }}</h4>
      <div class="row">
        <div class="col span-3 break-word">
          <p class="mt-5">
            {{ coinResult }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coins-input-error {
  min-height: 1.5em;
}

.break-word {
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
</style>
