// Runtime template engine — loads custom-view templates from the cluster and
// registers their pages in the side-nav, at runtime, with no rebuild.
//
// Flow:
//   loadCluster() (store/index.js)  ->  loadCustomViews()  ->
//     fetch ConfigMaps labelled as templates  ->  parse JSON  ->  register nav (DSL)
//
// The generic page (shell/pages/c/_cluster/_template/index.vue) reads the parsed
// templates back out of this module's registry via getPageRef().
//
// This replaces the Phase 0 approach of importing a hardcoded template into the
// bundle: the template now lives OUTSIDE the app, in a ConfigMap, so an operator (or
// our Claude client) can create the resource and have pages appear live.

import { CONFIG_MAP } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { DSL, ROOT } from '@shell/store/type-map';

// Label that marks a ConfigMap as a custom-view template document.
export const TEMPLATE_LABEL = 'templates.rancher.io/custom-view';

// Key within the ConfigMap's `data` that holds the template JSON string.
export const TEMPLATE_DATA_KEY = 'template';

// Annotation that selects the view kind: 'template' (JSON widgets, default) or 'code'
// (a runtime-compiled .vue). Code views hold JSON metadata in `data.meta` and the SFC
// source in `data['view.vue']`.
export const TEMPLATE_KIND_ANNOTATION = 'templates.rancher.io/kind';
export const CODE_META_KEY = 'meta';
export const CODE_SOURCE_KEY = 'view.vue';

// Nav-entry name for the "Custom View Sources" management list.
const SOURCES_TYPE = 'custom-view-sources';

// Default nav group for templates that don't declare their own placement.
const DEFAULT_GROUP = 'customViews';
const DEFAULT_GROUP_WEIGHT = 50;

// Registry of templates loaded for the CURRENT cluster. Populated by
// loadCustomViews() during loadCluster; read by the generic page component.
let loadedTemplates = [];

// Nav-entry names the engine registered on the last pass. Used to drop entries whose
// backing ConfigMap was deleted (type-map registration is upsert-only).
let registeredNames = [];

export function getLoadedTemplates() {
  return loadedTemplates;
}

/**
 * Find a page (and its parent template) by page id across all loaded templates.
 * Page ids are assumed unique within a cluster for now (a later phase can key on a
 * composite template+page id).
 */
export function getPageRef(pageId) {
  for (const template of loadedTemplates) {
    const page = (template.pages || []).find((p) => p.id === pageId);

    if (page) {
      return { template, page };
    }
  }

  return null;
}

function parseTemplate(raw) {
  if (!raw) {
    return null;
  }

  try {
    const template = JSON.parse(raw);

    // Minimal shape guard. Full JSON Schema validation is a later phase.
    if (template && Array.isArray(template.pages) && template.metadata?.id) {
      return template;
    }

    console.warn('[template-engine] Ignoring template with invalid shape', template); // eslint-disable-line no-console

    return null;
  } catch (e) {
    console.warn('[template-engine] Failed to parse template JSON', e); // eslint-disable-line no-console

    return null;
  }
}

/**
 * Parse a code-kind ConfigMap into the same internal template shape used everywhere
 * else, but with a single page carrying the .vue `source` instead of JSON widgets.
 */
function parseCodeTemplate(cm) {
  const metaRaw = cm.data?.[CODE_META_KEY];
  const source = cm.data?.[CODE_SOURCE_KEY];

  if (!metaRaw || !source) {
    console.warn('[template-engine] code view missing meta or view.vue', cm.id); // eslint-disable-line no-console

    return null;
  }

  try {
    const meta = JSON.parse(metaRaw);

    if (!meta?.id) {
      console.warn('[template-engine] code view meta missing id', meta); // eslint-disable-line no-console

      return null;
    }

    const name = meta.name || meta.id;

    return {
      kind:     'code',
      metadata: {
        id: meta.id, name, icon: meta.icon
      },
      nav:   meta.nav,
      pages: [{
        id: meta.id, name, source, hidden: !!(meta.hidden || meta.nav?.hidden)
      }],
    };
  } catch (e) {
    console.warn('[template-engine] Failed to parse code view meta JSON', e); // eslint-disable-line no-console

    return null;
  }
}

function extractTemplates(configMaps) {
  return (configMaps || [])
    .filter((cm) => cm.metadata?.labels?.[TEMPLATE_LABEL] === 'true')
    .map((cm) => {
      const kind = cm.metadata?.annotations?.[TEMPLATE_KIND_ANNOTATION];

      return kind === 'code' ? parseCodeTemplate(cm) : parseTemplate(cm.data?.[TEMPLATE_DATA_KEY]);
    })
    .filter(Boolean);
}

/**
 * Resolve the nav group a template's pages should land in.
 *  - undefined/empty -> the default "Custom Views" group
 *  - "root" (any case) -> top-level nav items (no group header), like Longhorn
 *  - anything else -> that group key (a new or existing group)
 */
function navGroup(group) {
  if (!group) {
    return DEFAULT_GROUP;
  }

  return `${ group }`.toLowerCase() === ROOT ? ROOT : group;
}

