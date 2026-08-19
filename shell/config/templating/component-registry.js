// Lazy registry of components for runtime-compiled custom-view SFCs.
//
// BOTH component roots are exposed via require.context (sync mode), mapped by ctx.keys()
// (which only LISTS module ids — it does not execute them) and executed on demand via
// ctx(key) when an SFC actually imports one. Eager execution of every component disrupts
// the app, so nothing is executed at module-init time.
//
// This file is only ever loaded via a dynamic import from TemplateCode (its own async
// chunk). A static import would pull these require.contexts into the page's synchronous
// init and previously caused circular-init errors — which is why an earlier version had to
// hand-list every @components import. Now that this module lives in the isolated async
// chunk, require.context over @components is safe, so the wildcard replaces the hand list.
//
// Supported import forms (match real component code so pages can be copied verbatim):
//   import RcButton from 'RcButton'                          (bare name)
//   import Labels from '@shell/components/form/Labels'       (@shell full path)
//   import Banner, { Banner } from '@components/Banner'      (@components dir, default+named)
//   import { RcDropdown, RcDropdownItem } from '@components/RcDropdown'  (multiple named)

const NOT_TESTS = /^(?:(?!__tests__).)*\.vue$/;

// @shell/components — resolved by ctx(key) which returns the component's own module
// (already carrying `.default`). @components — synthesized into an ES-module namespace at
// resolve time so BOTH default and named-by-name imports work.
const shellCtx = require.context('@shell/components', true, NOT_TESTS);
const compCtx = require.context('@components', true, NOT_TESTS);

// Basename without extension for a context key ('./RcDropdown/RcDropdownItem.vue' -> id).
// For a Foo/index.vue the import id is the DIRECTORY (Foo), not "index".
function idForKey(rel) {
  const parts = rel.replace(/\.vue$/, '').split('/');
  const last = parts[parts.length - 1];

  return (last === 'index' && parts.length > 1) ? parts[parts.length - 2] : last;
}

// ---- @shell/components: id -> context key (built once, no execution) ----
let shellKeyMap = null;

function buildShellKeyMap() {
  if (shellKeyMap) {
    return shellKeyMap;
  }

  shellKeyMap = {};

  shellCtx.keys().forEach((key) => {
    const rel = key.replace(/^\.\//, '');
    const parts = rel.replace(/\.vue$/, '').split('/');
    const isIndex = parts[parts.length - 1] === 'index' && parts.length > 1;
    const name = idForKey(rel);
    const path = `@shell/components/${ rel }`;

    if (!(name in shellKeyMap)) {
      shellKeyMap[name] = key;
    }
    shellKeyMap[path] = key;
    shellKeyMap[path.replace(/\.vue$/, '')] = key;

    if (isIndex) {
      shellKeyMap[`@shell/components/${ parts.slice(0, -1).join('/') }`] = key;
    }
  });

  return shellKeyMap;
}

// ---- @components: id -> key (bare / full path / no-ext) and dir path -> { name -> key } ----
let compIndex = null;

function buildCompIndex() {
  if (compIndex) {
    return compIndex;
  }

  const byId = {}; // 'Banner' | '@components/Banner/Banner.vue' | ...(no ext) -> key
  const byDir = {}; // '@components/Banner' -> { Banner: key }  (a dir may hold several)
  const nameByKey = {}; // key -> component id (for building the namespace at resolve time)

  compCtx.keys().forEach((key) => {
    const rel = key.replace(/^\.\//, '');
    const name = idForKey(rel);
    const fullPath = `@components/${ rel }`;
    const dirPath = `@components/${ rel.replace(/\/[^/]+\.vue$/, '') }`;

    nameByKey[key] = name;

    if (!(name in byId)) {
      byId[name] = key; // bare name (first wins)
    }
    byId[fullPath] = key; // full .vue path
    byId[fullPath.replace(/\.vue$/, '')] = key; // path without extension

    byDir[dirPath] = byDir[dirPath] || {};
    byDir[dirPath][name] = key;
  });

  compIndex = {
    byId, byDir, nameByKey
  };

  return compIndex;
}

// ES-module namespace for a single @components component so `import X from ...` and
// `import { X } from ...` both work. __esModule makes the loader unwrap `.default`.
function compNamespace(key, index) {
  const comp = compCtx(key).default;
  const name = index.nameByKey[key];

  return {
    __esModule: true, default: comp, [name]: comp
  };
}

export function hasComponent(id) {
  if (typeof id !== 'string') {
    return false;
  }

  const index = buildCompIndex();

  return (id in index.byId) || (id in index.byDir) || (id in buildShellKeyMap());
}

// Returns the requested module namespace, executing only that one module (or, for an
// @components directory path, the components in that directory). @components takes
// precedence over @shell for shared bare names, matching the previous behaviour.
export function resolveComponent(id) {
  const index = buildCompIndex();

  // @components directory import: '@components/RcDropdown' -> namespace of all its exports.
  if (id in index.byDir) {
    const comps = {};

    Object.entries(index.byDir[id]).forEach(([name, key]) => {
      comps[name] = compCtx(key).default;
    });

    const dirName = id.split('/').pop();

    return {
      __esModule: true, ...comps, default: comps[dirName] || Object.values(comps)[0]
    };
  }

  // @components bare name / full path / no-ext.
  if (id in index.byId) {
    return compNamespace(index.byId[id], index);
  }

  // @shell/components — the module already carries `.default`.
  const shellMap = buildShellKeyMap();

  return id in shellMap ? shellCtx(shellMap[id]) : undefined;
}
