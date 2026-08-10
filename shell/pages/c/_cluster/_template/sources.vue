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
      if (!this.schema) {
        this.rows = [];

        return;
      }

      const all = await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });

      this.rows = (all || []).filter((cm) => cm.metadata?.labels?.[TEMPLATE_LABEL] === 'true');
    } finally {
      this.loading = false;
    }
  },

  data() {
    return { rows: [], loading: true };
  },

  computed: {
    label() {
      return TEMPLATE_LABEL;
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](CONFIG_MAP);
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
      row's actions to edit its YAML — the pages update on the next cluster load.
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
