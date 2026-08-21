<script lang="ts">
import { defineComponent } from 'vue';
import { mapPref, AFTER_LOGIN_ROUTE, HIDE_HOME_PAGE_CARDS } from '@shell/store/prefs';
import BannerGraphic from '@shell/components/BannerGraphic.vue';
import IndentedPanel from '@shell/components/IndentedPanel.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { BadgeState } from '@components/BadgeState';
import CommunityLinks from '@shell/components/CommunityLinks.vue';
import SingleClusterInfo from '@shell/components/SingleClusterInfo.vue';
import DynamicContentBanner from '@shell/components/DynamicContent/DynamicContentBanner.vue';
import DynamicContentPanel from '@shell/components/DynamicContent/DynamicContentPanel.vue';
import { mapGetters, mapState } from 'vuex';
import {
  MANAGEMENT, CAPI, COUNT, SAVED_COUNTS, CONFIG_MAP
} from '@shell/config/types';
import TemplateCode from '@shell/pages/c/_cluster/_template/TemplateCode.vue';
import HomeConfigChat from '@shell/components/HomeConfigChat.vue';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { AGE, MGMT_CLUSTER_KUBE_VERSION, MGMT_CLUSTER_PROVIDER, STATE } from '@shell/config/table-headers';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { createMemoryFormat, formatSi, parseSi, createMemoryValues } from '@shell/utils/units';
import { markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import { getVendor } from '@shell/config/private-label';
import { mapFeature, MULTI_CLUSTER } from '@shell/store/features';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { paginationFilterClusters } from '@shell/utils/cluster';
import TabTitle from '@shell/components/TabTitle.vue';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';

import { SET_LOGIN_ACTION, SHOW_HIDE_BANNER_ACTION } from '@shell/config/page-actions';
import { STEVE_MGMT_CLUSTER_KUBE_VERSION, STEVE_MGMT_CLUSTER_PROVIDER, STEVE_MGMT_STATE_COL, STEVE_NAME_COL } from '@shell/config/pagination-table-headers';
import { PaginationParamFilter, FilterArgs, PaginationFilterField, PaginationArgs } from '@shell/types/store/pagination.types';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { CURRENT_RANCHER_VERSION, getVersionData } from '@shell/config/version';
import paginationUtils from '@shell/utils/pagination-utils';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Preset from '@shell/mixins/preset';
import { PaginationFeatureHomePageClusterConfig } from '@shell/types/resources/settings';
import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import ManagementClusterUtils from '@shell/list/utils/management.cattle.io.cluster.utils';
import { RcButton } from '@components/RcButton';

// Runtime "custom home", with SAVED templates vs APPLIED pointers:
// - SAVED   = ConfigMaps labelled `templates.rancher.io/home-saved: "true"` (a pool of home
//             definitions, each with data["view.vue"] + data.meta.name). The editor edits these.
// - APPLIED = the `home-applied` ConfigMap holding POINTERS: data.global = <savedName>, and
//             data["<userId>"] = <savedName> per user. What a user SEES = their user pointer
//             if set, else the global pointer → render that SAVED's view.vue.
// Editing previews the SELECTED saved (live draft); SAVE persists to that saved; closing the
// editor reverts to the applied one. APPLY GLOBAL / MY USER just repoints `home-applied`.
const NS = 'default';
const SAVED_LABEL = 'templates.rancher.io/home-saved';
const APPLIED_NAME = 'home-applied';
const APPLIED_ID = `${ NS }/${ APPLIED_NAME }`;
const GLOBAL_KEY = 'global';
const DEFAULT_SAVED = 'home';
const CODE_SOURCE_KEY = 'view.vue';
const CODE_META_KEY = 'meta';

export default defineComponent({
  name:       'Home',
  layout:     'home',
  components: {
    BannerGraphic,
    IndentedPanel,
    PaginatedResourceTable,
    BadgeState,
    CommunityLinks,
    SingleClusterInfo,
    TabTitle,
    ResourceTable,
    DynamicContentBanner,
    DynamicContentPanel,
    RcButton,
    TemplateCode,
    HomeConfigChat
  },

  mixins: [PageHeaderActions, Preset],

  data() {
    const options = this.$store.getters[`type-map/optionsFor`](CAPI.RANCHER_CLUSTER)?.custom || {};
    const params = {
      product:  MANAGER,
      cluster:  BLANK_CLUSTER,
      resource: CAPI.RANCHER_CLUSTER
    };
    const defaultCreateLocation = {
      name: 'c-cluster-product-resource-create',
      params,
    };
    const defaultImportLocation = {
      ...defaultCreateLocation,
      query: { [MODE]: _IMPORT }
    };

    const cpuHeader = {
      label:  this.t('tableHeaders.cpu'),
      value:  '',
      name:   'cpu',
      sort:   ['status.allocatable.cpuRaw'],
      search: ['status.allocatable.cpuRaw'],
    };
    const memoryHeader = {
      label:  this.t('tableHeaders.memory'),
      value:  '',
      name:   'memory',
      sort:   ['status.allocatable.memoryRaw'],
      search: ['status.allocatable.memoryRaw'],
    };
    const podsHeader = {
      label:        this.t('tableHeaders.pods'),
      name:         'pods',
      value:        '',
      sort:         ['status.allocatable.pods', 'status.requested.pods'],
      search:       ['status.allocatable.pods', 'status.requested.pods'],
      formatter:    'PodsUsage',
      delayLoading: true
    };

    return {
      HIDE_HOME_PAGE_CARDS,
      // Page actions don't change on the Home Page
      pageActions: [
        {
          label:  this.t('nav.header.setLoginPage'),
          action: SET_LOGIN_ACTION
        },
        { divider: true },
        {
          label:  this.t('nav.header.showHideBanner'),
          action: SHOW_HIDE_BANNER_ACTION
        },
      ],
      vendor: getVendor(),

      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      mgmtClusterSchema: this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),

      canViewMgmtClusters: !!this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),

      manageLocation: {
        name:   'c-cluster-product-resource',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      },

      createLocation: options.createLocation ? options.createLocation(params) : defaultCreateLocation,

      importLocation: options.importLocation ? options.importLocation(params) : defaultImportLocation,

      headers: [
        STATE,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
        },
        {
          ...MGMT_CLUSTER_PROVIDER,
          labelKey: 'landing.clusters.provider',
          subLabel: this.t('landing.clusters.distro'),
        },
        {
          ...MGMT_CLUSTER_KUBE_VERSION,
          labelKey: 'landing.clusters.kubernetesVersion',
          subLabel: this.t('landing.clusters.architecture'),
        },
        cpuHeader,
        memoryHeader,
        podsHeader,
        // {
        //   name:  'explorer',
        //   label:  this.t('landing.clusters.explorer')
        // }
      ],

      paginationHeaders: [
        STEVE_MGMT_STATE_COL,
        {
          ...STEVE_NAME_COL,
          canBeVariable: true,
          value:         `spec.displayName`,
          sort:          [`spec.displayName`],
          search:        `spec.displayName`,
        },
        {
          ...STEVE_MGMT_CLUSTER_PROVIDER,
          labelKey: 'landing.clusters.provider',
          subLabel: this.t('landing.clusters.distro'),
        },
        {
          ...STEVE_MGMT_CLUSTER_KUBE_VERSION,
          labelKey: 'landing.clusters.kubernetesVersion',
          subLabel: this.t('landing.clusters.architecture'),
        },
        cpuHeader,
        memoryHeader,
        podsHeader,
      ],
      paginationContext: 'home',

      clusterCount: 0,

      CURRENT_RANCHER_VERSION,

      /**
       * User has decided to disable the alt list
       */
      altClusterListDisabled: false,
      /**
       * There are too many clusters to show in the home page list.
       *
       * If not disabled, show alt table
       */
      tooManyClusters:        undefined as boolean | undefined,
      altClusterListRows:     undefined as any[] | undefined,
      altClusterListFeature:  paginationUtils.getFeature<PaginationFeatureHomePageClusterConfig>({ rootGetters: this.$store.getters }, 'homePageCluster'),

      presetVersion: getVersionData()?.Version,

      // In-page live editor for the default/home ConfigMap (part of the Home chrome, not the
      // rendered custom-home template).
      // Gates the default Home until we've checked for a custom-home ConfigMap, so the default
      // page never flashes before the custom one loads.
      customHomeChecked: false,
      showEditor:        false,
      showChat:          false,
      selectedSavedName: '', // which SAVED template the editor is currently editing
      draft:             '',
      debouncedDraft:    '',
      saving:            false,
      saveError:         '',
      applyStatus:       '',
    };
  },

  mounted() {
    this.preset('altClusterListDisabled', 'boolean');
  },

  computed: {
    ...mapState(['managementReady']),
    ...mapGetters(['currentCluster', 'defaultClusterId']),
    mcm: mapFeature(MULTI_CLUSTER),

    // Clean, stable, ConfigMap-key-safe id for the logged-in user (e.g. "user-abc123").
    userId(): string {
      const u = this.$store.getters['auth/user'];

      return u?.id || u?.metadata?.name || '';
    },

    // The APPLIED pointer ConfigMap (data.global + data["<userId>"]), read reactively.
    appliedConfigMap(): any {
      return this.$store.getters['management/byId'](CONFIG_MAP, APPLIED_ID);
    },

    // Which SAVED template is applied for THIS user: their user pointer, else the global one.
    appliedSavedName(): string {
      const d = this.appliedConfigMap?.data || {};

      return d[this.userId] || d[GLOBAL_KEY] || DEFAULT_SAVED;
    },

    // All SAVED templates (label-filtered) → [{ name, displayName }] for the editor's picker.
    savedTemplates(): { name: string, displayName: string }[] {
      const all = this.$store.getters['management/all'](CONFIG_MAP) || [];

      return all
        .filter((cm: any) => cm.metadata?.labels?.[SAVED_LABEL] === 'true')
        .map((cm: any) => {
          let name = cm.metadata.name;

          try {
            name = JSON.parse(cm.data?.[CODE_META_KEY] || '{}').name || cm.metadata.name;
          } catch (e) { /* keep configmap name */ }

          return { name: cm.metadata.name, displayName: name };
        })
        .sort((a: any, b: any) => a.displayName.localeCompare(b.displayName));
    },

    // view.vue of a SAVED template by name (reactive).
    savedSourceOf(): (name: string) => string {
      return (name: string) => this.$store.getters['management/byId'](CONFIG_MAP, `${ NS }/${ name }`)?.data?.[CODE_SOURCE_KEY] || '';
    },

    // The source of the APPLIED template — what the page shows when the editor is CLOSED.
    appliedSource(): string {
      return this.savedSourceOf(this.appliedSavedName);
    },

    // The stored source of the template currently being edited (for AI-save re-sync).
    selectedSavedSource(): string {
      return this.selectedSavedName ? this.savedSourceOf(this.selectedSavedName) : '';
    },

    // Right pane: editor open → live (debounced) draft of the SELECTED saved; closed → APPLIED.
    previewSource(): string {
      return this.showEditor ? this.debouncedDraft : this.appliedSource;
    },

    vaiOnSettingsHeaders() {
      return [
        ...this.headers, // include age as we're sorting by it
        AGE
      ];
    },

    canCreateCluster() {
      return !!this.provClusterSchema?.collectionMethods.find((x: string) => x.toLowerCase() === 'post');
    },

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    homePageCards:   mapPref(HIDE_HOME_PAGE_CARDS),

    /**
     * Show the alt table
     */
    altClusterList() {
      return this.tooManyClusters && !this.altClusterListDisabled;
    },

    clusterCountDisplay() {
      // If we have the cluster count from the store, use that instead
      const savedCount = this.$store.getters['management/getSavedCount'](SAVED_COUNTS.K8S_CLUSTERS);

      return typeof savedCount !== 'undefined' ? savedCount : this.clusterCount;
    }
  },

  watch: {
    async altClusterList(neu) {
      if (neu) {
        await this.initAltClusters();
      }
    },

    // Management steve becomes ready after login/navigation — (re)load the custom-home
    // ConfigMap (and its live watch) once it is.
    managementReady(neu: boolean) {
      if (neu) {
        this.loadCustomHome();
      }
    },

    // Debounce draft → preview so typing doesn't recompile on every keystroke.
    draft(val: string) {
      clearTimeout((this as any).debTimer);
      (this as any).debTimer = setTimeout(() => {
        this.debouncedDraft = val;
      }, 400);
    },

    // When the SELECTED template's stored source changes underneath us (e.g. the AI agent saved
    // it), reflect it in the open editor so the draft + preview stay in sync with what it wrote.
    selectedSavedSource(neu: string) {
      if (this.showEditor && neu && neu !== this.draft) {
        this.draft = neu;
        this.debouncedDraft = neu;
      }
    },
  },

  async created() {
    // Update last visited on load
    await this.$store.dispatch('prefs/setLastVisited', { name: 'home' });

    // We mark the release notes as seen still - the user has visited the home page, which will show the
    // notification centre containing the release notes notification
    // If we do not, then if they set the landing page, that won't work unless the release notes are marked read
    // otherwise we always take them to the home page to see the release notes
    markSeenReleaseNotes(this.$store);

    // Load the custom-home override (if any). Non-blocking: default Home renders unless/until
    // the ConfigMap resolves.
    this.loadCustomHome();

    this.tooManyClusters = this.isTooManyClusters();

    if (this.altClusterList) {
      await this.initAltClusters();
    }
  },

  // Forget the types when we leave the page
  beforeUnmount() {
    ManagementClusterUtils.forgetSecondaryResources({ context: this.paginationContext }, { $store: this.$store });
  },

  methods: {
    /**
     * Fetch the local cluster's ConfigMaps via the management steve store (also opens a live
     * watch), so the custom-home override resolves and stays reactive. Swallow errors so a
     * missing schema / permission simply falls back to the default Home.
     */
    async loadCustomHome() {
      // Management steve not ready yet — the managementReady watch will call again. Do NOT
      // mark "checked" so the default Home stays gated (this is what prevents a flash of the
      // default page before the custom one resolves).
      if (!this.$store.getters['management/schemaFor'](CONFIG_MAP)) {
        return;
      }
      try {
        // Make sure the current mgmt user (for the per-user pointer) and all ConfigMaps (SAVED
        // templates + the applied pointer, plus a live watch) are loaded.
        await this.$store.dispatch('auth/getUser').catch(() => {});
        await this.$store.dispatch('management/findAll', { type: CONFIG_MAP });
      } catch (e) {
        // no-op: falls back to default Home
      } finally {
        this.customHomeChecked = true;
      }
    },

    /**
     * Toggle the editor. On open, edit the SAVED template that is currently applied for this
     * user (what they're seeing), seeding the draft from it.
     */
    toggleEditor() {
      this.showEditor = !this.showEditor;
      if (this.showEditor) {
        this.selectSaved(this.appliedSavedName);
        this.saveError = '';
        this.applyStatus = '';
      }
    },

    /**
     * Switch which SAVED template the editor is editing. The right pane immediately previews it
     * (draft), but nothing is persisted until SAVE.
     */
    selectSaved(name: string) {
      this.selectedSavedName = name;
      this.draft = this.savedSourceOf(name) || '';
      this.debouncedDraft = this.draft;
    },

    /**
     * Persist the draft to the SELECTED saved template ConfigMap (create it if missing). Does
     * NOT change what is applied — that only happens via applyTo().
     */
    async saveHome() {
      if (!this.selectedSavedName) {
        return;
      }
      this.saving = true;
      this.saveError = '';
      try {
        let cm = this.$store.getters['management/byId'](CONFIG_MAP, `${ NS }/${ this.selectedSavedName }`);

        if (!cm) {
          cm = await this.$store.dispatch('management/create', {
            type:     CONFIG_MAP,
            metadata: {
              name: this.selectedSavedName, namespace: NS, labels: { [SAVED_LABEL]: 'true' }
            },
            data: {},
          });
        }
        cm.data = {
          [CODE_META_KEY]:   cm.data?.[CODE_META_KEY] || `{"name":"${ this.selectedSavedName }"}`,
          ...(cm.data || {}),
          [CODE_SOURCE_KEY]: this.draft,
        };
        // Ensure the saved label sticks (create path sets it; be safe on existing ones too).
        cm.metadata.labels = { ...(cm.metadata.labels || {}), [SAVED_LABEL]: 'true' };
        await cm.save();
        this.applyStatus = 'Saved.';
      } catch (e: any) {
        this.saveError = e?.message || String(e);
      } finally {
        this.saving = false;
      }
    },

    /**
     * Point the APPLIED ConfigMap (global, or this user) at the SELECTED saved template.
     * scope = 'global' | 'user'. Creates the pointer ConfigMap if missing.
     */
    async applyTo(scope: 'global' | 'user') {
      const key = scope === 'user' ? this.userId : GLOBAL_KEY;

      if (!this.selectedSavedName || (scope === 'user' && !key)) {
        return;
      }
      this.saving = true;
      this.saveError = '';
      try {
        let cm = this.$store.getters['management/byId'](CONFIG_MAP, APPLIED_ID);

        if (!cm) {
          cm = await this.$store.dispatch('management/create', {
            type:     CONFIG_MAP,
            metadata: { name: APPLIED_NAME, namespace: NS },
            data:     {},
          });
        }
        cm.data = { ...(cm.data || {}), [key]: this.selectedSavedName };
        await cm.save();
        this.applyStatus = scope === 'user' ? 'Applied to your user.' : 'Applied globally.';
      } catch (e: any) {
        this.saveError = e?.message || String(e);
      } finally {
        this.saving = false;
      }
    },

    /**
     * Create a new empty SAVED template and switch the editor to it.
     */
    async newSaved() {
      const label = (window.prompt('Name for the new saved Home template:') || '').trim();

      if (!label) {
        return;
      }
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'template';
      const name = `home-${ slug }`;

      this.saving = true;
      this.saveError = '';
      try {
        const cm = await this.$store.dispatch('management/create', {
          type:     CONFIG_MAP,
          metadata: {
            name, namespace: NS, labels: { [SAVED_LABEL]: 'true' }
          },
          data: { [CODE_META_KEY]: JSON.stringify({ name: label }), [CODE_SOURCE_KEY]: '' },
        });

        await cm.save();
        await this.$store.dispatch('management/findAll', { type: CONFIG_MAP, opt: { force: true } });
        this.selectSaved(name);
        this.applyStatus = `Created "${ label }".`;
      } catch (e: any) {
        this.saveError = e?.message || String(e);
      } finally {
        this.saving = false;
      }
    },

    /**
     * Of type #PagTableFetchSecondaryResources
     */
    fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      return Promise.all(ManagementClusterUtils.fetchSecondaryResources(opts, { $store: this.$store }));
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }: PagTableFetchPageSecondaryResourcesOpts) {
      this.clusterCount = !canPaginate || !page?.length ? 0 : pagResult.count;

      const promises = await ManagementClusterUtils.fetchPageSecondaryResources({
        canPaginate, force, page, pagResult
      }, { $store: this.$store });

      await Promise.all(promises);
    },

    /**
     * Define actions for each navigation link
     * @param {*} action
     */
    handlePageAction(action: any) {
      switch (action.action) {
      case SHOW_HIDE_BANNER_ACTION:
        this.toggleBanner();
        break;

      case SET_LOGIN_ACTION:
        this.afterLoginRoute = 'home';
        break;

      // no default
      }
    },

    cpuUsed(cluster: any) {
      return parseSi(cluster.status?.requested?.cpu);
    },

    cpuAllocatable(cluster: any) {
      return parseSi(cluster.status?.allocatable?.cpu);
    },

    memoryAllocatable(cluster: any) {
      const parsedAllocatable = (parseSi(cluster.status?.allocatable?.memory) || 0).toString();
      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },

    memoryReserved(cluster: any) {
      const memValues = createMemoryValues(cluster?.status?.allocatable?.memory, cluster?.status?.requested?.memory);

      return `${ memValues.useful }/${ memValues.total } ${ memValues.units }`;
    },

    async resetCards() {
      const value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS) || {};

      delete value.setLoginPage;

      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });
    },

    async toggleBanner() {
      const value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS) || {};

      if (value.welcomeBanner) {
        delete value.welcomeBanner;
      } else {
        value.welcomeBanner = true;
      }

      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });
    },

    filterRowsLocal(rows: MgmtCluster[]) {
      return ManagementClusterUtils.filterRowsLocal(rows, { $store: this.$store });
    },

    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      return ManagementClusterUtils.filterRowsApi(pagination, { $store: this.$store });
    },

    async toggleAltClusterListDisabled(disabled: boolean) {
      // Clear the cache so the table doesn't show the previous mode's results
      await this.$store.dispatch('management/forgetType', CAPI.RANCHER_CLUSTER);

      this.altClusterListDisabled = disabled;
    },

    /**
     * Determine if we should use an alternative cluster list which contains most recently created clusters
     *
     * Checks
     * - can view clusters
     * - if vai is on
     * - if alt list feature is on
     * - if cluster count exceeds threshold
     */
    isTooManyClusters(): boolean {
      if (!this.provClusterSchema || !this.canViewMgmtClusters) {
        return false;
      }

      const featureConfig = this.altClusterListFeature;

      if (!featureConfig || !featureConfig.enabled) { // vai is off, or feature is explicitly disabled
        return false;
      }

      const threshold = featureConfig.configuration?.threshold;

      if (threshold === undefined) { // invalid config
        return false;
      }

      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};

      this.clusterCount = counts[CAPI.RANCHER_CLUSTER]?.summary.count;

      return this.clusterCount > threshold;
    },

    /**
     * Fetch clusters used to populate alt table
     */
    async initAltClusters() {
      const featureConfig = this.altClusterListFeature;
      const results = featureConfig?.configuration?.results || 50;

      // Fetch a limited number of provisioning clusters
      const opt1: ActionFindPageArgs = {
        pagination: {
          projectsOrNamespaces: [],
          filters:              paginationFilterClusters(this.$store, false),
          page:                 1,
          pageSize:             results, // We're fetching the total results... then paging locally
          sort:                 [{ field: 'metadata.creationTimestamp', asc: false }]
        },
        watch: false,
      };
      const provClusters = await this.$store.dispatch('management/findPage', { type: CAPI.RANCHER_CLUSTER, opt: opt1 });

      // Also fetch the management clusters associated with the provisioning clusters
      const opt2: ActionFindPageArgs = {
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createMultipleFields(provClusters.map((r: any) => new PaginationFilterField({
            field: 'id',
            value: r.mgmtClusterId
          }))),
        }),
        watch: false,
      };

      await this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.CLUSTER, opt: opt2 });

      this.altClusterListRows = provClusters;
    },
  }
});

