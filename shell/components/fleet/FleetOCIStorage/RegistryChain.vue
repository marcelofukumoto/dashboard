<script setup lang="ts">
withDefaults(defineProps<{
  registries: string[];
  active?: string | null;
}>(), { active: null });
</script>

<template>
  <span class="registry-chain">
    <template
      v-for="(name, index) in registries"
      :key="name"
    >
      <i
        v-if="index > 0"
        class="icon icon-chevron-right separator"
        aria-hidden="true"
      />
      <span :class="{ 'is-active': name === active }">{{ name }}</span>
    </template>
  </span>
</template>

<style lang="scss" scoped>
.registry-chain {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;

  .separator {
    font-size: 10px;
    color: var(--muted);
  }

  .is-active {
    font-weight: 600;
  }
}
</style>
