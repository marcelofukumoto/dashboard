import { Component } from 'vue';

/**
 * Where a configurable dashboard is being shown. Widgets can opt in to one or
 * more contexts - e.g. the cluster list widget only makes sense on the home page,
 * the events widget only makes sense within a cluster.
 */
export const DASHBOARD_CONTEXT_HOME = 'home';
export const DASHBOARD_CONTEXT_CLUSTER = 'cluster';

export type DashboardContext = 'home' | 'cluster';

/**
 * Context handed to a widget's config field when it needs to build its list of
 * options dynamically (e.g. the resource types that exist in this cluster).
 */
export interface DashboardWidgetOptionsContext {
  store: any;
  context: DashboardContext;
}

export interface DashboardWidgetOption {
  label: string;
  value: string;
}

/**
 * A single configurable property of a widget. The dashboard renders the editor for
 * these, so a widget (including one from an extension) doesn't need to supply any UI
 * of its own to become configurable.
 */
export interface DashboardWidgetConfigField {
  name: string;
  label?: string;
  labelKey?: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'select';
  default?: any;
  placeholder?: string;
  /** For `select` fields - either a static list or a function of the current context */
  options?: DashboardWidgetOption[] | ((ctx: DashboardWidgetOptionsContext) => DashboardWidgetOption[]);
}

export interface DashboardWidgetSize {
  w: number;
  h: number;
}

/**
 * Definition of a dashboard widget. Built in widgets are registered by the shell,
 * extensions register these via `plugin.addDashboardWidget(...)`.
 */
export interface DashboardWidgetDefinition {
  /** Unique id, stored against each placed widget. Extensions should namespace theirs */
  id: string;
  label?: string;
  labelKey?: string;
  description?: string;
  descriptionKey?: string;
  /** Icon class, e.g. `icon-list-flat` */
  icon?: string;
  component: Component | (() => Promise<any>);
  /** Title to show for a placed widget, when it depends on how the widget is configured */
  title?: (config: Record<string, any>, ctx: DashboardWidgetOptionsContext) => string | undefined;
  /** Contexts this widget can be added to. Omit for 'anywhere' */
  contexts?: DashboardContext[];
  defaultSize?: DashboardWidgetSize;
  minSize?: DashboardWidgetSize;
  configFields?: DashboardWidgetConfigField[];
  /** Name of the extension that supplied the widget, shown in the palette */
  source?: string;
}

/** A widget placed on a dashboard - position, size and its configuration */
export interface DashboardWidgetInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Overrides the widget's own title when set */
  title?: string;
  config: Record<string, any>;
}

export interface CustomDashboard {
  id: string;
  name: string;
  context: DashboardContext;
  /** Seeded from a preset - can be reset back to its original layout */
  preset?: string;
  widgets: DashboardWidgetInstance[];
}

/**
 * Shape of the `custom-dashboards` user preference.
 */
export interface CustomDashboardPrefs {
  dashboards: CustomDashboard[];
  /** Dashboard the user last had selected, per context */
  current: Partial<Record<DashboardContext, string>>;
  /** Dashboard the user has pinned as their default, per context */
  default: Partial<Record<DashboardContext, string>>;
  /** Contexts that have already been seeded with the out-of-the-box dashboards */
  seeded?: DashboardContext[];
}
