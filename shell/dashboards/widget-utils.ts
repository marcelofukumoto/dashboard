import { COUNT } from '@shell/config/types';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { colorToCountName } from '@shell/components/ResourceSummary.vue';
import { DashboardContext, DashboardWidgetOption, DashboardWidgetOptionsContext } from '@shell/types/dashboards';

/**
 * Which store a dashboard in this context reads its resources from.
 */
export function storeForContext(context: DashboardContext): string {
  return context === 'home' ? 'management' : 'cluster';
}

export function countsForContext(store: any, context: DashboardContext): Record<string, any> {
  const inStore = storeForContext(context);

  return store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
}

export function labelForType(store: any, context: DashboardContext, type: string, count = 2): string {
  const inStore = storeForContext(context);
  const schema = store.getters[`${ inStore }/schemaFor`](type);

  return schema ? store.getters['type-map/labelFor'](schema, count) : type;
}

export interface ResourceSummaryCounts {
  total: number;
  useful: number;
  warningCount: number;
  errorCount: number;
}

/**
 * The same healthy/warning/error breakdown the cluster dashboard's resource summary
 * shows, but read from whichever store this dashboard's context uses.
 */
export function summaryCounts(store: any, context: DashboardContext, type: string): ResourceSummaryCounts | null {
  const summary = countsForContext(store, context)?.[type]?.summary;

  if (!summary) {
    return null;
  }

  const counts: ResourceSummaryCounts = {
    total: summary.count || 0,
    useful: summary.count || 0,
    warningCount: 0,
    errorCount: 0,
  };

  Object.entries(summary.states || {}).forEach(([state, count]) => {
    const countName = colorToCountName(colorForState(state)) as keyof ResourceSummaryCounts;

    counts.useful -= count as number;
    counts[countName] += count as number;
  });

  return counts;
}

/**
 * Every resource type that actually exists in the current context, so widget config
 * only ever offers the user something they can really show.
 */
export function resourceTypeOptions({ store, context }: DashboardWidgetOptionsContext): DashboardWidgetOption[] {
  const inStore = storeForContext(context);
  const counts = countsForContext(store, context);

  return Object.keys(counts)
    .filter((type) => !!store.getters[`${ inStore }/schemaFor`](type))
    .map((type) => ({
      label: labelForType(store, context, type),
      value: type,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
