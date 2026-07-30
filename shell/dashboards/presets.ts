import {
  MANAGEMENT, NAMESPACE, NODE, POD, SERVICE, WORKLOAD_TYPES
} from '@shell/config/types';
import { CustomDashboard, DashboardContext } from '@shell/types/dashboards';
import {
  WIDGET_CLUSTERS, WIDGET_EVENTS, WIDGET_NOTES, WIDGET_RESOURCE_SUMMARY, WIDGET_RESOURCE_TABLE
} from '@shell/dashboards/built-in';

/** Out-of-the-box dashboards. `role` is used to pick which one a new user lands on */
export interface DashboardPreset {
  id: string;
  nameKey: string;
  context: DashboardContext;
  role: 'admin' | 'user';
  widgets: Omit<CustomDashboard['widgets'][number], 'id'>[];
}

export const PRESETS: DashboardPreset[] = [
  {
    id: 'home-cluster-admin',
    nameKey: 'customDashboard.presets.clusterAdmin',
    context: 'home',
    role: 'admin',
    widgets: [
      {
        type: WIDGET_CLUSTERS, x: 0, y: 0, w: 8, h: 5, config: { limit: 10 }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 8, y: 0, w: 4, h: 3, config: { resource: MANAGEMENT.CLUSTER }
      },
      {
        type: WIDGET_NOTES, x: 8, y: 3, w: 4, h: 2, config: { body: 'Drop widgets from the palette to build your own view of Rancher.' }
      },
    ],
  },
  {
    id: 'home-app-developer',
    nameKey: 'customDashboard.presets.appDeveloper',
    context: 'home',
    role: 'user',
    widgets: [
      {
        type: WIDGET_CLUSTERS, x: 0, y: 0, w: 6, h: 5, config: { limit: 10 }
      },
      {
        type: WIDGET_NOTES, x: 6, y: 0, w: 6, h: 5, config: { body: 'Your apps at a glance.\n\nAdd resource summaries and tables for the workloads you care about.' }
      },
    ],
  },
  {
    id: 'cluster-cluster-admin',
    nameKey: 'customDashboard.presets.clusterAdmin',
    context: 'cluster',
    role: 'admin',
    widgets: [
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 0, y: 0, w: 3, h: 3, config: { resource: NODE }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 3, y: 0, w: 3, h: 3, config: { resource: NAMESPACE }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 6, y: 0, w: 3, h: 3, config: { resource: WORKLOAD_TYPES.DEPLOYMENT }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 9, y: 0, w: 3, h: 3, config: { resource: POD }
      },
      {
        type: WIDGET_EVENTS, x: 0, y: 3, w: 12, h: 6, config: {}
      },
    ],
  },
  {
    id: 'cluster-app-developer',
    nameKey: 'customDashboard.presets.appDeveloper',
    context: 'cluster',
    role: 'user',
    widgets: [
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 0, y: 0, w: 4, h: 3, config: { resource: WORKLOAD_TYPES.DEPLOYMENT }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 4, y: 0, w: 4, h: 3, config: { resource: POD }
      },
      {
        type: WIDGET_RESOURCE_SUMMARY, x: 8, y: 0, w: 4, h: 3, config: { resource: SERVICE }
      },
      {
        type: WIDGET_RESOURCE_TABLE,
        x: 0,
        y: 3,
        w: 12,
        h: 7,
        config: {
          resource: POD, rowsPerPage: 8, columns: 5, search: true
        }
      },
    ],
  },
];

export function presetsForContext(context: DashboardContext): DashboardPreset[] {
  return PRESETS.filter((p) => p.context === context);
}
