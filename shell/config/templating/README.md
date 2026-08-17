# Runtime Templating Engine & AI-Authored Custom Views

> **Status: experimental / spike.** This subsystem compiles and runs code that lives
> *outside* the app bundle (in cluster ConfigMaps), including arbitrary Vue components. It
> is a research capability for "AI generates runtime UIs for Rancher". It must stay behind a
> flag and requires a relaxed CSP (`unsafe-eval`). **Do not ship it enabled by default.**

## 1. What this is

A way to add pages to the Rancher Explorer **at runtime, with no rebuild**. A page is
described by a **ConfigMap** in the cluster; the dashboard discovers it on cluster load,
registers a nav entry, and renders it. Because the page definition lives in the cluster, an
operator — or an AI agent — can create/update the ConfigMap and have pages appear live.

Two flavours of page:

| Kind | Annotation | `data` keys | Rendered by |
|------|-----------|-------------|-------------|
| **Template** (JSON widgets) | `templates.rancher.io/kind: template` (or omitted) | `template` (JSON) | Built-in widget components (`resourceList`, `overview`) |
| **Code** (runtime Vue SFC) | `templates.rancher.io/kind: code` | `meta` (JSON) + `view.vue` (SFC) | `vue3-sfc-loader`, compiled in-browser |

Plus one special page:

- **White Canvas** — a single hardcoded page bound to *one* ConfigMap (`default/white-canvas`),
  built for a **real-time authoring loop**: an agent rewrites the ConfigMap and the page
  hot-recompiles within ~1s over the live socket.

And three AI personas (`AIAgentConfig`) that generate these ConfigMaps.

## 2. Architecture & data flow

```
loadCluster()  (shell/store/index.js)
      │  (after schemas load, BEFORE commit('clusterReady', true))
      ▼
loadCustomViews({ dispatch, commit, getters })   (template-engine.js)
      │   cluster/findAll(configmap)  ── also opens a LIVE socket watch on ConfigMaps
      │   filter by label templates.rancher.io/custom-view=true
      │   parse each → internal template shape
      ▼
registerNav(commit)   → type-map DSL: virtualType() + basicType() + weightGroup/labelGroup
      │
      ▼
commit('clusterReady', true)   → SideNav.getGroups() runs and shows the new entries
```

At render time the generic page reads the parsed template back out of the engine's registry:

```
Route c-cluster-explorer-template  (/c/:cluster/explorer/_template/:pageId?)
      → shell/pages/c/_cluster/_template/index.vue
      → getPageRef(pageId)  → { template, page }
      → per widget: TemplateResourceList | TemplateOverview | TemplateCode
```

### Live updates (no reload)

`SideNav.vue` watches a `customViewIds` computed (derived from the reactive
`cluster/all(configmap)` list). On create/edit/delete of a custom-view ConfigMap it calls
`reloadCustomViews(store)` (re-parse from the store cache, no fetch) then `queueUpdate()`
(debounced `getGroups`). Deletions are handled because `registerNav` tracks the names it
registered last pass and calls `type-map/removeTypes` for any that disappeared
(type-map registration is otherwise upsert-only).

## 3. The ConfigMap contract

Every custom-view ConfigMap:

- **Label** `templates.rancher.io/custom-view: "true"` — marks it for discovery.
- **Annotation** `templates.rancher.io/kind: "code" | "template"` — selects the kind
  (missing ⇒ `template`).
- Lives in `default` unless you say otherwise. (TODO: server-side `labelSelector` instead of
  fetching all ConfigMaps.)

### Template (JSON widgets)

`data.template` is a JSON string:

```json
{
  "apiVersion": "templates.rancher.io/v1",
  "kind": "CustomView",
  "metadata": { "id": "my-view", "name": "My View", "icon": "compass" },
  "nav": { "group": "customViews", "groupLabel": "Custom Views", "weight": 60 },
  "pages": [
    { "id": "my-view", "name": "My View", "widgets": [ /* ... */ ] }
  ]
}
```

