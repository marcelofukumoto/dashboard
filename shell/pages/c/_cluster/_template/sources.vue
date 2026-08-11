<script>
import ResourceTable from '@shell/components/ResourceTable.vue';
import { NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import { CONFIG_MAP } from '@shell/config/types';
import { TEMPLATE_LABEL } from '@shell/config/templating/template-engine';

// Management list of the ConfigMaps that back custom views.
//
// Shows ONLY ConfigMaps labelled templates.rancher.io/custom-view=true. Rows are real
// ConfigMap resources, so their standard row actions (Edit YAML, Edit Config, Clone,
// Delete, Download) and the name link to the ConfigMap detail/edit page all work with
// no extra code — this page is just a filtered view over them.
export default {
  name:       'CustomViewSources',
  components: { ResourceTable },

  async fetch() {
    this.loading = true;

    try {
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
    return { loading: true };
  },

  computed: {
    label() {
      return TEMPLATE_LABEL;
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
