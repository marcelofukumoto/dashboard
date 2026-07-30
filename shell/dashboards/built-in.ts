import { registerDashboardWidget } from '@shell/dashboards/registry';
import { labelForType, resourceTypeOptions } from '@shell/dashboards/widget-utils';
import ClusterListWidget from '@shell/dashboards/widgets/ClusterListWidget.vue';
import EventsWidget from '@shell/dashboards/widgets/EventsWidget.vue';
import NotesWidget from '@shell/dashboards/widgets/NotesWidget.vue';
import ResourceSummaryWidget from '@shell/dashboards/widgets/ResourceSummaryWidget.vue';
import ResourceTableWidget from '@shell/dashboards/widgets/ResourceTableWidget.vue';

export const WIDGET_RESOURCE_SUMMARY = 'resource-summary';
export const WIDGET_RESOURCE_TABLE = 'resource-table';
export const WIDGET_EVENTS = 'events';
export const WIDGET_CLUSTERS = 'clusters';
export const WIDGET_NOTES = 'notes';

registerDashboardWidget({
  id: WIDGET_RESOURCE_SUMMARY,
  labelKey: 'dashboardWidgets.resourceSummary.label',
  descriptionKey: 'dashboardWidgets.resourceSummary.description',
  icon: 'icon-dashboard',
  component: ResourceSummaryWidget,
  title: (config, { store, context }) => (config.resource ? labelForType(store, context, config.resource) : undefined),
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  configFields: [
    {
      name: 'resource',
      labelKey: 'dashboardWidgets.fields.resource',
      type: 'select',
      options: resourceTypeOptions,
    },
  ],
});

registerDashboardWidget({
  id: WIDGET_RESOURCE_TABLE,
  labelKey: 'dashboardWidgets.resourceTable.label',
  descriptionKey: 'dashboardWidgets.resourceTable.description',
  icon: 'icon-list-flat',
  component: ResourceTableWidget,
  title: (config, { store, context }) => (config.resource ? labelForType(store, context, config.resource) : undefined),
  defaultSize: { w: 6, h: 6 },
  minSize: { w: 3, h: 3 },
  configFields: [
    {
      name: 'resource',
      labelKey: 'dashboardWidgets.fields.resource',
      type: 'select',
      options: resourceTypeOptions,
    },
    {
      name: 'rowsPerPage',
      labelKey: 'dashboardWidgets.fields.rowsPerPage',
      type: 'number',
      default: 5,
    },
    {
      name: 'columns',
      labelKey: 'dashboardWidgets.fields.columns',
      type: 'number',
      default: 0,
    },
    {
      name: 'search',
      labelKey: 'dashboardWidgets.fields.search',
      type: 'boolean',
      default: false,
    },
  ],
});

registerDashboardWidget({
  id: WIDGET_EVENTS,
  labelKey: 'dashboardWidgets.events.label',
  descriptionKey: 'dashboardWidgets.events.description',
  icon: 'icon-notifier',
  component: EventsWidget,
  contexts: ['cluster'],
  defaultSize: { w: 12, h: 6 },
  minSize: { w: 4, h: 4 },
});

registerDashboardWidget({
  id: WIDGET_CLUSTERS,
  labelKey: 'dashboardWidgets.clusters.label',
  descriptionKey: 'dashboardWidgets.clusters.description',
  icon: 'icon-globe',
  component: ClusterListWidget,
  contexts: ['home'],
  defaultSize: { w: 6, h: 5 },
  minSize: { w: 3, h: 2 },
  configFields: [
    {
      name: 'limit',
      labelKey: 'dashboardWidgets.fields.limit',
      type: 'number',
      default: 10,
    },
    {
      name: 'unhealthyOnly',
      labelKey: 'dashboardWidgets.fields.unhealthyOnly',
      type: 'boolean',
      default: false,
    },
  ],
});

registerDashboardWidget({
  id: WIDGET_NOTES,
  labelKey: 'dashboardWidgets.notes.label',
  descriptionKey: 'dashboardWidgets.notes.description',
  icon: 'icon-file',
  component: NotesWidget,
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  configFields: [
    {
      name: 'body',
      labelKey: 'dashboardWidgets.fields.body',
      type: 'text',
    },
  ],
});
