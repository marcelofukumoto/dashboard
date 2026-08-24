<script>
import GlobalLoading from '@shell/components/nav/GlobalLoading.vue';
import WindowManager from '@shell/components/nav/WindowManager';
import { toggleTemplating } from '@shell/config/templating/template-engine';

import '@shell/assets/styles/app.scss';

export default {
  data() {
    return {
      isOnline:      true,
      currentLayout: null,
    };
  },

  created() {
    // add to window so we can listen when ready
    window.$globalApp = this;

    // This is needed for Harvester https://github.com/rancher/dashboard/issues/10681
    const isHarvester = this.$globalApp?.$store.getters['currentCluster']?.isHarvester;

    if (!isHarvester) {
      Object.defineProperty(window, '$nuxt', {
        get() {
          console.warn('window.$nuxt is deprecated. It would be best to stop using globalState all together. For an alternative you can use window.$globalApp.'); // eslint-disable-line no-console

          return window.$globalApp;
        }
      });
    }

    this.refreshOnlineStatus();
    // Setup the listeners
    window.addEventListener('online', this.refreshOnlineStatus);
    window.addEventListener('offline', this.refreshOnlineStatus);

    // Global shortcut for the ConfigMap templating kill switch. Registered here on the app
    // root (not a layout) so it works on every page, including Home, which uses its own layout.
    window.addEventListener('keydown', this.onTemplatingKey);

    // Add $nuxt.context
    this.context = this.$options.context;
  },

  mounted() {
    this.$loading = this.$refs.loading;
  },

  provide() {
    return {
      notifyWmContainerReady: (layout) => {
        this.currentLayout = layout;
      }
    };
  },

  computed: {
    isOffline() {
      return !this.isOnline;
    },
  },

  methods: {
    refreshOnlineStatus() {
      if (typeof window.navigator.onLine === 'undefined') {
        // If the browser doesn't support connection status reports
        // assume that we are online because most apps' only react
        // when they now that the connection has been interrupted
        this.isOnline = true;
      } else {
        this.isOnline = window.navigator.onLine;
      }
    },

    // ⌘/Ctrl + Shift + . toggles the whole ConfigMap templating system on/off (same kill
    // switch as the Custom View Sources page). Matched on event.code === 'Period' so it is
    // independent of keyboard layout and the shifted character (Shift + '.' is '>' on a US
    // layout), which is why this uses a raw listener rather than the v-shortkey directive.
    onTemplatingKey(e) {
      if (!((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'Period')) {
        return;
      }

      e.preventDefault();

      toggleTemplating(this.$store)
        .then((now) => {
          this.$store.dispatch('growl/success', {
            title:   'Custom view templating',
            message: now ? 'Templating enabled.' : 'Templating disabled — showing stock Rancher.',
          }, { root: true });
        })
        .catch((err) => {
          this.$store.dispatch('growl/error', {
            title:   'Could not change templating',
            message: err?.message || String(err),
          }, { root: true });
        });
    },
  },

  components: {
    GlobalLoading,
    WindowManager,
  }
};
</script>
<template>
  <div id="__root">
    <GlobalLoading ref="loading" />
    <div
      id="__layout"
    >
      <router-view />
      <!--
        WindowManager is teleported into each template's wm-container
        This keeps a single instance that never re-mounts while appearing in each template
      -->
      <Teleport
        v-if="currentLayout"
        :to="`#wm-container-${currentLayout}`"
      >
        <WindowManager :layout="currentLayout" />
      </Teleport>
    </div>
  </div>
</template>
