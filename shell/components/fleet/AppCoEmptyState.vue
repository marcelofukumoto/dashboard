<script>
export default {
  name: 'AppCoEmptyState',

  props: {
    title: {
      type:     String,
      required: true,
    },
  },
};
</script>

<template>
  <div class="appco-empty-state">
    <h3>{{ title }}</h3>
    <p>
      <slot />
    </p>
  </div>
</template>

<style lang="scss" scoped>
.appco-empty-state {
  text-align: center;
  padding: 72px 0;

  h3 {
    margin-bottom: 8px;
  }

  p {
    color: var(--input-label);
  }
}
</style>
