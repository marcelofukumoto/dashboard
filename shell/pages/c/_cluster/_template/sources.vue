<script>
import ResourceTable from '@shell/components/ResourceTable.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import { CONFIG_MAP } from '@shell/config/types';
import { TEMPLATE_LABEL, TEMPLATING_CONFIG_ID, isTemplatingEnabled, toggleTemplating } from '@shell/config/templating/template-engine';

// Management list of the ConfigMaps that back custom views.
//
// Shows ONLY ConfigMaps labelled templates.rancher.io/custom-view=true. Rows are real
// ConfigMap resources, so their standard row actions (Edit YAML, Edit Config, Clone,
// Delete, Download) and the name link to the ConfigMap detail/edit page all work with
// no extra code — this page is just a filtered view over them.
//
// This page is ALSO the control panel for the whole feature: the Enabled toggle at the top
// flips the global kill switch (default/templating-config). It stays reachable even when the
// system is off (registerSourcesOnly keeps this one nav entry), so it is always possible to
// turn the feature back on from here — or with the ⌘/Ctrl + Shift + . shortcut.
export default {
  name:       'CustomViewSources',
  components: { ResourceTable, Checkbox },

  async fetch() {
    this.loading = true;

    try {
      // The kill-switch flag lives in the MANAGEMENT store (global across clusters); load it
      // so the toggle reflects the persisted state. Absent/forbidden -> treated as enabled.
      await this.$store.dispatch('management/find', { type: CONFIG_MAP, id: TEMPLATING_CONFIG_ID })
        .catch(() => {});

      // Load + start the live socket watch. Rows are read reactively via the computed
      // below, so create/edit/delete reflect immediately without a re-fetch.
      if (this.schema) {
        await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
      }
    } finally {
      this.loading = false;
    }
  },

  data() {
    return { loading: true, toggling: false };
  },

  computed: {
    label() {
      return TEMPLATE_LABEL;
    },

    // Reactive read of the global kill switch (management/byId powers isTemplatingEnabled).
    enabled() {
      return isTemplatingEnabled(this.$store.getters);
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](CONFIG_MAP);
    },

    rows() {
      if (!this.schema) {
        return [];
      }

      // Filter the LIVE store list (not a snapshot) so the table stays in sync as
      // ConfigMaps are added, edited, or deleted.
      return this.$store.getters['cluster/all'](CONFIG_MAP)
        .filter((cm) => cm.metadata?.labels?.[TEMPLATE_LABEL] === 'true');
    },

    headers() {
      return [NAME, NAMESPACE, AGE];
    },
  },

  methods: {
    async onToggle(value) {
      if (this.toggling) {
        return;
      }
      this.toggling = true;

      try {
        const now = await toggleTemplating(this.$store, value);

        this.$store.dispatch('growl/success', {
          title:   'Custom view templating',
          message: now ? 'Templating enabled — custom views and custom Home are active.' : 'Templating disabled — Rancher now ignores all custom-view ConfigMaps.',
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Could not change templating',
          message: e?.message || String(e),
        }, { root: true });
      } finally {
        this.toggling = false;
      }
    },
  },
};
</script>

<template>
  <div class="custom-view-sources">
    <h1 class="mb-10">
      Custom View Sources
    </h1>
    <p class="text-muted mb-20">
      ConfigMaps labelled <code>{{ label }}=true</code> that define custom views. Use a
      row's actions to edit its YAML — views update live as you create, edit, or delete them.
    </p>

    <div
      class="templating-switch mb-20"
      :class="{ 'templating-switch--off': !enabled }"
    >
      <Checkbox
        :value="enabled"
        :disabled="toggling"
        label="Custom view templating enabled"
        @update:value="onToggle"
      />
      <p class="text-muted mt-5 mb-0">
        When off, Rancher ignores every custom-view ConfigMap (custom views, White Canvas and
        the custom Home) and behaves exactly like stock Rancher. This page stays available so
        you can turn it back on. Shortcut: <code>⌘/Ctrl + Shift + .</code>
      </p>
    </div>

    <ResourceTable
      v-if="schema"
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :loading="loading"
      :namespaced="true"
    />
    <div
      v-else
      class="text-error"
    >
      You don't have permission to list ConfigMaps in this cluster.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.templating-switch {
  border:        1px solid var(--border);
  border-radius: var(--border-radius);
  padding:       12px 16px;
  background:    var(--box-bg);

  &--off {
    border-color: var(--warning);
  }

  code {
    padding: 1px 4px;
  }
}
</style>
