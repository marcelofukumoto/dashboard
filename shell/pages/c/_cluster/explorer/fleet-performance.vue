<script>
import { FLEET, COUNT, MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

/**
 * Fleet Performance Investigation Dashboard
 *
 * Investigates Fleet resource loading patterns and demonstrates how
 * pagination, server-side filtering, field exclusion, and the Summary API
 * could improve Fleet page performance.
 *
 * Source: Internal investigation — Fleet pages use findAll (no pagination)
 * Store: management (not cluster)
 */

// ── Fleet resource types to analyze ──
const FLEET_TYPES = {
  [FLEET.GIT_REPO]: {
    label: 'Git Repos',
    icon:  'icon-storage',
  },
  [FLEET.HELM_OP]: {
    label: 'Helm Ops',
    icon:  'icon-storage',
  },
  [FLEET.BUNDLE]: {
    label: 'Bundles',
    icon:  'icon-storage',
  },
  [FLEET.BUNDLE_DEPLOYMENT]: {
    label: 'Bundle Deployments',
    icon:  'icon-storage',
  },
  [FLEET.CLUSTER]: {
    label: 'Fleet Clusters',
    icon:  'icon-host',
  },
  [FLEET.CLUSTER_GROUP]: {
    label: 'Cluster Groups',
    icon:  'icon-host',
  },
  [FLEET.WORKSPACE]: {
    label: 'Workspaces',
    icon:  'icon-namespace',
  },
  [FLEET.TOKEN]: {
    label: 'Registration Tokens',
    icon:  'icon-storage',
  },
};

// ── Pages that load Fleet data ──
const FLEET_PAGES = [
  {
    id:               'dashboard',
    page:             'Fleet Dashboard',
    file:             'shell/pages/c/_cluster/fleet/index.vue',
    store:            'management',
    fetchPattern:     'checkSchemasForFindAllHash (parallel)',
    usesPagination:   false,
    usesFieldExclude: true,
    resourcesLoaded:  [FLEET.WORKSPACE, FLEET.CLUSTER_GROUP, FLEET.BUNDLE, FLEET.GIT_REPO, FLEET.HELM_OP, FLEET.CLUSTER],
    notes:            'Loads ALL 6 Fleet types with findAll. Bundles use excludeFields for spec.resources. No server-side filtering.',
  },
  {
    id:               'gitrepo-list',
    page:             'Git Repo List',
    file:             'shell/list/fleet.cattle.io.gitrepo.vue',
    store:            'management',
    fetchPattern:     'checkSchemasForFindAllHash + $fetchType',
    usesPagination:   false,
    usesFieldExclude: false,
    resourcesLoaded:  [FLEET.CLUSTER, FLEET.CLUSTER_GROUP, FLEET.GIT_REPO, FLEET.WORKSPACE],
    notes:            'Loads 4 types. Clusters & groups fetched just for schema validation (not displayed). No field exclusion.',
  },
  {
    id:               'helmop-list',
    page:             'Helm Op List',
    file:             'shell/list/fleet.cattle.io.helmop.vue',
    store:            'management',
    fetchPattern:     'checkSchemasForFindAllHash + $fetchType',
    usesPagination:   false,
    usesFieldExclude: false,
    resourcesLoaded:  [FLEET.CLUSTER, FLEET.CLUSTER_GROUP, FLEET.HELM_OP, FLEET.WORKSPACE],
    notes:            'Same pattern as Git Repo list. Loads 4 types with no pagination.',
  },
  {
    id:               'cluster-list',
    page:             'Fleet Cluster List',
    file:             'shell/list/fleet.cattle.io.cluster.vue',
    store:            'management',
    fetchPattern:     '$fetchType × 3',
    usesPagination:   false,
    usesFieldExclude: false,
    resourcesLoaded:  [FLEET.CLUSTER, FLEET.WORKSPACE, MANAGEMENT.CLUSTER],
    notes:            'Loads ALL management clusters to cross-reference with fleet clusters. Filters out Harvester client-side.',
  },
  {
    id:               'bundle-list',
    page:             'Bundle List',
    file:             'shell/list/fleet.cattle.io.bundle.vue',
    store:            'management',
    fetchPattern:     '$fetchType + conditional',
    usesPagination:   false,
    usesFieldExclude: false,
    resourcesLoaded:  [FLEET.BUNDLE, FLEET.CLUSTER],
    notes:            'Loads all bundles + all fleet clusters (if schema exists). Clusters used only to filter Harvester bundles.',
  },
  {
    id:               'token-list',
    page:             'Token List',
    file:             'shell/list/fleet.cattle.io.clusterregistrationtoken.vue',
    store:            'management',
    fetchPattern:     '$fetchType + conditional',
    usesPagination:   false,
    usesFieldExclude: false,
    resourcesLoaded:  [FLEET.TOKEN, FLEET.CLUSTER],
    notes:            'Same secondary-resource pattern as bundles — loads clusters just for Harvester filtering.',
  },
];

// ── Performance Improvement Opportunities ──
const IMPROVEMENTS = [
  {
    id:            'pagination',
    title:         'Server-Side Pagination',
    category:      'pagination',
    impact:        'high',
    description:   'Fleet list pages use findAll (loads ALL resources). Switching to findPage with page/pagesize params reduces memory and transfer.',
    currentCode:   `await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });`,
    improvedCode:  `await this.$store.dispatch('management/findPage', {\n  type: FLEET.BUNDLE,\n  opt: { pagination: { page: 1, pageSize: 100 } }\n});`,
    affectedPages: ['dashboard', 'bundle-list'],
    apiParam:      'page=1&pagesize=100',
  },
  {
    id:            'field-exclusion',
    title:         'Field Exclusion (exclude=)',
    category:      'payload',
    impact:        'high',
    description:   'Most Fleet resources carry large metadata.managedFields. Only the dashboard excludes fields on bundles. All list pages should use excludeFields.',
    currentCode:   `// No field exclusion\nawait this.$fetchType(this.resource);`,
    improvedCode:  `await this.$store.dispatch('management/findAll', {\n  type: FLEET.GIT_REPO,\n  opt: { excludeFields: ['metadata.managedFields'] }\n});`,
    affectedPages: ['gitrepo-list', 'helmop-list', 'cluster-list', 'bundle-list', 'token-list'],
    apiParam:      'exclude=metadata.managedFields',
  },
  {
    id:            'server-filter',
    title:         'Server-Side Filtering',
    category:      'filtering',
    impact:        'medium',
    description:   'Fleet cluster list loads ALL management clusters then filters Harvester client-side. Server-side filter= param can exclude Harvester at the API level.',
    currentCode:   `// Loads all, filters in component\nconst allMgmt = await this.$fetchType(MANAGEMENT.CLUSTER);\nthis.filteredClusters = allMgmt.filter(c => c.status?.provider !== 'harvester');`,
    improvedCode:  `// Server-side filter — exclude Harvester\nawait this.$store.dispatch('management/findPage', {\n  type: MANAGEMENT.CLUSTER,\n  opt: {\n    pagination: {\n      filters: [{ fields: [{ field: 'status.provider', value: 'harvester', exact: false }], equality: '!=' }]\n    }\n  }\n});`,
    affectedPages: ['cluster-list', 'bundle-list', 'token-list'],
    apiParam:      'filter=status.provider!=harvester',
  },
  {
    id:            'summary-api',
    title:         'Summary API for Dashboard Cards',
    category:      'summary',
    impact:        'high',
    description:   'The Fleet dashboard loads all resources just to count states for cards. The Summary API returns counts by metadata.state.name without loading objects.',
    currentCode:   `// Dashboard loads ALL git repos to count states\nconst gitRepos = await findAll(FLEET.GIT_REPO);\nconst active = gitRepos.filter(r => r.state === 'active').length;`,
    improvedCode:  `// One lightweight request per type\nconst res = await this.$store.dispatch('management/request', {\n  url: '/v1/fleet.cattle.io.gitrepos?summary=metadata.state.name'\n});\n// res.summary → [{ property: "metadata.state.name", counts: { active: 38, error: 2 } }]`,
    affectedPages: ['dashboard'],
    apiParam:      'summary=metadata.state.name',
  },
  {
    id:            'workspace-filter',
    title:         'Workspace-Scoped Requests',
    category:      'filtering',
    impact:        'medium',
    description:   'Fleet pages load all resources then filter by workspace client-side. The projectsornamespaces param can scope requests to the selected workspace.',
    currentCode:   `// Loads all repos, filters by workspace annotation in component\nconst allRepos = getters['management/all'](FLEET.GIT_REPO);\nthis.repos = allRepos.filter(r => r.metadata.namespace === workspace);`,
    improvedCode:  `// Scope request to workspace namespace\nawait this.$store.dispatch('management/findPage', {\n  type: FLEET.GIT_REPO,\n  opt: {\n    pagination: {\n      projectsOrNamespaces: [{ projectOrNamespace: ['fleet-default'] }]\n    }\n  }\n});`,
    affectedPages: ['dashboard', 'gitrepo-list', 'helmop-list'],
    apiParam:      'projectsornamespaces=fleet-default',
  },
  {
    id:            'server-sort',
    title:         'Server-Side Sorting',
    category:      'sorting',
    impact:        'low',
    description:   'Sorting is done client-side after loading all resources. With pagination, sorting must be server-side to show correct pages.',
    currentCode:   `// Client-side sort in SortableTable component\nrows.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));`,
    improvedCode:  `// Server-side sort with findPage\nawait this.$store.dispatch('management/findPage', {\n  type: FLEET.GIT_REPO,\n  opt: {\n    pagination: {\n      sort: [{ field: 'metadata.creationTimestamp', asc: false }]\n    }\n  }\n});`,
    affectedPages: ['gitrepo-list', 'helmop-list', 'bundle-list', 'cluster-list'],
    apiParam:      'sort=-metadata.creationTimestamp',
  },
  {
    id:            'dedup-secondary',
    title:         'Deduplicate Secondary Resources',
    category:      'architecture',
    impact:        'medium',
    description:   'Multiple Fleet pages independently load the same secondary resources (workspaces, clusters) on every navigation. Shared store caching can avoid redundant requests.',
    currentCode:   `// Each page independently fetches workspaces\n// gitrepo-list: checkSchemasForFindAllHash({ workspaces: ... })\n// helmop-list: checkSchemasForFindAllHash({ workspaces: ... })\n// dashboard: checkSchemasForFindAllHash({ fleetWorkspaces: ... })`,
    improvedCode:  `// Use force: false to leverage Vuex cache\nawait this.$store.dispatch('management/findAll', {\n  type: FLEET.WORKSPACE,\n  opt: { force: false }  // Returns cached if already loaded\n});`,
    affectedPages: ['dashboard', 'gitrepo-list', 'helmop-list'],
    apiParam:      '(store caching — no API change)',
  },
];

export default {
  name:       'FleetPerformanceDashboard',
  components: { Loading, Banner },

  async fetch() {
    this.loading = true;

    try {
      // 1) Measure Fleet resource sizes — how much data is each type?
      const sizePromises = Object.keys(FLEET_TYPES).map(async(type) => {
        const schema = this.$store.getters['management/schemaFor'](type);

        if (!schema) {
          return {
            type, accessible: false, count: 0, error: `No schema for ${ type }`
          };
        }

        try {
          // Use a lightweight request to get counts without loading all objects
          const url = `/v1/${ type }?limit=0`;
          const res = await this.$store.dispatch('management/request', { url });

          return {
            type,
            accessible: true,
            count:      res?.count ?? res?.data?.length ?? 0,
            revision:   res?.revision ?? null,
            error:      null,
          };
        } catch (e) {
          return {
            type, accessible: false, count: 0, error: e.message || 'Failed'
          };
        }
      });

      this.resourceSizes = await Promise.all(sizePromises);

      // 2) Summary API probe — test if summary param works on Fleet types
      const summaryProbes = [FLEET.GIT_REPO, FLEET.BUNDLE, FLEET.CLUSTER, FLEET.BUNDLE_DEPLOYMENT].map(async(type) => {
        const schema = this.$store.getters['management/schemaFor'](type);

        if (!schema) {
          return {
            type, supported: false, data: null, error: `No schema`
          };
        }

        try {
          const res = await this.$store.dispatch('management/request', { url: `/v1/${ type }?summary=metadata.state.name` });

          return {
            type,
            supported: !!(res?.summary),
            data:      res?.summary || [],
            error:     null,
          };
        } catch (e) {
          return {
            type, supported: false, data: null, error: e.message || 'Not supported'
          };
        }
      });

      this.summaryResults = await Promise.all(summaryProbes);

      // 3) Pagination probe — test if page/pagesize works on Fleet types
      const paginationProbes = [FLEET.GIT_REPO, FLEET.BUNDLE, FLEET.CLUSTER].map(async(type) => {
        const schema = this.$store.getters['management/schemaFor'](type);

        if (!schema) {
          return {
            type, works: false, error: 'No schema'
          };
        }

        try {
          const res = await this.$store.dispatch('management/request', { url: `/v1/${ type }?page=1&pagesize=5&exclude=metadata.managedFields` });

          return {
            type,
            works:      true,
            pageCount:  res?.data?.length ?? 0,
            totalCount: res?.count ?? 0,
            pages:      res?.pages ?? 0,
            error:      null,
          };
        } catch (e) {
          return {
            type, works: false, error: e.message || 'Failed'
          };
        }
      });

      this.paginationResults = await Promise.all(paginationProbes);

      // 4) Field exclusion probe — compare response sizes
      const exclusionType = FLEET.GIT_REPO;
      const exclusionSchema = this.$store.getters['management/schemaFor'](exclusionType);

      if (exclusionSchema) {
        try {
          const [withFields, withoutFields] = await Promise.all([
            this.$store.dispatch('management/request', { url: `/v1/${ exclusionType }?limit=5` }),
            this.$store.dispatch('management/request', { url: `/v1/${ exclusionType }?limit=5&exclude=metadata.managedFields` }),
          ]);

          this.fieldExclusion = {
            type:        exclusionType,
            withSize:    JSON.stringify(withFields).length,
            withoutSize: JSON.stringify(withoutFields).length,
            count:       withFields?.data?.length ?? 0,
            savings:     0,
          };
          if (this.fieldExclusion.withSize > 0) {
            this.fieldExclusion.savings = Math.round(
              (1 - this.fieldExclusion.withoutSize / this.fieldExclusion.withSize) * 100
            );
          }
        } catch (e) {
          this.fieldExclusion = { type: exclusionType, error: e.message };
        }
      }

      // 5) Existing COUNT store data
      try {
        const inStore = this.$store.getters['currentStore'](COUNT);

        this.existingCounts = this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
      } catch (e) {
        this.existingCounts = {};
      }
    } catch (e) {
      this.fetchError = e.message || 'Failed to load Fleet performance data';
    } finally {
      this.loading = false;
    }
  },

  data() {
    return {
      loading:           true,
      resourceSizes:     [],
      summaryResults:    [],
      paginationResults: [],
      fieldExclusion:    null,
      existingCounts:    {},
      fetchError:        null,
      FLEET_TYPES,
      FLEET_PAGES,
      IMPROVEMENTS,
    };
  },

  computed: {
    totalResources() {
      return this.resourceSizes.reduce((sum, r) => sum + (r.count || 0), 0);
    },

    accessibleTypes() {
      return this.resourceSizes.filter((r) => r.accessible).length;
    },

    sortedResourceSizes() {
      return [...this.resourceSizes].sort((a, b) => b.count - a.count);
    },

    summarySupported() {
      return this.summaryResults.filter((r) => r.supported).length;
    },

    paginationSupported() {
      return this.paginationResults.filter((r) => r.works).length;
    },

    improvementsByImpact() {
      const order = {
        high: 0, medium: 1, low: 2
      };

      return [...IMPROVEMENTS].sort((a, b) => order[a.impact] - order[b.impact]);
    },
  },

  methods: {
    stateColor(state) {
      const colors = {
        running:        '#27AE60',
        active:         '#27AE60',
        ready:          '#27AE60',
        completed:      '#8E8E8E',
        succeeded:      '#8E8E8E',
        waiting:        '#F39C12',
        pending:        '#F39C12',
        modifiedstatus: '#F39C12',
        outofsync:      '#F39C12',
        failed:         '#E74C3C',
        error:          '#E74C3C',
        errapplied:     '#E74C3C',
      };

      return colors[state.toLowerCase()] || '#3498DB';
    },

    barColor(index) {
      const palette = [
        '#3498DB', '#2ECC71', '#E67E22', '#9B59B6',
        '#1ABC9C', '#E74C3C', '#F1C40F', '#34495E',
        '#16A085', '#D35400', '#8E44AD', '#2C3E50',
      ];

      return palette[index % palette.length];
    },

    impactColor(impact) {
      return {
        high: '#E74C3C', medium: '#F39C12', low: '#3498DB'
      }[impact] || '#8E8E8E';
    },

    sortedEntries(obj) {
      return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    },

    maxCount(obj) {
      const vals = Object.values(obj);

      return vals.length ? Math.max(...vals) : 1;
    },

    formatBytes(bytes) {
      if (bytes < 1024) {
        return `${ bytes } B`;
      }

      return `${ (bytes / 1024).toFixed(1) } KB`;
    },

    pagesForType(type) {
      return FLEET_PAGES.filter((p) => p.resourcesLoaded.includes(type));
    },
  },
};
</script>

<template>
  <Loading v-if="loading || $fetchState.pending" />
  <div
    v-else
    class="fleet-perf-dashboard"
  >
    <!-- ━━━ Page Header ━━━ -->
    <h1 class="mb-10">
      <i class="icon icon-info mr-10" /> Fleet Performance Investigation
    </h1>
    <p class="page-subtitle mb-10">
      Investigating how Fleet pages load data and where
      <strong>pagination</strong>, <strong>server-side filtering</strong>,
      <strong>field exclusion</strong>, and the <strong>Summary API</strong>
      can improve performance.
    </p>
    <p class="page-subtitle mb-20">
      Currently all Fleet pages use <code>findAll</code> (no pagination) via the
      <code>management</code> store. This page probes real API responses to measure
      impact and compatibility.
    </p>

    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ Section 1: Fleet Resource Inventory ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">1</span>
        Fleet Resource Inventory
      </h2>
      <p class="description mt-5 mb-15">
        How many resources of each Fleet type exist? The more resources, the bigger the
        performance gain from pagination and filtering.
        Fetched via <code>GET /v1/{type}?limit=0</code> to read counts without loading data.
      </p>

      <div class="totals-grid mb-20">
        <div class="total-card total-card-primary">
          <span class="total-number">{{ totalResources }}</span>
          <span class="total-label">Total Fleet Resources</span>
        </div>
        <div class="total-card">
          <span class="total-number">{{ accessibleTypes }}</span>
          <span class="total-label">Types Accessible</span>
        </div>
        <div class="total-card">
          <span class="total-number">{{ Object.keys(FLEET_TYPES).length }}</span>
          <span class="total-label">Types Checked</span>
        </div>
      </div>

      <div class="resource-grid">
        <div
          v-for="(item, idx) in sortedResourceSizes"
          :key="item.type"
          class="resource-card"
        >
          <div class="resource-header">
            <h3>
              <i :class="['icon', (FLEET_TYPES[item.type] || {}).icon || 'icon-storage', 'mr-5']" />
              {{ (FLEET_TYPES[item.type] || {}).label || item.type }}
            </h3>
            <span class="resource-total">{{ item.count }}</span>
          </div>
          <div class="resource-type-badge">
            {{ item.type }}
          </div>

          <Banner
            v-if="item.error"
            color="warning"
            class="mt-10"
          >
            {{ item.error }}
          </Banner>

          <div
            v-else
            class="mt-10"
          >
            <div class="insight-bar-row">
              <span class="insight-bar-label">count</span>
              <div class="insight-bar-track">
                <div
                  class="insight-bar-fill"
                  :style="{
                    width: (item.count / (sortedResourceSizes[0]?.count || 1) * 100) + '%',
                    backgroundColor: barColor(idx)
                  }"
                />
              </div>
              <span class="insight-bar-count">{{ item.count }}</span>
            </div>
            <div class="loaded-by mt-5">
              <span class="loaded-by-label">Loaded by:</span>
              <span
                v-for="page in pagesForType(item.type)"
                :key="page.id"
                class="page-badge"
              >{{ page.page }}</span>
              <span
                v-if="pagesForType(item.type).length === 0"
                class="page-badge page-badge-none"
              >No page loads this directly</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ━━━ Section 2: Current Fetch Patterns ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">2</span>
        Current Fleet Page Fetch Patterns
      </h2>
      <p class="description mt-5 mb-15">
        How each Fleet page currently loads data. Red markers show missing optimizations.
      </p>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Resources Loaded</th>
            <th>Pattern</th>
            <th>Pagination</th>
            <th>Field Exclude</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="page in FLEET_PAGES"
            :key="page.id"
          >
            <td>
              <strong>{{ page.page }}</strong>
              <div class="cell-subtext">
                {{ page.file }}
              </div>
            </td>
            <td>{{ page.resourcesLoaded.length }} types</td>
            <td><code>{{ page.fetchPattern }}</code></td>
            <td>
              <span :class="['status-badge', page.usesPagination ? 'status-yes' : 'status-no']">
                {{ page.usesPagination ? '✓ Yes' : '✗ No' }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', page.usesFieldExclude ? 'status-yes' : 'status-no']">
                {{ page.usesFieldExclude ? '✓ Yes' : '✗ No' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="note-box mt-15">
        <strong>Key observation:</strong> Every Fleet list page uses <code>findAll</code> — loading the
        <strong>entire collection</strong> into the Vuex store. No page uses <code>findPage</code> for
        server-side pagination. Only the Dashboard applies <code>excludeFields</code> on bundles.
      </div>
    </div>

    <!-- ━━━ Section 3: Summary API Compatibility ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">3</span>
        Summary API Compatibility
      </h2>
      <p class="description mt-5 mb-15">
        Does the <code>?summary=</code> parameter work on Fleet resource types?
        Each card probes <code>GET /v1/{type}?summary=metadata.state.name</code>.
      </p>

      <div class="totals-grid mb-20">
        <div class="total-card total-card-primary">
          <span class="total-number">{{ summarySupported }}</span>
          <span class="total-label">Summary Supported</span>
        </div>
        <div class="total-card">
          <span class="total-number">{{ summaryResults.length }}</span>
          <span class="total-label">Types Probed</span>
        </div>
      </div>

      <div class="insight-grid">
        <div
          v-for="(result, rIdx) in summaryResults"
          :key="result.type"
          class="insight-card"
        >
          <div class="insight-header">
            <h3>
              <i :class="['icon', (FLEET_TYPES[result.type] || {}).icon || 'icon-storage', 'mr-5']" />
              {{ (FLEET_TYPES[result.type] || {}).label || result.type }}
            </h3>
            <span
              :class="['status-badge', result.supported ? 'status-yes' : 'status-no']"
            >
              {{ result.supported ? '✓ Works' : '✗ No' }}
            </span>
          </div>

          <div class="insight-api">
            <code>GET /v1/{{ result.type }}?summary=metadata.state.name</code>
          </div>

          <Banner
            v-if="result.error"
            color="warning"
            class="mt-10"
          >
            {{ result.error }}
          </Banner>

          <div
            v-else-if="result.data && result.data.length"
            class="mt-10"
          >
            <div
              v-for="s in result.data"
              :key="s.property"
              class="mb-10"
            >
              <h4 class="prop-label">
                {{ s.property }}
              </h4>
              <div class="insight-bars">
                <div
                  v-for="([key, count], idx) in sortedEntries(s.counts || {}).slice(0, 8)"
                  :key="key"
                  class="insight-bar-row"
                >
                  <span class="insight-bar-label">{{ key || '(empty)' }}</span>
                  <div class="insight-bar-track">
                    <div
                      class="insight-bar-fill"
                      :style="{
                        width: (count / maxCount(s.counts) * 100) + '%',
                        backgroundColor: stateColor(key) !== '#3498DB' ? stateColor(key) : barColor(rIdx * 3 + idx)
                      }"
                    />
                  </div>
                  <span class="insight-bar-count">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>

          <details class="mt-10">
            <summary class="raw-toggle">
              Raw API Response
            </summary>
            <pre class="raw-json">{{ JSON.stringify(result.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- ━━━ Section 4: Pagination Probe ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">4</span>
        Pagination Probe
      </h2>
      <p class="description mt-5 mb-15">
        Does <code>page=1&amp;pagesize=5</code> work on Fleet types?
        If it returns page metadata, the type supports server-side pagination.
      </p>

      <div class="insight-grid">
        <div
          v-for="result in paginationResults"
          :key="result.type"
          class="insight-card"
        >
          <div class="insight-header">
            <h3>
              <i :class="['icon', (FLEET_TYPES[result.type] || {}).icon || 'icon-storage', 'mr-5']" />
              {{ (FLEET_TYPES[result.type] || {}).label || result.type }}
            </h3>
            <span :class="['status-badge', result.works ? 'status-yes' : 'status-no']">
              {{ result.works ? '✓ Works' : '✗ No' }}
            </span>
          </div>

          <div class="insight-api">
            <code>GET /v1/{{ result.type }}?page=1&amp;pagesize=5&amp;exclude=metadata.managedFields</code>
          </div>

          <Banner
            v-if="result.error"
            color="warning"
            class="mt-10"
          >
            {{ result.error }}
          </Banner>

          <div
            v-else-if="result.works"
            class="pagination-stats mt-10"
          >
            <div class="stat-row">
              <span class="stat-label">Items returned</span>
              <span class="stat-value">{{ result.pageCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Total count</span>
              <span class="stat-value">{{ result.totalCount }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Total pages (at pagesize=5)</span>
              <span class="stat-value">{{ result.pages || Math.ceil(result.totalCount / 5) }}</span>
            </div>
            <div class="stat-row highlight">
              <span class="stat-label">Data savings (page 1 vs all)</span>
              <span class="stat-value">
                {{ result.totalCount > 0 ? Math.round((1 - result.pageCount / result.totalCount) * 100) : 0 }}%
                fewer resources transferred
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ━━━ Section 5: Field Exclusion Impact ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">5</span>
        Field Exclusion Impact
      </h2>
      <p class="description mt-5 mb-15">
        How much payload does <code>exclude=metadata.managedFields</code> save?
        Comparing response sizes for the same request with and without exclusion.
      </p>

      <div
        v-if="fieldExclusion && !fieldExclusion.error"
        class="exclusion-comparison"
      >
        <div class="exclusion-card">
          <h3>Without exclude=</h3>
          <div class="insight-api mb-10">
            <code>GET /v1/{{ fieldExclusion.type }}?limit=5</code>
          </div>
          <span class="exclusion-size">{{ formatBytes(fieldExclusion.withSize) }}</span>
          <span class="exclusion-label">
            {{ fieldExclusion.count }} resources
          </span>
        </div>
        <div class="exclusion-arrow">
          →
        </div>
        <div class="exclusion-card exclusion-card-improved">
          <h3>With exclude=metadata.managedFields</h3>
          <div class="insight-api mb-10">
            <code>GET /v1/{{ fieldExclusion.type }}?limit=5&amp;exclude=metadata.managedFields</code>
          </div>
          <span class="exclusion-size">{{ formatBytes(fieldExclusion.withoutSize) }}</span>
          <span class="exclusion-label">
            {{ fieldExclusion.count }} resources
          </span>
        </div>
        <div class="exclusion-card exclusion-card-savings">
          <h3>Savings</h3>
          <span class="exclusion-size savings-number">{{ fieldExclusion.savings }}%</span>
          <span class="exclusion-label">smaller payload</span>
        </div>
      </div>
      <Banner
        v-else-if="fieldExclusion && fieldExclusion.error"
        color="warning"
      >
        Could not measure field exclusion: {{ fieldExclusion.error }}
      </Banner>
      <div
        v-else
        class="insight-empty"
      >
        No Git Repos available to measure field exclusion impact.
      </div>
    </div>

    <!-- ━━━ Section 6: Performance Improvement Opportunities ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">6</span>
        Performance Improvement Opportunities
      </h2>
      <p class="description mt-5 mb-15">
        Actionable improvements ranked by impact. Each shows the current code pattern,
        the improved version, and which pages benefit.
      </p>

      <div class="improvements-list">
        <div
          v-for="imp in improvementsByImpact"
          :key="imp.id"
          class="improvement-card"
        >
          <div class="improvement-header">
            <h3>{{ imp.title }}</h3>
            <span
              class="impact-badge"
              :style="{ backgroundColor: impactColor(imp.impact) }"
            >{{ imp.impact }} impact</span>
          </div>
          <p class="improvement-desc">
            {{ imp.description }}
          </p>
          <div class="improvement-api mb-10">
            <span class="api-param-label">API param:</span>
            <code>{{ imp.apiParam }}</code>
          </div>
          <div class="code-comparison">
            <div class="code-block code-block-current">
              <h4>Current</h4>
              <pre>{{ imp.currentCode }}</pre>
            </div>
            <div class="code-block code-block-improved">
              <h4>Improved</h4>
              <pre>{{ imp.improvedCode }}</pre>
            </div>
          </div>
          <div class="affected-pages mt-10">
            <span class="affected-label">Affected pages:</span>
            <span
              v-for="pageId in imp.affectedPages"
              :key="pageId"
              class="page-badge"
            >{{ (FLEET_PAGES.find(p => p.id === pageId) || {}).page || pageId }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ━━━ Section 7: API Quick Reference ━━━ -->
    <div class="section mb-30">
      <h2>
        <span class="section-number">7</span>
        API Quick Reference
      </h2>
      <p class="description mt-10 mb-15">
        Steve API parameters available for performance optimization.
        All apply to <code>/v1/{type}</code> endpoints.
      </p>

      <table class="api-ref-table mt-5">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Format</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>page</code> + <code>pagesize</code></td>
            <td><code>page=1&amp;pagesize=100</code></td>
            <td>Server-side pagination — load one page at a time</td>
          </tr>
          <tr>
            <td><code>sort</code></td>
            <td><code>sort=field,-field2</code></td>
            <td>Server-side sorting — prefix with <code>-</code> for descending</td>
          </tr>
          <tr>
            <td><code>filter</code></td>
            <td><code>filter=field=value</code></td>
            <td>Server-side filtering — operators: <code>=</code>, <code>!=</code>, <code>~</code>, <code>IN</code>, <code>NOTIN</code></td>
          </tr>
          <tr>
            <td><code>projectsornamespaces</code></td>
            <td><code>projectsornamespaces=ns1,ns2</code></td>
            <td>Scope to specific namespaces/projects (workspace filtering)</td>
          </tr>
          <tr>
            <td><code>exclude</code></td>
            <td><code>exclude=metadata.managedFields</code></td>
            <td>Omit large fields from response — reduces payload size</td>
          </tr>
          <tr>
            <td><code>summary</code></td>
            <td><code>summary=metadata.state.name</code></td>
            <td>Return property-value counts instead of loading resources</td>
          </tr>
          <tr>
            <td><code>limit</code></td>
            <td><code>limit=0</code></td>
            <td>Get count metadata only, no resource data</td>
          </tr>
        </tbody>
      </table>

      <h3 class="mt-20 mb-10">
        Store Dispatch Patterns
      </h3>
      <div class="syntax-block mb-10">
        <code>// findAll — loads everything (current Fleet pattern)</code>
      </div>
      <div class="syntax-block mb-10">
        <code>await this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO });</code>
      </div>
      <div class="syntax-block mb-10">
        <code>// findPage — server-side pagination (recommended)</code>
      </div>
      <div class="syntax-block mb-10">
        <code>await this.$store.dispatch('management/findPage', { type: FLEET.GIT_REPO, opt: { pagination: { page: 1, pageSize: 100 } } });</code>
      </div>
      <div class="syntax-block mb-10">
        <code>// Direct request — for summary/count queries</code>
      </div>
      <div class="syntax-block">
        <code>await this.$store.dispatch('management/request', { url: '/v1/fleet.cattle.io.gitrepos?summary=metadata.state.name' });</code>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fleet-perf-dashboard {
  padding: 0 20px;

  h1 {
    display: flex;
    align-items: center;
  }

  .page-subtitle {
    color: var(--text-muted);
    font-size: 1.05em;
    line-height: 1.5;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }
  }

  .description {
    color: var(--text-muted);
    line-height: 1.6;

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.9em;
    }
  }

  .section {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 20px;
    background: var(--box-bg);

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .section-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--link);
    color: #fff;
    font-size: 0.75em;
    font-weight: bold;
    flex-shrink: 0;
  }

  // --- Totals ---
  .totals-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .total-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 25px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--body-bg);
    min-width: 120px;

    &.total-card-primary {
      border-color: var(--link);
      min-width: 160px;
    }

    .total-number {
      font-size: 2em;
      font-weight: bold;
    }

    .total-label {
      font-size: 0.85em;
      color: var(--text-muted);
      text-transform: capitalize;
      margin-top: 5px;
    }
  }

  // --- Resource Cards ---
  .resource-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .resource-card {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 15px;
    background: var(--body-bg);

    .resource-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
      }

      .resource-total {
        font-size: 1.8em;
        font-weight: bold;
        color: var(--link);
      }
    }

    .resource-type-badge {
      font-size: 0.75em;
      font-family: monospace;
      color: var(--text-muted);
      margin-top: 2px;
    }
  }

  .loaded-by {
    font-size: 0.82em;

    .loaded-by-label {
      color: var(--text-muted);
      margin-right: 5px;
    }
  }

  .page-badge {
    display: inline-block;
    background: var(--link);
    color: #fff;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 0.8em;
    margin: 2px 3px;

    &.page-badge-none {
      background: var(--border);
      color: var(--text-muted);
    }
  }

  // --- Insight Cards ---
  .insight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
  }

  .insight-card {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 15px;
    background: var(--body-bg);

    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
      }
    }

    .insight-api {
      margin-top: 8px;

      code {
        display: inline-block;
        background: var(--body-bg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 0.75em;
        word-break: break-all;
      }
    }

    .prop-label {
      font-size: 0.8em;
      font-family: monospace;
      color: var(--text-muted);
      margin: 0 0 5px;
    }
  }

  .insight-bars, .insight-bar-row {
    display: flex;
    align-items: center;
    padding: 3px 0;
    gap: 10px;
  }

  .insight-bars {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .insight-bar-label {
    min-width: 120px;
    font-size: 0.82em;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .insight-bar-track {
    flex: 1;
    height: 10px;
    background: var(--border);
    border-radius: 5px;
    overflow: hidden;
  }

  .insight-bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .insight-bar-count {
    font-weight: 600;
    font-size: 0.85em;
    min-width: 35px;
    text-align: right;
  }

  .insight-empty {
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.9em;
  }

  // --- Status Badges ---
  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 0.8em;
    font-weight: 600;

    &.status-yes {
      background: #27AE60;
      color: #fff;
    }

    &.status-no {
      background: #E74C3C;
      color: #fff;
    }
  }

  // --- Pagination Stats ---
  .pagination-stats {
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9em;

      &.highlight {
        border-bottom: none;
        font-weight: 600;
        color: #27AE60;
      }

      .stat-label {
        color: var(--text-muted);
      }

      .stat-value {
        font-weight: 600;
      }
    }
  }

  // --- Field Exclusion Comparison ---
  .exclusion-comparison {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    .exclusion-arrow {
      font-size: 2em;
      color: var(--text-muted);
    }

    .exclusion-card {
      flex: 1;
      min-width: 200px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 15px;
      background: var(--body-bg);
      text-align: center;

      h3 {
        font-size: 0.85em;
        margin: 0 0 10px;
        color: var(--text-muted);
      }

      &.exclusion-card-improved {
        border-color: #27AE60;
      }

      &.exclusion-card-savings {
        border-color: var(--link);
        background: var(--box-bg);
      }

      .exclusion-size {
        display: block;
        font-size: 1.8em;
        font-weight: bold;
        color: var(--link);
      }

      .savings-number {
        color: #27AE60;
      }

      .exclusion-label {
        font-size: 0.85em;
        color: var(--text-muted);
        margin-top: 5px;
        display: block;
      }
    }
  }

  // --- Improvements ---
  .improvements-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .improvement-card {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 20px;
    background: var(--body-bg);

    .improvement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h3 {
        margin: 0;
      }
    }

    .impact-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 10px;
      font-size: 0.75em;
      font-weight: 600;
      color: #fff;
      text-transform: uppercase;
    }

    .improvement-desc {
      font-size: 0.9em;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 0 0 10px;
    }

    .improvement-api {
      .api-param-label {
        font-size: 0.85em;
        color: var(--text-muted);
        margin-right: 5px;
      }

      code {
        background: var(--body-bg);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 0.85em;
      }
    }
  }

  .code-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;

    .code-block {
      border-radius: var(--border-radius);
      overflow: hidden;

      h4 {
        margin: 0;
        padding: 6px 12px;
        font-size: 0.75em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      pre {
        margin: 0;
        padding: 10px 12px;
        font-size: 0.78em;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.5;
      }

      &.code-block-current {
        border: 1px solid #E74C3C;

        h4 {
          background: #E74C3C;
          color: #fff;
        }

        pre {
          background: var(--body-bg);
        }
      }

      &.code-block-improved {
        border: 1px solid #27AE60;

        h4 {
          background: #27AE60;
          color: #fff;
        }

        pre {
          background: var(--body-bg);
        }
      }
    }
  }

  .affected-pages {
    .affected-label {
      font-size: 0.85em;
      color: var(--text-muted);
      margin-right: 5px;
    }
  }

  // --- Note Box ---
  .note-box {
    background: var(--body-bg);
    border: 1px solid var(--link);
    border-left-width: 4px;
    border-radius: var(--border-radius);
    padding: 12px 16px;
    font-size: 0.9em;
    line-height: 1.6;

    code {
      background: var(--box-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }
  }

  // --- Tables ---
  .cell-subtext {
    font-size: 0.75em;
    font-family: monospace;
    color: var(--text-muted);
    margin-top: 2px;
  }

  // --- Shared ---
  .raw-toggle {
    cursor: pointer;
    font-size: 0.85em;
    color: var(--link);
    user-select: none;
  }

  .raw-json {
    margin-top: 10px;
    padding: 10px;
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    font-size: 0.8em;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .syntax-block {
    background: var(--body-bg);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 10px 16px;

    code {
      font-size: 0.9em;
    }
  }

  .comparison-table,
  .api-ref-table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: var(--body-bg);
      font-weight: 600;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    code {
      background: var(--body-bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.85em;
    }
  }
}
</style>
