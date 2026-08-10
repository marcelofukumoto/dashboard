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
import { DSL } from '@shell/store/type-map';

// Label that marks a ConfigMap as a custom-view template document.
export const TEMPLATE_LABEL = 'templates.rancher.io/custom-view';

// Key within the ConfigMap's `data` that holds the template JSON string.
export const TEMPLATE_DATA_KEY = 'template';

// Nav-entry name for the "Custom View Sources" management list.
const SOURCES_TYPE = 'custom-view-sources';

// Registry of templates loaded for the CURRENT cluster. Populated by
// loadCustomViews() during loadCluster; read by the generic page component.
let loadedTemplates = [];

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

function extractTemplates(configMaps) {
  return (configMaps || [])
    .filter((cm) => cm.metadata?.labels?.[TEMPLATE_LABEL] === 'true')
    .map((cm) => parseTemplate(cm.data?.[TEMPLATE_DATA_KEY]))
    .filter(Boolean);
}

/**
 * Register a side-nav entry per page of every loaded template.
 *
 * virtualType() defines the entry; basicType() is what actually places it in the
 * Explorer BASIC nav tree. Both are idempotent upserts keyed by name, so re-running
 * on each cluster entry produces no duplicates.
 *
 * `commit` is the root Vuex commit (from the loadCluster action). The DSL only needs
 * `store.commit`, so a { commit } shim is sufficient.
 */
function registerNav(commit) {
  const { virtualType, basicType, weightGroup } = DSL({ commit }, EXPLORER);

  const typeNames = [];

  loadedTemplates.forEach((template) => {
    (template.pages || []).forEach((page) => {
      const name = `custom-view-${ page.id }`;

      typeNames.push(name);

      virtualType({
        label:      page.name,
        group:      'customViews',
        namespaced: false,
        name,
        icon:       template.metadata?.icon || 'compass',
        weight:     -10,
        route:      { name: 'c-cluster-explorer-template', params: { pageId: page.id } },
        exact:      true,
      });
    });
  });

  // Management entry: a filtered list of the ConfigMaps that back these views, pinned
  // to the bottom of the group (lowest weight). ALWAYS registered — even with no view
  // ConfigMaps yet — so the group stays reachable (e.g. to add the first view).
  typeNames.push(SOURCES_TYPE);
  virtualType({
    label:      'Custom View Sources',
    group:      'customViews',
    namespaced: false,
    name:       SOURCES_TYPE,
    icon:       'file',
    weight:     -100,
    route:      { name: 'c-cluster-explorer-custom-views' },
    exact:      true,
  });

  basicType(typeNames, 'customViews');
  weightGroup('customViews', 50, true);
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
      const configMaps = await dispatch('cluster/findAll', { type: CONFIG_MAP });

      loadedTemplates = extractTemplates(configMaps);
    }

    registerNav(commit);
  } catch (e) {
    console.warn('[template-engine] loadCustomViews failed', e); // eslint-disable-line no-console
  }
}
