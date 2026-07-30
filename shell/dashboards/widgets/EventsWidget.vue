<script setup lang="ts">
import EventsTable from '@shell/pages/c/_cluster/explorer/EventsTable.vue';
</script>

<template>
  <div class="events-widget">
    <EventsTable data-testid="events-widget-table" />
  </div>
</template>

<style lang="scss" scoped>
.events-widget {
  height: 100%;
  overflow: auto;
  padding: 0 12px 12px;

  :deep(table) {
    font-size: 13px;
  }
}
</style>
