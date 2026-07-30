import { ExtensionPoint, DashboardWidgetLocation } from '@shell/core/types';
import {
  DashboardContext,
  DashboardWidgetDefinition,
  DashboardWidgetInstance,
} from '@shell/types/dashboards';
import { randomStr } from '@shell/utils/string';
import { firstFreeSlot } from '@shell/dashboards/layout';

const widgets: Record<string, DashboardWidgetDefinition> = {};

/**
 * Register a widget that users can drop onto a configurable dashboard.
 *
 * Used by the shell for the built in widgets, and by the extension API
 * (`plugin.addDashboardWidget`) for widgets supplied by extensions.
 */
export function registerDashboardWidget(definition: DashboardWidgetDefinition): void {
  widgets[definition.id] = definition;
}

/**
 * Widgets contributed by extensions. These aren't in the static registry because
 * extensions load (and unload) after the shell has booted.
 */
function extensionWidgets($extension: any): DashboardWidgetDefinition[] {
  try {
    return $extension?.getUIConfig?.(ExtensionPoint.DASHBOARD_WIDGET, DashboardWidgetLocation.DASHBOARD) || [];
  } catch (e) {
    return [];
  }
}

export function getDashboardWidget(id: string, $extension?: any): DashboardWidgetDefinition | undefined {
  return widgets[id] || extensionWidgets($extension).find((w) => w.id === id);
}

/**
 * Every widget available in the given context, built in ones first.
 */
export function availableDashboardWidgets(context: DashboardContext, $extension?: any): DashboardWidgetDefinition[] {
  const all = [...Object.values(widgets), ...extensionWidgets($extension)];

  return all.filter((w) => !w.contexts || w.contexts.includes(context));
}

/**
 * Build a placed widget from its definition, filling in the defaults for any config
 * field the widget declares.
 */
export function createWidgetInstance(
  definition: DashboardWidgetDefinition,
  existing: DashboardWidgetInstance[] = [],
  position?: { x: number, y: number }
): DashboardWidgetInstance {
  const w = definition.defaultSize?.w || 4;
  const h = definition.defaultSize?.h || 4;
  const config: Record<string, any> = {};

  (definition.configFields || []).forEach((field) => {
    if (field.default !== undefined) {
      config[field.name] = field.default;
    }
  });

  return {
    id: `w-${ randomStr(8).toLowerCase() }`,
    type: definition.id,
    ...(position || firstFreeSlot(existing, w, h)),
    w,
    h,
    config,
  };
}
