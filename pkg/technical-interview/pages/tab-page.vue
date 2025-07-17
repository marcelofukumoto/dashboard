<script lang="ts">
import { defineComponent, ref } from 'vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import CounterTab from '../components/CounterTab.vue';
import DateTimeTab from '../components/DateTimeTab.vue';
import JsonSwapTab from '../components/JsonSwapTab.vue';
import CoinChangeTab from '../components/CoinChangeTab.vue';
import ParenthesesTab from '../components/ParenthesesTab.vue';
import { TabItem } from 'types';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const tabComponents = {
  CounterTab,
  DateTimeTab,
  JsonSwapTab,
  CoinChangeTab,
  ParenthesesTab,
};

export default defineComponent({
  name: 'TabPage',

  layout: 'plain',

  components: {
    Tabbed,
    Tab,
    ...tabComponents
  },

  setup() {
    const store = useStore();
    const { t } = useI18n(store);

    const tabs: TabItem[] = [
      {
        name: 'counter', component: 'CounterTab', labelKey: 'interview.tabs.counter'
      },
      {
        name: 'datetime', component: 'DateTimeTab', labelKey: 'interview.tabs.datetime'
      },
      {
        name: 'json-swap', component: 'JsonSwapTab', labelKey: 'interview.tabs.jsonswap'
      },
      {
        name: 'coin-change', component: 'CoinChangeTab', labelKey: 'interview.tabs.coinchange'
      },
      {
        name: 'parentheses-validation', component: 'ParenthesesTab', labelKey: 'interview.tabs.parentheses'
      },
    ];

    const activeTab = ref(tabs[0].name);

    // This will be used to trigger DateTimeTab refresh
    const dateTimeTabTrigger = ref(0);

    // Handle tab change event
    function handleTabChanged({ tab } : { tab: any, selectedName: any }) {
      activeTab.value = tab.name;
      if (tab.name === 'datetime') {
        dateTimeTabTrigger.value = 1;
      } else {
        dateTimeTabTrigger.value = 0; // Reset trigger for other tabs
      }
    }

    return {
      tabs, activeTab, dateTimeTabTrigger, handleTabChanged, t
    };
  }
});
</script>

<template>
  <div>
    <h1>{{ t('interview.tabPage.title') }}</h1>
    <Tabbed
      :side-tabs="false"
      :default-tab="tabs[0]?.name"
      @changed="handleTabChanged"
    >
      <Tab
        v-for="(tab, idx) in tabs"
        :key="tab.name"
        :name="tab.name"
        :weight="-idx"
        :label="t(tab.labelKey)"
      >
        <component
          :is="tab.component"
          v-bind="tab.name === 'datetime' ? { trigger: dateTimeTabTrigger } : {}"
        />
      </Tab>
    </Tabbed>
  </div>
</template>
