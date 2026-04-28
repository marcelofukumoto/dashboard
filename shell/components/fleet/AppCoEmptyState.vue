<script>
import { BadgeState } from '@components/BadgeState';
import { RcIcon } from '@components/RcIcon';

export default {
  name: 'AppCoEmptyState',

  components: { BadgeState, RcIcon },

  props: {
    title: {
      type:     String,
      required: true,
    },
    badgeState: {
      type:    Object,
      default: null,
    },
    loading: {
      type:    Boolean,
      default: false,
    },
  },
};
</script>

<template>
  <div class="appco-empty-state">
    <h1 class="appco-empty-state-title">
      {{ title }}
      <RcIcon
        v-if="loading"
        type="spinner"
        size="large"
      />
    </h1>
    <div :class="['appco-empty-state-body', { 'has-badge': badgeState }]">
      <BadgeState
        v-if="badgeState"
        :color="badgeState.stateBackground"
        :label="badgeState.stateDisplay"
      />
      <p>
        <slot />
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-empty-state {
  text-align: center;
  padding: 56px 56px;

  .appco-empty-state-title {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .appco-empty-state-body {
    &.has-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    p {
      font-size: 16px;
      line-height: 32px;
    }
  }
}
</style>
