<script lang="ts">
import {
  defineComponent, ref, computed, onUnmounted,
  watch
} from 'vue';
import TabHeader from './TabHeader.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

/**
 * DateTimeTab
 * ● Display the current date and time (to the minute)
 * ● Display a new date and time that can be updated by the user by supplying seconds,
 *   minutes and/or hours.
 * ● Inform the user if the current date and time is before, the same or after the updated
 *   date and time
 */
/**
 * Props:
 *  - trigger: Number to control the interval for updating the current date/time
 *    (0 to stop, any other number to start)
 */
export default defineComponent({
  name:  'DateTimeTab',
  props: {
    trigger: {
      type:    Number,
      default: 0
    }
  },

  components: { TabHeader },

  setup(props) {
    const store = useStore();
    const { t } = useI18n(store);

    const currentDateTime = ref(new Date());
    const customHours = ref(0);
    const customMinutes = ref(0);
    const customSeconds = ref(0);

    const customDateTime = computed(() => {
      const now = currentDateTime.value;
      const custom = new Date(now);

      custom.setHours(now.getHours() + customHours.value);
      custom.setMinutes(now.getMinutes() + customMinutes.value);
      custom.setSeconds(now.getSeconds() + customSeconds.value);

      return custom;
    });

    const dateComparison = computed(() => {
      const current = currentDateTime.value.getTime();
      const custom = customDateTime.value.getTime();

      if (current < custom) return 'before';
      if (current > custom) return 'after';

      return 'same';
    });

    const resetCustomTime = () => {
      customHours.value = 0;
      customMinutes.value = 0;
      customSeconds.value = 0;
    };

    let timeInterval: NodeJS.Timeout;

    const comparisonColorClass = computed(() => {
      switch (dateComparison.value) {
      case 'after': return 'comparison-after';
      case 'before': return 'comparison-before';
      default: return 'comparison-normal';
      }
    });

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    });

    watch(() => props.trigger, (newVal) => {
      if (newVal === 0) {
        if (timeInterval) {
          clearInterval(timeInterval);
        }
      } else {
        timeInterval = setInterval(() => {
          currentDateTime.value = new Date();
        }, 1000);
      }
    });

    return {
      currentDateTime,
      customHours,
      customMinutes,
      customSeconds,
      customDateTime,
      dateComparison,
      resetCustomTime,
      comparisonColorClass,
      t
    };
  }
});
</script>

<template>
  <div class="datetime-tab">
    <TabHeader
      title-key="interview.datetime.title"
      description-key="interview.datetime.description"
      heading-id="datetime-label"
    />

    <!-- Current Date/Time Section -->
    <section class="mt-20">
      <h3 id="current-time-label">
        {{ t('interview.datetime.currentTime') }}
      </h3>
      <p
        :aria-labelledby="'current-time-label'"
        aria-live="polite"
      >
        {{ currentDateTime.toLocaleString() }}
      </p>
    </section>

    <!-- Custom Date/Time Section -->
    <section class="mt-20">
      <h3 id="custom-time-label">
        {{ t('interview.datetime.customTime') }}
      </h3>

      <p
        :aria-labelledby="'custom-time-label'"
        aria-live="polite"
        class="mt-10"
      >
        {{ customDateTime.toLocaleString() }}
      </p>

      <fieldset>
        <legend class="sr-only">
          {{ t('interview.datetime.adjustmentInputs') }}
        </legend>

        <div class="row mt-5">
          <!-- Input fields for hours -->
          <div class="col">
            <div class="labeled-input edit">
              <label for="hours-input">
                {{ t('interview.datetime.hours') }}:
              </label>
              <input
                id="hours-input"
                v-model.number="customHours"
                type="number"
                :aria-describedby="'hours-help'"
                class="mt-5"
                inputmode="numeric"
                pattern="[0-9]*"
              >
            </div>
            <small
              id="hours-help"
              class="text-muted"
            >
              {{ t('interview.datetime.hoursHelp') }}
            </small>
          </div>
          <!-- Input fields for minutes -->
          <div class="col">
            <div class="labeled-input edit">
              <label for="minutes-input">
                {{ t('interview.datetime.minutes') }}:
              </label>
              <input
                id="minutes-input"
                v-model.number="customMinutes"
                type="number"
                :aria-describedby="'minutes-help'"
                class="mt-5"
                inputmode="numeric"
                pattern="[0-9]*"
              >
            </div>
            <small
              id="minutes-help"
              class="text-muted"
            >
              {{ t('interview.datetime.minutesHelp') }}
            </small>
          </div>
          <!-- Input fields for seconds -->
          <div class="col">
            <div class="labeled-input edit">
              <label for="seconds-input">
                {{ t('interview.datetime.seconds') }}:
              </label>
              <input
                id="seconds-input"
                v-model.number="customSeconds"
                type="number"
                :aria-describedby="'seconds-help'"
                class="mt-5"
                inputmode="numeric"
                pattern="[0-9]*"
              >
            </div>
            <small
              id="seconds-help"
              class="text-muted"
            >
              {{ t('interview.datetime.secondsHelp') }}
            </small>
          </div>
        </div>
      </fieldset>
      <!-- Reset Button -->
      <div class="mt-10">
        <button
          class="btn btn-sm role-tertiary"
          :aria-label="t('interview.datetime.resetLabel')"
          @click="resetCustomTime"
        >
          {{ t('interview.datetime.resetButton') }}
        </button>
      </div>
    </section>

    <!-- Comparison Section -->
    <section class="mt-20">
      <h3 id="comparison-label">
        {{ t('interview.datetime.comparison') }}
      </h3>
      <p
        :aria-labelledby="'comparison-label'"
        aria-live="polite"
        :class="comparisonColorClass"
      >
        {{ t('interview.datetime.comparisonResult', { comparison: dateComparison }) }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.comparison-normal {
  color: var(--warning);
}
.comparison-after {
  color: var(--error);
}
.comparison-before {
  color: var(--success);
}
</style>
