<script>
import { getPageRef } from '@shell/config/templating/template-engine';
import TemplateResourceList from './TemplateResourceList.vue';
import TemplateOverview from './TemplateOverview.vue';

// The single generic "engine mount" page.
//
// One static route (c-cluster-explorer-template) points here. The :pageId route param
// selects which page to render; the page + its parent template are looked up from the
// runtime registry populated by loadCustomViews() during cluster load. Each widget is
// resolved to a component through componentForWidget() and rendered with <component :is>.
export default {
  name:       'TemplatePage',
  components: { TemplateResourceList, TemplateOverview },

  computed: {
    pageRef() {
      return getPageRef(this.$route.params.pageId);
    },

    template() {
      return this.pageRef?.template;
    },

    page() {
      return this.pageRef?.page;
    },

    widgets() {
      return this.page?.widgets || [];
    },
  },

  methods: {
    // Widget registry: map a widget spec to the component that renders it.
    // `overview` renders the Workloads-dashboard by-state bento (By State / By Type /
    // By Namespace) for its resource list.
    componentForWidget(widget) {
      switch (widget.type) {
      case 'resourceList':
        return 'TemplateResourceList';
      case 'overview':
        return 'TemplateOverview';
      default:
        return null;
      }
    },
  },
};
</script>

<template>
  <div class="template-page">
    <template v-if="page">
      <h1 class="mb-20">
        {{ page.name }}
        <span class="text-muted template-page__source">— {{ template.metadata.name }}</span>
      </h1>

      <template
        v-for="(widget, i) in widgets"
        :key="`${ page.id }:${ i }`"
      >
        <component
          :is="componentForWidget(widget)"
          v-if="componentForWidget(widget)"
          :widget="widget"
        />
        <div
          v-else
          class="text-muted"
        >
          Unsupported widget type: {{ widget.type }}
        </div>
      </template>
    </template>

    <div
      v-else
      class="text-muted"
    >
      No custom view found for "{{ $route.params.pageId }}".
    </div>
  </div>
</template>

<style lang="scss" scoped>
.template-page {
  &__source {
    font-size: 0.7em;
  }
}
</style>
