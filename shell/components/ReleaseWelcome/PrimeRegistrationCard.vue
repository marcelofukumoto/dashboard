<script setup lang="ts">
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { ReleaseWelcomeRegistration } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

defineProps({
  registration: {
    type:     Object as PropType<ReleaseWelcomeRegistration>,
    required: true
  }
});

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-registration-title"
    data-testid="release-welcome-registration"
  >
    <h3 id="release-welcome-registration-title">
      {{ registration.title }}
    </h3>
    <p>{{ registration.description }}</p>
    <ul class="benefits">
      <li
        v-for="benefit in registration.benefits"
        :key="benefit.text"
      >
        <i
          class="icon icon-checkmark"
          aria-hidden="true"
        />
        <span class="benefit">
          {{ benefit.text }}
          <a
            v-if="benefit.cta"
            :href="benefit.cta.link"
            target="_blank"
            rel="noopener noreferrer nofollow"
            data-testid="release-welcome-support-handbook"
          >
            {{ benefit.cta.action }}
            <i
              class="icon icon-external-link"
              aria-hidden="true"
            />
            <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
          </a>
        </span>
      </li>
    </ul>
    <RcButton
      class="cta"
      variant="primary"
      size="small"
      :href="registration.cta.link"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-registration-open"
    >
      {{ registration.cta.action }}
      <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
    </RcButton>
  </PrimeCard>
</template>

<style lang="scss" scoped>
.benefits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 21px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .icon-checkmark {
    margin-top: 3px;
    color: var(--success);
  }
}

.benefit {
  display: flex;
  flex-direction: column;
  gap: 3px;

  a {
    font-size: 13px;
    font-weight: 500;
  }
}

.cta {
  margin-top: 4px;
  font-weight: 600;
}
</style>