Widget types currently supported (`index.vue → componentForWidget`):

- `resourceList` → `TemplateResourceList.vue` — a filtered `ResourceTable` for one or more
  resource types.
- `overview` → `TemplateOverview.vue` — the Workloads-dashboard "By State / By Type /
  By Namespace" bento, reusable for **any** resource list (built on the parameterized
  `useWorkloadDashboard` composable in `explorer/workload-dashboard/composable.ts`).

### Code (runtime Vue SFC)

Two data keys:

- `data.meta` — JSON metadata (the nav entry):
  ```json
  {
    "id": "certificates",
    "name": "Certificates",
    "icon": "file",
    "hidden": false,
    "nav": { "group": "customViews", "groupLabel": "Custom Views", "weight": 60 }
  }
  ```
- `data["view.vue"]` — a full **Options-API** Single File Component, compiled at runtime.

`nav.group`: omit ⇒ default "Custom Views" group; `"root"` ⇒ top-level (no group header,
like Longhorn); any other key ⇒ that group (created if new). `hidden: true` ⇒ the page still
renders via its route (reachable by link) but gets **no** nav entry — used for
Create/Edit/View pages reached from a List.

## 4. Runtime SFC compilation

Three files, deliberately isolated in their own **async chunk** (loaded via dynamic
`import()` from `TemplateCode.vue`). A static import would pull `require.context` into the
page's synchronous init and cause circular-dependency init errors
(`__WEBPACK_DEFAULT_EXPORT__ before initialization`).

- **`sfc-loader.js`** — `compileSFC(source)` wraps `vue3-sfc-loader`'s `loadModule`. Uses a
  Proxy `moduleCache` so only the components the SFC actually imports get executed (eager
  execution of every component blanks the app). Strips `lang="scss|sass|less"` from
  `<style>` (the loader has no preprocessor; treat as plain CSS). Disallows any import that
  isn't `vue` or a known component. Collects injected `<style>` elements so they can be
  removed on unmount. **Uses `new Function` → requires CSP `unsafe-eval`.**