/**
 * Register a side-nav entry per page of every loaded template.
 *
 * virtualType() defines the entry; basicType(names, group) is what actually PLACES it
 * in the Explorer BASIC nav tree — so the group comes from each template's `nav` block,
 * not from the virtualType `group` field (which only matters in ALL mode). Both are
 * idempotent upserts keyed by name, so re-running on each cluster entry is safe.
 *
 * `commit` is the root Vuex commit (from the loadCluster action). The DSL only needs
 * `store.commit`, so a { commit } shim is sufficient.
 */
function registerNav(commit) {
  const {
    virtualType, basicType, weightGroup, labelGroup
  } = DSL({ commit }, EXPLORER);

  // Collect page type-names per nav group so basicType() can place each set correctly.
  const namesByGroup = {};
  const pushName = (group, name) => {
    namesByGroup[group] = namesByGroup[group] || [];
    namesByGroup[group].push(name);
  };

  loadedTemplates.forEach((template) => {
    const nav = template.nav || {};
    const group = navGroup(nav.group);
    const groupWeight = typeof nav.weight === 'number' ? nav.weight : DEFAULT_GROUP_WEIGHT;

    // A template may name/weight its own group. (Ignored for the root/top-level group.)
    if (group !== ROOT) {
      if (nav.groupLabel) {
        labelGroup(group, nav.groupLabel);
      }
      weightGroup(group, groupWeight, true);
    }

    (template.pages || []).forEach((page) => {
      // Hidden pages still render via their route (getPageRef finds them) but get no nav
      // entry — e.g. a detail/view reached only from a list link.
      if (page.hidden) {
        return;
      }

      const name = `custom-view-${ page.id }`;

      pushName(group, name);

      virtualType({
        label:      page.name,
        group,
        namespaced: false,
        name,
        icon:       template.metadata?.icon || 'compass',
        weight:     -10,
        route:      { name: 'c-cluster-explorer-template', params: { pageId: page.id } },
        exact:      true,
      });
    });
  });

  // Management entry always lives in the default "Custom Views" group — a stable home
  // regardless of where individual templates place their pages. ALWAYS registered, even
  // with no view ConfigMaps yet, so the feature stays reachable.
  labelGroup(DEFAULT_GROUP, 'Custom Views');
  weightGroup(DEFAULT_GROUP, DEFAULT_GROUP_WEIGHT, true);
  pushName(DEFAULT_GROUP, SOURCES_TYPE);
  virtualType({
    label:      'Custom View Sources',
    group:      DEFAULT_GROUP,
    namespaced: false,
    name:       SOURCES_TYPE,
    icon:       'file',
    weight:     -100,
    route:      { name: 'c-cluster-explorer-custom-views' },
    exact:      true,
  });

  Object.entries(namesByGroup).forEach(([group, names]) => basicType(names, group));

  // Drop entries registered on a previous pass whose page/template no longer exists
  // (e.g. its ConfigMap was deleted), so deletions are reflected live.
  const currentNames = Object.values(namesByGroup).flat();
  const currentSet = new Set(currentNames);
  const staleNames = registeredNames.filter((name) => !currentSet.has(name));

  if (staleNames.length) {
    commit('type-map/removeTypes', { product: EXPLORER, names: staleNames });
  }

  registeredNames = currentNames;
}

/**
 * Runtime entry point, called from loadCluster (store/index.js) AFTER cluster schemas
 * are available and BEFORE clusterReady flips true — so SideNav.getGroups() picks up
 * the new entries when the clusterReady watcher fires.
 *
 * Templates come exclusively from ConfigMaps in the cluster; there is no bundled
 * fallback. With no template ConfigMaps the group still shows the "Custom View
 * Sources" management entry, but no view pages.
 */
export async function loadCustomViews({ dispatch, commit, getters }) {
  loadedTemplates = [];

  // This runs on the critical path of cluster load (before clusterReady). A bad
  // template must never block cluster entry, so swallow everything here.
  try {
    // Only fetch if the user can list ConfigMaps in this cluster.
    if (getters['cluster/schemaFor'](CONFIG_MAP)) {
      // TODO(phase-next): use a server-side labelSelector instead of fetching all ConfigMaps.
      // findAll also starts a live socket watch, which is what powers reloadCustomViews().
      const configMaps = await dispatch('cluster/findAll', { type: CONFIG_MAP });

      loadedTemplates = extractTemplates(configMaps);
    }

    registerNav(commit);
  } catch (e) {
    console.warn('[template-engine] loadCustomViews failed', e); // eslint-disable-line no-console
  }
}

/**
 * Live re-registration from the store cache (no fetch). Called by SideNav when the set
 * of custom-view ConfigMaps changes (create/edit), so new/updated views appear without
 * a reload. Because registration is an idempotent upsert, this safely adds/updates
 * entries; deleted views' entries linger until the next full cluster load (type-map has
 * no per-entry removal).
 */
export function reloadCustomViews(store) {
  try {
    loadedTemplates = [];

    if (store.getters['cluster/schemaFor'](CONFIG_MAP)) {
      loadedTemplates = extractTemplates(store.getters['cluster/all'](CONFIG_MAP));
    }

    registerNav(store.commit);
  } catch (e) {
    console.warn('[template-engine] reloadCustomViews failed', e); // eslint-disable-line no-console
  }
}