</script>

<template>
  <div class="home-root">
    <!-- Edit bar — part of the Home page chrome, NOT the rendered custom-home template. -->
    <div class="home-editbar">
      <button
        class="btn btn-sm role-secondary"
        data-testid="home-edit-toggle"
        @click="toggleEditor"
      >
        {{ showEditor ? 'Close editor' : 'Edit Home' }}
      </button>
      <template v-if="showEditor">
        <!-- Which SAVED template we're editing (previews live on the right). -->
        <label class="home-editbar__label ml-10">Editing</label>
        <select
          class="home-editbar__select"
          :value="selectedSavedName"
          @change="selectSaved($event.target.value)"
        >
          <option
            v-for="t in savedTemplates"
            :key="t.name"
            :value="t.name"
          >
            {{ t.displayName }}{{ t.name === appliedSavedName ? ' (applied)' : '' }}
          </option>
        </select>
        <button
          class="btn btn-sm role-secondary ml-10"
          :disabled="saving"
          @click="newSaved"
        >
          New
        </button>

        <button
          class="btn btn-sm role-primary ml-10"
          :disabled="saving"
          @click="saveHome"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>

        <span class="home-editbar__sep" />
        <button
          class="btn btn-sm role-secondary"
          :disabled="saving"
          title="Make this template the Home page everyone sees by default"
          @click="applyTo('global')"
        >
          Apply to Global
        </button>
        <button
          class="btn btn-sm role-secondary ml-10"
          :disabled="saving || !userId"
          title="Make this template your personal Home page"
          @click="applyTo('user')"
        >
          Apply to My User
        </button>

        <span
          v-if="applyStatus"
          class="text-success ml-10"
        >{{ applyStatus }}</span>
        <span
          v-if="saveError"
          class="text-error ml-10"
        >{{ saveError }}</span>
      </template>
    </div>

    <div
      class="home-split"
      :class="{ 'editor-open': showEditor }"
    >
      <!-- LEFT: live ConfigMap editor -->
      <div
        v-if="showEditor"
        class="home-editor"
      >
        <textarea
          v-model="draft"
          class="home-editor__code"
          spellcheck="false"
          placeholder="Write a Vue SFC here — it is the SAVED template's view.vue. Save to persist; Apply to make it the live Home."
        />

        <!-- Button at the bottom of the editor to open the AI chat. -->
        <div class="home-editor__chatbar">
          <button
            class="btn btn-sm role-secondary"
            data-testid="home-chat-toggle"
            @click="showChat = !showChat"
          >
            {{ showChat ? 'Close AI' : 'Ask AI to edit Home' }}
          </button>
        </div>

        <!-- Bottom half of the editor: the Home Editor AI chat (LizAI Spike relay). It edits the
             SELECTED saved template ConfigMap. -->
        <div
          v-if="showChat"
          class="home-editor__chat"
        >
          <HomeConfigChat :config-map-name="selectedSavedName" />
        </div>
      </div>

      <!-- RIGHT: the rendered Home (custom-home preview, or the default Home) -->
      <div class="home-main">
        <!-- Custom-home override: a ConfigMap (default/home) with a code-view `view.vue`
             replaces the Home page with a runtime-compiled component. While the editor is open
             the preview follows the (debounced) draft; otherwise the saved ConfigMap. Falls
             back to the default Home when neither is present. -->
        <TemplateCode
          v-if="previewSource"
          :source="previewSource"
        />
        <div
          v-else-if="managementReady && customHomeChecked"
          class="home-page"
        >
          <TabTitle
            :show-child="false"
            :breadcrumb="false"
          >
            {{ `${vendor} - ${t('landing.homepage')}` }}
          </TabTitle>
          <BannerGraphic
            :title="t('landing.welcomeToRancher', {vendor})"
            :pref="HIDE_HOME_PAGE_CARDS"
            pref-key="welcomeBanner"
            data-testid="home-banner-graphic"
          />
          <DynamicContentBanner location="banner" />
          <IndentedPanel class="mt-20 mb-20">
            <div class="row home-panels">
              <div class="col main-panel">
                <div
                  v-if="altClusterList !== undefined"
                  class="row panel"
                >
                  <div
                    v-if="mcm && altClusterList"
                    class="col span-12"
                  >
                    <ResourceTable
                      :schema="provClusterSchema"
                      :table-actions="false"
                      :row-actions="false"
                      key-field="id"

                      :headers="vaiOnSettingsHeaders"
                      defaultSortBy="age"

                      :loading="!altClusterListRows"

                      :rows="altClusterListRows || []"
                      :rowsPerPage="altClusterListFeature?.configuration.pagesPerRow || 10"

                      :namespaced="false"
                      :groupable="false"
                    >
                      <template #header-left>
                        <div class="row table-heading">
                          <h1 class="mb-0">
                            {{ t('landing.clusters.title') }}
                          </h1>
                        </div>
                      </template>
                      <template #sub-header-row>
                        <h2 class="too-many-clusters">
                          {{ t('landing.clusters.tooMany.showingSome', { rows: altClusterListRows?.length || '...', total: clusterCount}) }}
                          <a @click="toggleAltClusterListDisabled(true)">{{ t('landing.clusters.tooMany.showAll') }}</a>
                        </h2>
                      </template>
                      <!--
                  Below is a big copy & paste from PaginatedResourceTable, however should be temporary (altClusterList removed in 2.14 once full SSP support for clusters if available)
                -->
                      <template
                        v-if="canCreateCluster || !!provClusterSchema"
                        #header-middle
                      >
                        <div class="table-heading">
                          <rc-button
                            v-if="!!provClusterSchema"
                            variant="secondary"
                            :to="manageLocation"
                            data-testid="cluster-management-manage-button"
                            :aria-label="t('cluster.manageAction')"
                          >
                            {{ t('cluster.manageAction') }}
                          </rc-button>
                          <rc-button
                            v-if="canCreateCluster"
                            :to="importLocation"
                            data-testid="cluster-create-import-button"
                            :aria-label="t('cluster.importAction')"
                          >
                            {{ t('cluster.importAction') }}
                          </rc-button>
                          <rc-button
                            v-if="canCreateCluster"
                            :to="createLocation"
                            data-testid="cluster-create-button"
                            :aria-label="t('generic.create')"
                          >
                            {{ t('generic.create') }}
                          </rc-button>
                        </div>
                      </template>
                      <template #col:name="{row}">
                        <td class="col-name">
                          <div class="list-cluster-name">
                            <p
                              v-if="row.mgmt"
                              class="cluster-name"
                            >
                              <router-link
                                v-if="row.mgmt.isReady && !row.hasError"
                                :to="{ name: 'c-cluster-explorer', params: { cluster: row.mgmt.id }}"
                                role="link"
                                :aria-label="row.nameDisplay"
                              >
                                {{ row.nameDisplay }}
                              </router-link>
                              <span v-else>{{ row.nameDisplay }}</span>
                              <i
                                v-if="row.unavailableMachines"
                                v-clean-tooltip="row.unavailableMachines"
                                class="conditions-alert-icon icon-alert icon"
                              />
                              <i
                                v-if="row.isRke1"
                                v-clean-tooltip="t('cluster.rke1Unsupported')"
                                class="rke1-unsupported-icon icon-warning icon"
                              />
                            </p>
                            <p
                              v-if="row.description"
                              class="cluster-description"
                            >
                              {{ row.description }}
                            </p>
                          </div>
                        </td>
                      </template>
                      <template #col:kubernetesVersion="{row}">
                        <td class="col-name">
                          <span>
                            {{ row.kubernetesVersion }}
                          </span>
                          <div
                            v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
                            class="text-muted"
                          >
                            {{ row.architecture.label }}
                          </div>
                        </td>
                      </template>
                      <template #col:cpu="{row}">
                        <td v-if="row.mgmt && cpuAllocatable(row.mgmt)">
                          {{ `${cpuAllocatable(row.mgmt)} ${t('landing.clusters.cores', {count:cpuAllocatable(row.mgmt) })}` }}
                        </td>
                        <td v-else>
                          &mdash;
                        </td>
                      </template>
                      <template #col:memory="{row}">
                        <td v-if="row.mgmt && memoryAllocatable(row.mgmt) && !memoryAllocatable(row.mgmt).match(/^0 [a-zA-z]/)">
                          {{ memoryAllocatable(row.mgmt) }}
                        </td>
                        <td v-else>
                          &mdash;
                        </td>
                      </template>
                    </ResourceTable>
                  </div>
                  <div
                    v-else-if="mcm"
                    class="col span-12"
                  >
                    <PaginatedResourceTable
                      v-if="mgmtClusterSchema"
                      :schema="mgmtClusterSchema"
                      overrideInStore="management"
                      :table-actions="false"
                      :row-actions="false"
                      key-field="id"
                      :headers="headers"
                      :pagination-headers="paginationHeaders"
                      :context="paginationContext"

                      :local-filter="filterRowsLocal"
                      :api-filter="filterRowsApi"

                      :fetch-secondary-resources="fetchSecondaryResources"
                      :fetch-page-secondary-resources="fetchPageSecondaryResources"

                      :namespaced="false"
                      :groupable="false"
                      manualRefreshButtonSize="sm"
                    >
                      <template #header-left>
                        <div class="row table-heading">
                          <h1 class="mb-0">
                            {{ t('landing.clusters.title') }}
                          </h1>
                          <BadgeState
                            v-if="clusterCount && !tooManyClusters"
                            :label="clusterCountDisplay.toString()"
                            color="bg-info ml-20 mr-20"
                          />
                        </div>
                      </template>
                      <template
                        v-if="tooManyClusters"
                        #sub-header-row
                      >
                        <h2 class="too-many-clusters">
                          {{ t('landing.clusters.tooMany.showingAll', { rows: altClusterListRows?.length || '...', total: clusterCount}) }}
                          <a @click="toggleAltClusterListDisabled(false)">{{ t('landing.clusters.tooMany.showSome') }}</a>
                        </h2>
                      </template>
                      <template
                        v-if="canCreateCluster || !!provClusterSchema"
                        #header-middle
                      >
                        <div class="table-heading">
                          <rc-button
                            v-if="!!provClusterSchema"
                            variant="secondary"
                            :to="manageLocation"
                            data-testid="cluster-management-manage-button"
                            :aria-label="t('cluster.manageAction')"
                          >
                            {{ t('cluster.manageAction') }}
                          </rc-button>
                          <rc-button
                            v-if="canCreateCluster"
                            :to="importLocation"
                            data-testid="cluster-create-import-button"
                            :aria-label="t('cluster.importAction')"
                          >
                            {{ t('cluster.importAction') }}
                          </rc-button>
                          <rc-button
                            v-if="canCreateCluster"
                            :to="createLocation"
                            data-testid="cluster-create-button"
                            :aria-label="t('generic.create')"
                          >
                            {{ t('generic.create') }}
                          </rc-button>
                        </div>
                      </template>
                      <template #col:name="{row}">
                        <td class="col-name">
                          <div class="list-cluster-name">
                            <p
                              v-if="row"
                              class="cluster-name"
                            >
                              <!-- Align side nav cluster, home page name link and cluster management cluster explor buttons on canExplore -->
                              <router-link
                                v-if="row.canExplore"
                                :to="{ name: 'c-cluster-explorer', params: { cluster: row.id }}"
                                role="link"
                                :aria-label="row.nameDisplay"
                              >
                                {{ row.nameDisplay }}
                              </router-link>
                              <span v-else>{{ row.nameDisplay }}</span>
                              <i
                                v-if="row.unavailableMachines"
                                v-clean-tooltip="row.unavailableMachines"
                                class="conditions-alert-icon icon-alert icon"
                              />
                            </p>
                            <p
                              v-if="row.description"
                              class="cluster-description"
                            >
                              {{ row.description }}
                            </p>
                          </div>
                        </td>
                      </template>
                      <template #col:cpu="{row}">
                        <td v-if="cpuAllocatable(row)">
                          {{ `${cpuAllocatable(row)} ${t('landing.clusters.cores', {count:cpuAllocatable(row) })}` }}
                        </td>
                        <td v-else>
                          &mdash;
                        </td>
                      </template>
                      <template #col:memory="{row}">
                        <td v-if="memoryAllocatable(row) && !memoryAllocatable(row).match(/^0 [a-zA-z]/)">
                          {{ memoryAllocatable(row) }}
                        </td>
                        <td v-else>
                          &mdash;
                        </td>
                      </template>
                    </PaginatedResourceTable>
                  </div>
                  <div
                    v-else
                    class="col span-12"
                  >
                    <SingleClusterInfo />
                  </div>
                </div>
              </div>
              <div class="col span-3 side-panel">
                <CommunityLinks />
                <DynamicContentPanel location="rhs" />
              </div>
            </div>
          </IndentedPanel>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
  .home-root {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .home-editbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 0;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 1px 5px;
    }

    &__hint {
      font-size: 12px;
    }

    &__label {
      font-size: 12px;
      color: var(--muted);
      margin: 0 6px 0 10px;
    }

    &__select {
      height: 28px;
      max-width: 220px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--input-bg, var(--body-bg));
      color: var(--body-text);
      padding: 0 6px;
    }

    &__sep {
      width: 1px;
      height: 22px;
      background: var(--border);
      margin: 0 12px;
    }
  }

  .home-split {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .home-editor {
    width: 42%;
    max-width: 720px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);

    &__code {
      flex: 1;
      min-height: 0;
      width: 100%;
      padding: 12px;
      border: none;
      outline: none;
      resize: none;
      background: var(--body-bg);
      color: var(--body-text);
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
      tab-size: 2;
    }

    &__chatbar {
      flex: 0 0 auto;
      padding: 6px 8px;
      border-top: 1px solid var(--border);
    }

    // Bottom half of the editor when the AI chat is open.
    &__chat {
      flex: 1;
      min-height: 0;
    }
  }

  .home-main {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }

  .banner-link:focus-visible {
    @include focus-outline;
  }

  .home-panels {
    display: flex;
    align-items: stretch;
    .col {
      margin: 0
    }
    .main-panel {
      flex: auto;

      .too-many-clusters {
        margin-bottom: 5px;

        a {
          cursor: pointer;
        }
      }
    }

    .side-panel {
      margin-left: 1.75%;
    }
  }

  .table-heading {
    align-items: center;
    display: flex;
    height: 39px;

    & > a {
      margin-left: 10px;
    }
  }
  .panel:not(:first-child) {
    margin-top: 20px;
  }
  .getting-started {
    align-items: flex-end;
    display: flex;

    > span {
      flex: 1;
      margin-right: 20px;
    }
  }
  .getting-started-btn {
    display: contents;
    white-space: nowrap;
  }

  .col-name {
    max-width: 280px;
  }

  .list-cluster-name {

    .cluster-name {
      display: flex;
      align-items: center;

      // Ensure long cluster names truncate with ellipsis
      > A, > span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .cluster-description {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--muted);
    }

    .conditions-alert-icon {
      color: var(--error);
      margin-left: 4px;
    }

    .rke1-unsupported-icon {
      color: var(--warning);
      margin-left: 4px;
    }
  }

  // Hide the side-panel showing links when the screen is small
  @media screen and (max-width: 996px) {
    .side-panel {
      display: none;
    }
  }
</style>

<style lang="scss">
.home-page {
  .search {
    align-items: center;
    display: flex;
    height: 39px;

    > INPUT {
      background-color: transparent;
      height: 30px;
      padding: 8px;
    }
  }

  h2 {
    font-size: 16px;
  }
}
</style>
