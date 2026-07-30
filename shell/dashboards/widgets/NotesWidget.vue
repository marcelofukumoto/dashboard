<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps<{ config: Record<string, any> }>();

const store = useStore();
const { t } = useI18n(store);

const lines = computed<string[]>(() => (props.config?.body || '').split('\n'));
const hasBody = computed(() => !!(props.config?.body || '').trim());
</script>

<template>
  <div class="notes-widget">
    <p
      v-if="!hasBody"
      class="text-muted"
    >
      {{ t('dashboardWidgets.notes.empty') }}
    </p>
    <p
      v-for="(line, i) in lines"
      v-else
      :key="i"
      class="note-line"
    >
      {{ line }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.notes-widget {
  height: 100%;
  overflow: auto;
  padding: 4px 16px 16px;
  white-space: pre-wrap;

  .note-line {
    min-height: 1em;
  }
}
</style>
