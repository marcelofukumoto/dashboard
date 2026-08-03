<script>
/**
 * GitHub Projects-style saved-views bar for the SortableTable.
 *
 * Renders a row of view "tabs" (plus an "All" reset tab), a Save-view control and an
 * Export menu. All state lives in the parent (SortableTable via the saved-views mixin);
 * this component is purely presentational and communicates through events.
 */
export default {
  emits: ['apply', 'save', 'delete', 'share', 'export'],

  props: {
    views: {
      type:    Array,
      default: () => []
    },
    activeViewId: {
      type:    String,
      default: null
    },
  },

  data() {
    return {
      adding:      false,
      newViewName: '',
      menuForId:   null,
      exportOpen:  false,
      copiedId:    null,
    };
  },

  methods: {
    startAdd() {
      this.adding = true;
      this.newViewName = '';
      this.$nextTick(() => this.$refs.nameInput?.focus());
    },

    confirmAdd() {
      if (this.newViewName.trim()) {
        this.$emit('save', this.newViewName.trim());
      }
      this.adding = false;
      this.newViewName = '';
    },

    cancelAdd() {
      this.adding = false;
      this.newViewName = '';
    },

    toggleMenu(id) {
      this.menuForId = this.menuForId === id ? null : id;
    },

    share(view) {
      this.$emit('share', view);
      this.copiedId = view ? view.id : '__current';
      this.menuForId = null;
      setTimeout(() => {
        if (this.copiedId === (view ? view.id : '__current')) {
          this.copiedId = null;
        }
      }, 2000);
    },

    remove(view) {
      this.menuForId = null;
      this.$emit('delete', view);
    },

    doExport(scope, format) {
      this.exportOpen = false;
      this.$emit('export', { scope, format });
    },
  },
};
</script>

<template>
  <div class="saved-views">
    <div class="views-tabs">
      <button
        type="button"
        class="view-tab"
        :class="{ active: !activeViewId }"
        @click="$emit('apply', null)"
      >
        {{ t('sortableTable.savedViews.allItems') }}
      </button>

      <div
        v-for="view in views"
        :key="view.id"
        class="view-tab-wrap"
      >
        <button
          type="button"
          class="view-tab"
          :class="{ active: activeViewId === view.id }"
          @click="$emit('apply', view)"
        >
          {{ view.name }}
        </button>
        <button
          type="button"
          class="view-menu-btn"
          :aria-label="view.name"
          @click.stop="toggleMenu(view.id)"
        >
          <i class="icon icon-chevron-down" />
        </button>
        <div
          v-if="menuForId === view.id"
          class="view-menu"
        >
          <button
            type="button"
            @click="share(view)"
          >
            <i class="icon icon-copy" /> {{ t('sortableTable.savedViews.share') }}
          </button>
          <button
            type="button"
            @click="remove(view)"
          >
            <i class="icon icon-delete" /> {{ t('sortableTable.savedViews.delete') }}
          </button>
        </div>
        <span
          v-if="copiedId === view.id"
          class="copied-hint"
        >{{ t('sortableTable.savedViews.linkCopied') }}</span>
      </div>

      <div class="add-view">
        <template v-if="adding">
          <input
            ref="nameInput"
            v-model="newViewName"
            type="text"
            class="input-sm view-name-input"
            :placeholder="t('sortableTable.savedViews.namePlaceholder')"
            @keyup.enter="confirmAdd"
            @keyup.esc="cancelAdd"
          >
          <button
            type="button"
            class="btn btn-sm role-primary"
            @click="confirmAdd"
          >
            {{ t('sortableTable.savedViews.saveConfirm') }}
          </button>
          <button
            type="button"
            class="btn btn-sm role-secondary"
            @click="cancelAdd"
          >
            {{ t('sortableTable.savedViews.cancel') }}
          </button>
        </template>
        <button
          v-else
          v-clean-tooltip="t('sortableTable.savedViews.saveTooltip')"
          type="button"
          class="view-tab add-tab"
          @click="startAdd"
        >
          <i class="icon icon-plus" /> {{ t('sortableTable.savedViews.save') }}
        </button>
      </div>
    </div>

    <div class="views-actions">
      <div class="export-group">
        <button
          type="button"
          class="btn btn-sm role-secondary"
          @click.stop="exportOpen = !exportOpen"
        >
          <i class="icon icon-download" /> {{ t('sortableTable.savedViews.export.label') }}
          <i class="icon icon-chevron-down" />
        </button>
        <div
          v-if="exportOpen"
          class="export-menu"
        >
          <button
            type="button"
            @click="doExport('all', 'csv')"
          >
            {{ t('sortableTable.savedViews.export.csvAll') }}
          </button>
          <button
            type="button"
            @click="doExport('page', 'csv')"
          >
            {{ t('sortableTable.savedViews.export.csvPage') }}
          </button>
          <button
            type="button"
            @click="doExport('all', 'json')"
          >
            {{ t('sortableTable.savedViews.export.jsonAll') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.saved-views {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;

  .views-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-wrap: wrap;
  }

  .view-tab-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .view-tab {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--body-text);
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;

    &:hover {
      color: var(--primary);
    }

    &.active {
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    &.add-tab {
      color: var(--primary);
      opacity: 0.9;
    }
  }

  .view-menu-btn {
    background: transparent;
    border: none;
    color: var(--body-text);
    cursor: pointer;
    padding: 4px;
    margin-left: -6px;
    font-size: 11px;

    &:hover { color: var(--primary); }
  }

  .view-menu, .export-menu {
    position: absolute;
    z-index: 10;
    top: 100%;
    background-color: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    min-width: 190px;
    padding: 4px 0;

    button {
      display: block;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      color: var(--body-text);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;

      &:hover { background-color: var(--accent-btn); }

      .icon { margin-right: 6px; }
    }
  }

  .copied-hint {
    margin-left: 6px;
    font-size: 12px;
    color: var(--success);
  }

  .add-view {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .view-name-input {
    width: 160px;
  }

  .views-actions {
    display: flex;
    align-items: center;
  }

  .export-group {
    position: relative;

    .export-menu {
      right: 0;
    }
  }
}
</style>
