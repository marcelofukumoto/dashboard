import { computed, ref, Ref } from 'vue';
import { CUSTOM_DASHBOARDS } from '@shell/store/prefs';
import { isAdminUser } from '@shell/store/type-map';
import { randomStr } from '@shell/utils/string';
import { clone } from '@shell/utils/object';
import { CustomDashboard, CustomDashboardPrefs, DashboardContext, DashboardWidgetInstance } from '@shell/types/dashboards';
import { presetsForContext } from '@shell/dashboards/presets';

/** Pseudo dashboard id for the page's original, non-configurable content */
export const CLASSIC_DASHBOARD = '__classic__';

function emptyPrefs(): CustomDashboardPrefs {
  return {
    dashboards: [], current: {}, default: {}, seeded: []
  };
}

function normalize(value: any): CustomDashboardPrefs {
  const prefs = { ...emptyPrefs(), ...(value || {}) };

  if (!Array.isArray(prefs.dashboards)) {
    prefs.dashboards = [];
  }

  if (!Array.isArray(prefs.seeded)) {
    prefs.seeded = [];
  }

  return prefs;
}

function newId(): string {
  return `db-${ randomStr(8).toLowerCase() }`;
}

function widgetsFromPreset(widgets: any[]): DashboardWidgetInstance[] {
  return widgets.map((w) => ({
    ...clone(w),
    id: `w-${ randomStr(8).toLowerCase() }`,
  }));
}

/**
 * Loads, seeds and persists the user's dashboards for a given context.
 *
 * Everything lives in the `custom-dashboards` user preference, so dashboards follow
 * the user between browsers in the same way as their other UI preferences.
 */
export function useDashboards(store: any, context: DashboardContext) {
  const prefs = computed<CustomDashboardPrefs>(() => normalize(store.getters['prefs/get'](CUSTOM_DASHBOARDS)));

  const dashboards = computed<CustomDashboard[]>(() => prefs.value.dashboards.filter((d) => d.context === context));

  const currentId: Ref<string | null> = ref(null);

  async function save(next: CustomDashboardPrefs) {
    await store.dispatch('prefs/set', { key: CUSTOM_DASHBOARDS, value: next });
  }

  function withDashboards(mutate: (list: CustomDashboard[]) => void): CustomDashboardPrefs {
    const next = clone(prefs.value);

    mutate(next.dashboards);

    return next;
  }

  /**
   * First time a user opens a dashboard for this context, give them the out-of-the-box
   * dashboards and land them on the one that matches their role.
   */
  async function seed(): Promise<void> {
    if (prefs.value.seeded?.includes(context) || dashboards.value.length) {
      currentId.value = prefs.value.current[context] || prefs.value.default[context] || dashboards.value[0]?.id || null;

      return;
    }

    const admin = isAdminUser(store.getters);
    const created: CustomDashboard[] = presetsForContext(context).map((preset) => ({
      id: newId(),
      name: store.getters['i18n/t'](preset.nameKey),
      context,
      preset: preset.id,
      widgets: widgetsFromPreset(preset.widgets),
    }));

    const roleMatch = presetsForContext(context).findIndex((p) => p.role === (admin ? 'admin' : 'user'));
    const landOn = created[roleMatch >= 0 ? roleMatch : 0];

    const next = clone(prefs.value);

    next.dashboards.push(...created);
    next.seeded = [...(next.seeded || []), context];
    next.current = { ...next.current, [context]: landOn?.id };

    currentId.value = landOn?.id || null;

    await save(next);
  }

  const current = computed<CustomDashboard | null>(() => dashboards.value.find((d) => d.id === currentId.value) || dashboards.value[0] || null);

  const isClassic = computed(() => currentId.value === CLASSIC_DASHBOARD);

  const defaultId = computed(() => prefs.value.default[context]);

  async function select(id: string) {
    currentId.value = id;

    const next = clone(prefs.value);

    next.current = { ...next.current, [context]: id };

    await save(next);
  }

  async function updateWidgets(widgets: DashboardWidgetInstance[]) {
    const id = current.value?.id;

    if (!id) {
      return;
    }

    await save(withDashboards((list) => {
      const target = list.find((d) => d.id === id);

      if (target) {
        target.widgets = clone(widgets);
      }
    }));
  }

  async function add(name: string, copyFrom?: CustomDashboard) {
    const created: CustomDashboard = {
      id: newId(),
      name,
      context,
      widgets: copyFrom ? widgetsFromPreset(copyFrom.widgets) : [],
    };

    const next = clone(prefs.value);

    next.dashboards.push(created);
    next.current = { ...next.current, [context]: created.id };
    currentId.value = created.id;

    await save(next);

    return created;
  }

  async function rename(id: string, name: string) {
    await save(withDashboards((list) => {
      const target = list.find((d) => d.id === id);

      if (target) {
        target.name = name;
      }
    }));
  }

  async function remove(id: string) {
    const next = clone(prefs.value);

    next.dashboards = next.dashboards.filter((d) => d.id !== id);

    if (next.current[context] === id) {
      delete next.current[context];
    }

    if (next.default[context] === id) {
      delete next.default[context];
    }

    currentId.value = next.dashboards.find((d) => d.context === context)?.id || null;

    await save(next);
  }

  async function setDefault(id: string) {
    const next = clone(prefs.value);

    const pinned = next.default[context] === id ? undefined : id;

    next.default = { ...next.default, [context]: pinned };

    await save(next);
  }

  /** Put a preset-derived dashboard back to how it shipped */
  async function reset(id: string) {
    const dashboard = dashboards.value.find((d) => d.id === id);
    const preset = presetsForContext(context).find((p) => p.id === dashboard?.preset);

    if (!preset) {
      return;
    }

    await save(withDashboards((list) => {
      const target = list.find((d) => d.id === id);

      if (target) {
        target.widgets = widgetsFromPreset(preset.widgets);
      }
    }));
  }

  /** Sharing, prototype flavour - hand the dashboard definition to someone else as JSON */
  function exportDashboard(id: string): string {
    const dashboard = dashboards.value.find((d) => d.id === id);

    const shareable = dashboard ? {
      name: dashboard.name, context: dashboard.context, widgets: dashboard.widgets
    } : {};

    return JSON.stringify(shareable, null, 2);
  }

  async function importDashboard(json: string) {
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed?.widgets)) {
      throw new Error('Not a dashboard');
    }

    const created: CustomDashboard = {
      id: newId(),
      name: parsed.name || 'Imported',
      context,
      widgets: widgetsFromPreset(parsed.widgets),
    };

    const next = clone(prefs.value);

    next.dashboards.push(created);
    next.current = { ...next.current, [context]: created.id };
    currentId.value = created.id;

    await save(next);

    return created;
  }

  return {
    dashboards,
    current,
    currentId,
    isClassic,
    defaultId,
    seed,
    select,
    updateWidgets,
    add,
    rename,
    remove,
    setDefault,
    reset,
    exportDashboard,
    importDashboard,
  };
}
