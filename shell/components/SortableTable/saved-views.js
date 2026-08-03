import { get } from '@shell/utils/object';
import { downloadFile } from '@shell/utils/download';
import { RESOURCE_TABLE_VIEWS } from '@shell/store/prefs';

/**
 * Saved Views mixin for the SortableTable.
 *
 * GitHub Projects-style saved views: capture the current advanced filters, column
 * visibility and sort into a named, reusable view. Views are persisted per resource
 * type as a user preference (so they follow the user across sessions and devices) and
 * can be shared with other users via a link that encodes the view state.
 *
 * This leans on the existing advanced-filtering / column-config / sorting machinery
 * that already lives in the SortableTable rather than introducing a parallel one.
 */
export default {
  props: {
    /**
     * Show the saved-views bar (+ export) above the table.
     */
    hasSavedViews: {
      type:    Boolean,
      default: false
    },
    /**
     * Key that scopes saved views to a resource type, e.g. the schema id ('pod').
     * Views are only shared between tables that use the same key.
     */
    viewStorageKey: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { activeViewId: null };
  },

  computed: {
    savedViews() {
      const all = this.$store.getters['prefs/get'](RESOURCE_TABLE_VIEWS) || {};

      return all[this.viewStorageKey] || [];
    },
  },

  mounted() {
    // If a shared view link was opened, apply it once the table has settled.
    if (this.hasSavedViews && this.$route?.query?.view) {
      try {
        const state = this.decodeViewState(this.$route.query.view);

        this.$nextTick(() => this.applyViewState(state));
      } catch (e) {
        // Ignore malformed shared views
      }
    }
  },

  methods: {
    // ---- persistence ------------------------------------------------------
    persistViews(views) {
      const all = { ...(this.$store.getters['prefs/get'](RESOURCE_TABLE_VIEWS) || {}) };

      all[this.viewStorageKey] = views;
      this.$store.dispatch('prefs/set', { key: RESOURCE_TABLE_VIEWS, value: all });
    },

    // ---- view state capture / apply --------------------------------------
    captureViewState() {
      const columns = (this.columnOptions || [])
        .filter((c) => c.isTableOption)
        .map((c) => ({
          name: c.name, label: c.label, isColVisible: c.isColVisible
        }));

      return {
        filters:    JSON.parse(JSON.stringify(this.advancedFilteringValues || [])),
        columns,
        group:      this.group || '',
        sortBy:     this.sortBy,
        descending: this.descending,
      };
    },

    applyViewState(state) {
      if (!state) {
        return;
      }

      // Advanced filters
      this.advancedFilteringValues = JSON.parse(JSON.stringify(state.filters || []));
      this.eventualSearchQuery = this.advancedFilteringValues;

      // Make sure column options are up to date, then apply saved visibility
      this.updateColsOptions();
      (state.columns || []).forEach((sc) => {
        const opt = this.columnOptions.find((c) => c.name === sc.name && c.label === sc.label);

        if (opt) {
          opt.isColVisible = sc.isColVisible;
        }
      });

      // Sort
      if (state.sortBy !== undefined && state.sortBy !== null) {
        this.changeSort(state.sortBy, !!state.descending);
      }

      // Grouping is owned by the parent (ResourceTable), so emit up
      if (state.group !== undefined) {
        this.$emit('group-value-change', state.group);
      }
    },

    // ---- saved-view actions (wired to <SavedViews>) ----------------------
    onSaveView(name) {
      const trimmed = (name || '').trim();

      if (!trimmed) {
        return;
      }

      const view = {
        id:    `${ this.viewStorageKey }-${ Date.now() }`,
        name:  trimmed,
        state: this.captureViewState(),
      };

      this.persistViews([...this.savedViews, view]);
      this.activeViewId = view.id;
    },

    onApplyView(view) {
      if (!view) {
        // "All" tab - clear filters back to a neutral view
        this.applyViewState({ filters: [], columns: [] });
        this.activeViewId = null;

        return;
      }

      this.applyViewState(view.state);
      this.activeViewId = view.id;
    },

    onDeleteView(view) {
      this.persistViews(this.savedViews.filter((v) => v.id !== view.id));

      if (this.activeViewId === view.id) {
        this.activeViewId = null;
      }
    },

    onShareView(view) {
      const state = view ? view.state : this.captureViewState();
      const url = new URL(window.location.href);

      url.searchParams.set('view', this.encodeViewState(state));
      if (view?.name) {
        url.searchParams.set('viewName', view.name);
      }

      if (navigator.clipboard) {
        navigator.clipboard.writeText(url.toString());
      }
    },

    encodeViewState(state) {
      return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    },

    decodeViewState(str) {
      return JSON.parse(decodeURIComponent(escape(atob(str))));
    },

    // ---- export ----------------------------------------------------------
    exportColumns() {
      // Prefer the columns the user has chosen to show; fall back to all columns
      const cols = (this.columns || []).filter((c) => c.isColVisible !== false && (c.label || c.labelKey) && c.name !== 'Actions');

      return cols.map((c) => ({
        label: c.labelKey ? this.t(c.labelKey) : (c.label || c.name),
        value: typeof c.value === 'string' ? c.value : (typeof c.name === 'string' ? c.name : null),
      })).filter((c) => c.value);
    },

    exportCellValue(row, path) {
      try {
        const val = get(row, path);

        if (val === undefined || val === null) {
          return '';
        }

        return typeof val === 'object' ? JSON.stringify(val) : `${ val }`;
      } catch (e) {
        return '';
      }
    },

    csvEscape(value) {
      const s = (value === undefined || value === null) ? '' : `${ value }`;

      return (/[",\n]/).test(s) ? `"${ s.replace(/"/g, '""') }"` : s;
    },

    onExport({ scope = 'all', format = 'csv' } = {}) {
      const rows = scope === 'page' ? (this.pagedRows || []) : (this.filteredRows || this.arrangedRows || this.rows || []);
      const cols = this.exportColumns();
      const base = this.viewStorageKey || 'resources';

      if (format === 'json') {
        const data = rows.map((row) => {
          const obj = {};

          cols.forEach((c) => {
            obj[c.label] = this.exportCellValue(row, c.value);
          });

          return obj;
        });

        downloadFile(`${ base }-export.json`, JSON.stringify(data, null, 2), 'application/json');

        return;
      }

      const header = cols.map((c) => this.csvEscape(c.label)).join(',');
      const lines = rows.map((row) => cols.map((c) => this.csvEscape(this.exportCellValue(row, c.value))).join(','));

      downloadFile(`${ base }-export.csv`, [header, ...lines].join('\n'), 'text/csv;charset=utf-8');
    },
  },
};
