<script>
import { STATES_ENUM, STATES } from '@shell/plugins/dashboard-store/resource-class';

/**
 * State Reference Page
 *
 * Displays all states defined in resource-class.js (STATES_ENUM + STATES)
 * with their enum key, value, label, and color — useful for verifying
 * state rendering across the Dashboard.
 *
 * Source: shell/plugins/dashboard-store/resource-class.js#L170
 */

const COLOR_MAP = {
  success: '#27AE60',
  error:   '#E74C3C',
  warning: '#F39C12',
  info:    '#3498DB',
  darker:  '#8E8E8E',
};

export default {
  name: 'StateReference',

  data() {
    const rows = Object.entries(STATES_ENUM).map(([enumKey, enumValue]) => {
      const stateConfig = STATES[enumValue] || {};

      return {
        enumKey,
        enumValue,
        label:        stateConfig.label || enumValue,
        color:        stateConfig.color || 'warning',
        icon:         stateConfig.icon || 'x',
        compoundIcon: stateConfig.compoundIcon || '',
      };
    });

    return {
      rows,
      COLOR_MAP,
      sortKey:   'enumKey',
      sortOrder: 'asc',
      filter:    '',
    };
  },

  computed: {
    filteredRows() {
      if (!this.filter) {
        return this.sortedRows;
      }
      const f = this.filter.toLowerCase();

      return this.sortedRows.filter((r) => {
        return r.enumKey.toLowerCase().includes(f) ||
          r.enumValue.toLowerCase().includes(f) ||
          r.label.toLowerCase().includes(f) ||
          r.color.toLowerCase().includes(f);
      });
    },

    sortedRows() {
      const key = this.sortKey;
      const order = this.sortOrder === 'asc' ? 1 : -1;

      return [...this.rows].sort((a, b) => {
        const aVal = (a[key] || '').toLowerCase();
        const bVal = (b[key] || '').toLowerCase();

        if (aVal < bVal) {
          return -1 * order;
        }
        if (aVal > bVal) {
          return 1 * order;
        }

        return 0;
      });
    },

    colorGroups() {
      const groups = {};

      for (const row of this.rows) {
        if (!groups[row.color]) {
          groups[row.color] = [];
        }
        groups[row.color].push(row);
      }

      return groups;
    },

    colorSummary() {
      return Object.entries(this.colorGroups)
        .map(([color, items]) => ({ color, count: items.length }))
        .sort((a, b) => b.count - a.count);
    },
  },

  methods: {
    hexForColor(color) {
      return COLOR_MAP[color] || '#999';
    },

    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },

    sortIndicator(key) {
      if (this.sortKey !== key) {
        return '';
      }

      return this.sortOrder === 'asc' ? ' ▲' : ' ▼';
    },
  },
};
</script>

<template>
  <div class="state-reference">
    <h1 class="mb-10">
      <i class="icon icon-dot-open mr-10" /> State Reference
    </h1>
    <p class="page-subtitle mb-20">
      All <strong>{{ rows.length }}</strong> states defined in
      <code>shell/plugins/dashboard-store/resource-class.js</code> —
      STATES_ENUM keys, values, display labels, and assigned colors.
    </p>

    <!-- Color Summary -->
    <div class="color-summary mb-20">
      <div
        v-for="cs in colorSummary"
        :key="cs.color"
        class="color-chip"
      >
        <span
          class="color-dot"
          :style="{ backgroundColor: hexForColor(cs.color) }"
        />
        <span class="color-name">{{ cs.color }}</span>
        <span class="color-count">({{ cs.count }})</span>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-row mb-15">
      <input
        v-model="filter"
        type="text"
        placeholder="Filter by enum, value, label, or color..."
        class="filter-input"
      >
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="state-table">
        <thead>
          <tr>
            <th
              class="sortable"
              @click="toggleSort('enumKey')"
            >
              Enum Key{{ sortIndicator('enumKey') }}
            </th>
            <th
              class="sortable"
              @click="toggleSort('enumValue')"
            >
              Value{{ sortIndicator('enumValue') }}
            </th>
            <th
              class="sortable"
              @click="toggleSort('label')"
            >
              Label{{ sortIndicator('label') }}
            </th>
            <th
              class="sortable"
              @click="toggleSort('color')"
            >
              Color{{ sortIndicator('color') }}
            </th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in filteredRows"
            :key="row.enumKey"
          >
            <td class="enum-key">
              {{ row.enumKey }}
            </td>
            <td class="enum-value">
              <code>{{ row.enumValue }}</code>
            </td>
            <td>{{ row.label }}</td>
            <td>
              <span class="color-badge-cell">
                <span
                  class="color-dot-sm"
                  :style="{ backgroundColor: hexForColor(row.color) }"
                />
                {{ row.color }}
              </span>
            </td>
            <td>
              <span
                class="state-badge"
                :style="{
                  backgroundColor: hexForColor(row.color) + '20',
                  color: hexForColor(row.color),
                  borderColor: hexForColor(row.color)
                }"
              >
                {{ row.label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="footer-note mt-20">
      Colors resolve to CSS classes: <code>text-{color}</code> / <code>bg-{color}</code>.
      Default color when state is unknown: <code>warning</code>.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.state-reference {
  padding: 0 20px;

  h1 {
    display: flex;
    align-items: center;
  }

  .page-subtitle {
    color: var(--text-muted);
    font-size: 1.05em;
    line-height: 1.5;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }
  }

  .color-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--box-bg);
  }

  .color-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9em;

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .color-name {
      font-weight: 600;
      text-transform: capitalize;
    }

    .color-count {
      color: var(--text-muted);
    }
  }

  .filter-row {
    .filter-input {
      width: 100%;
      max-width: 400px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      background: var(--body-bg);
      color: var(--body-text);
      font-size: 0.9em;

      &::placeholder {
        color: var(--text-muted);
      }
    }
  }

  .table-container {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    overflow: auto;
    max-height: 70vh;
  }

  .state-table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--box-bg);
      font-weight: 600;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      position: sticky;
      top: 0;
      z-index: 1;

      &.sortable {
        cursor: pointer;
        user-select: none;

        &:hover {
          color: var(--link);
        }
      }
    }

    tbody tr:hover {
      background: var(--body-bg);
    }

    .enum-key {
      font-family: monospace;
      font-size: 0.85em;
      color: var(--text-muted);
    }

    .enum-value code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }

    .color-badge-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .color-dot-sm {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .state-badge {
      display: inline-block;
      padding: 3px 10px;
      border: 1px solid;
      border-radius: 12px;
      font-size: 0.82em;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .footer-note {
    color: var(--text-muted);
    font-size: 0.85em;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.9em;
    }
  }
}
</style>