- **`component-registry.js`** — what an SFC may import:
  - **`@shell/components`** via `require.context` (sync), mapped by key **without executing**
    (`buildKeyMap`), executed on demand in `resolveComponent`.
  - **`@components`** (rancher-components) via **explicit imports** of each component (a
    `require.context` there breaks this module's own init). Keep the list in sync as the
    package grows.
  - Supported import forms mirror real code so pages copy verbatim: bare name (`'RcButton'`),
    `@shell` full path, `@components` dir (default + named). Each `@components` entry is an
    ES-module namespace `{ __esModule, default, [Name] }`; `__esModule` makes the loader
    unwrap `.default` (else it warns "missing render").
- **`TemplateCode.vue`** — dynamically imports `sfc-loader`, compiles the `source` prop,
  `markRaw`s the component, mounts it with `<component :is>`, and **recompiles whenever
  `source` changes** (this is the live-reload primitive). Cleans up injected styles on
  unmount.

## 5. The White Canvas (real-time page)

A single special page, separate from the discovery engine.

- **Page**: `shell/pages/c/_cluster/_template/WhiteCanvas.vue`
- **Route**: `c-cluster-explorer-canvas` — `/c/:cluster/explorer/_canvas`
- **Nav entry**: fixed "White Canvas" under Custom Views (registered in
  `template-engine.js → registerNav`, always present).
- **Backing ConfigMap**: `default/white-canvas`. **No** `custom-view` label — the page reads
  it directly by hardcoded id, and it must *not* also appear as a generic nav view.

### How the real-time loop works (no polling)

1. The engine already ran `cluster/findAll(configmap)` on cluster load ⇒ a **live socket
   watch** on ConfigMaps is open. `WhiteCanvas.vue` re-asserts it in `fetch()`.
2. `WhiteCanvas` reads the CM via `getters['cluster/byId'](configmap, 'default/white-canvas')`
   and exposes `data["view.vue"]` as a reactive `source` computed.
3. An edit to the CM (by the agent or `kubectl`) pushes over the socket → Steve store swaps
   the resource → `source` re-evaluates → `TemplateCode`'s `source` watcher recompiles and
   remounts. The page updates in ~1s with no browser refresh.

## 6. Recreating a real resource as custom views

Pattern proven by rebuilding the cert-manager **Certificate** resource entirely as code
views (see `examples/`). One resource ⇒ a few linked ConfigMaps:

| ConfigMap | meta | Role |
|-----------|------|------|
| `<res>` | visible | List: `ResourceTable` + Create button; `get-custom-detail-link` routes rows to *our* view |
| `<res>-create` | `hidden:true` | Create **and** Edit: no `?id` ⇒ create blank; `?id=ns/name` ⇒ load & edit |
| `<res>-view` | `hidden:true` | Read-only detail (wraps `ResourceTabs`) |

The Create/Edit form is **standalone** — it does **not** use the `CreateEditView` mixin or
`ResourceDetail` (those need a parent page a custom view doesn't have). Instead it wraps
`CruResource` (masthead + Save/Cancel + YAML toggle), manages `value` via
`cluster/create` / `cluster/find`, provides `registerBeforeHook`, and implements
`save(buttonCb)` itself. See `examples/certificate-create.configmap.yaml` for the full 5-tab
reference.

## 7. AI agents (`AIAgentConfig`)

Three personas generate these ConfigMaps through the Rancher AI (Liz) + `rancher-mcp-server`
MCP `toolSet: rancher` (`createKubernetesResource` etc.). CRD:
`aiagentconfigs.ai.cattle.io/v1alpha1`, namespace `cattle-ai-agent-system`.

| File | Persona | Confirms writes? | Purpose |
|------|---------|------------------|---------|
| `custom-view-builder.aiagentconfig.yaml` | Custom View Builder | yes (`humanValidationTools`) | JSON-widget views (lists/overviews) |
| `custom-view-code-builder.aiagentconfig.yaml` | Custom View Code Builder | yes | Code views (arbitrary SFCs, full List/Create/Edit/View) |
| `white-canvas-builder.aiagentconfig.yaml` | White Canvas | **no** — writes immediately | Fast real-time loop on `default/white-canvas` |

`humanValidationTools: [createKubernetesResource]` gates a tool behind a user confirmation.
The White Canvas agent **omits** it for speed, is terse (does **not** echo the ConfigMap
back), edits the one CM in place, and is instructed to prefer update/patch (the CM already
exists) and to **never claim success without a successful write** (report the exact error
instead).

### Key prompt rules learned the hard way

- **Vue 3 only**: never `this.$set` / `Vue.set` — assign directly (`obj.k = v`); reactivity
  is automatic. Options API, no `<script setup>`.
- **Imports**: only `vue` and `@shell` / `@components` components, by bare name. **Not**
  `@shell/config`, mixins, utils, models, npm, or relative paths.
- **No invented components** (`CreateButton` doesn't exist). Buttons: `RcButton` or
  `<button class="btn role-primary">`. `ButtonGroup` is a segmented toggle, not a Save footer.
- **`Labels` collision**: import the form one by full path
  `@shell/components/form/Labels`.
- **Styles**: `<style scoped>` plain CSS only — never `lang="scss"`.
- Don't import `@shell/config/table-headers`; omit `:headers` (schema-derived) or pass inline
  plain-object headers.

## 8. Files

```
shell/config/templating/
  template-engine.js            Discovery, parse, nav registration, live reload, delete handling
  component-registry.js         What SFCs may import (@shell + @components), lazy resolution
  sfc-loader.js                 compileSFC() — vue3-sfc-loader wrapper (async chunk)
  custom-view-builder.aiagentconfig.yaml        JSON-widget builder persona
  custom-view-code-builder.aiagentconfig.yaml   Code-view builder persona
  white-canvas-builder.aiagentconfig.yaml       Fast real-time canvas persona
  example-custom-view.configmap.yaml            JSON-widget example
  example-code-view.configmap.yaml              Code-view example
  examples/
    certificate-list.configmap.yaml             Reference: List
    certificate-create.configmap.yaml           Reference: standalone 5-tab Create/Edit form
    certificate-view.configmap.yaml             Reference: read-only View
    white-canvas.configmap.yaml                 The hardcoded White Canvas ConfigMap

shell/pages/c/_cluster/_template/
  index.vue                     Generic "engine mount" page (:pageId selects the page)
  TemplateResourceList.vue      resourceList widget
  TemplateOverview.vue          overview (By State/Type/Namespace) widget
  TemplateCode.vue              Runtime-compiled code view host (recompiles on source change)
  WhiteCanvas.vue               The single real-time page (default/white-canvas)
  sources.vue                   Management list of custom-view ConfigMaps

Integration points (edited in the app):
  shell/store/index.js                      loadCluster → loadCustomViews before clusterReady
  shell/components/SideNav.vue              customViewIds watcher → reloadCustomViews + getGroups
  shell/store/type-map.js                   removeTypes mutation (live deletion)
  shell/config/router/routes.js             c-cluster-explorer-template / -custom-views / -canvas
  shell/pages/c/_cluster/explorer/workload-dashboard/composable.ts   parameterized dashboard
```

## 9. Operating it

Applying a ConfigMap (dev cluster; a kubeconfig was kept under `coverage/unit/kubeconfig/`
during development for convenience):

```bash
KC=coverage/unit/kubeconfig/<your-kubeconfig>.yaml
kubectl --kubeconfig="$KC" apply -f shell/config/templating/examples/certificate-list.configmap.yaml
```

- **New routes** (`routes.js`) are bundled ⇒ restart `yarn dev` / hard-refresh once to pick
  them up. After that, **ConfigMap** create/edit/delete reflect live (no restart).
- Apply an agent, then in Rancher open **Liz**, pick the persona (e.g. "White Canvas"), and
  ask. Disable a persona with `enabled: false` or delete the `AIAgentConfig`.

## 10. Gotchas & lessons (condensed)

- Nav placement needs **both** `virtualType()` (metadata) **and** `basicType(names, group)`
  (placement in BASIC mode). `virtualType.group` only affects ALL mode.
- SideNav is **not** reactively bound to nav data — it rebuilds via `getGroups()` on
  watchers; that's why live updates go through the `customViewIds` watcher.
- Runtime SFC code **must** live in its own async chunk (dynamic `import()`), or circular
  init errors appear. Lazy `require.context` mode is unsupported here
  (`context is not a function`); use sync mode + key-map-without-execute.
- `&summarynamespaced` breaks cluster-scoped types — the overview composable only requests it
  for namespaced types.
- `@components` entries need `__esModule: true` or the loader renders them as
  `{ default: {...} }` and warns "missing render".

## 11. Known limitations / TODO

- **No JSON Schema validation** yet — malformed/AI templates are only shape-guarded. A
  validator that rejects bad templates cleanly is the main deferred safety piece.
- Discovery fetches **all** ConfigMaps; move to a server-side `labelSelector`.
- Live delete relies on the engine's registered-name tracking; nav for a deleted view is
  removed via `type-map/removeTypes`.
- The White Canvas agent doesn't persist per-session knowledge of the current `view.vue`; it
  is instructed to read the CM at the start of a session.
- **Security**: runtime SFC execution needs CSP `unsafe-eval` and runs arbitrary code. Keep
  the code-view and White Canvas paths behind a flag; never a shipping default.
```
