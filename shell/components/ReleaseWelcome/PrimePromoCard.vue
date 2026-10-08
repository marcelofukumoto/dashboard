<script setup lang="ts">
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
import { useI18n } from '@shell/composables/useI18n';
import { ReleaseWelcomePrime } from '@shell/config/release-welcome';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

defineProps({
  prime: {
    type:     Object as PropType<ReleaseWelcomePrime>,
    required: true
  }
});

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <PrimeCard
    aria-labelledby="release-welcome-prime-title"
    data-testid="release-welcome-prime"
  >
    <h3 id="release-welcome-prime-title">
      {{ prime.title }}
    </h3>
    <p>{{ prime.description }}</p>
    <ul class="products">
      <li
        v-for="product in prime.products"
        :key="product"
      >
        <RcTag type="inactive">
          {{ product }}
        </RcTag>
      </li>
    </ul>
    <RcButton
      class="cta"
      variant="primary"
      size="small"
      :href="prime.cta.link"
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-testid="release-welcome-prime-explore"
    >
      {{ prime.cta.action }}
      <span class="sr-only">{{ t('releaseWelcome.newTab') }}</span>
    </RcButton>
  </PrimeCard>
</template>

<style lang="scss" scoped>
.products {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  // Pill shaped chips in the theme font
  :deep(.rc-tag) {
    padding: 6px 12px;
    border-radius: 100px;
    font-family: inherit;
    font-size: 12px;
    line-height: 16px;
  }
}

.cta {
  margin-top: 4px;
  font-weight: 600;
}
</style>
