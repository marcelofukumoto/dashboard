import { shallowMount } from '@vue/test-utils';
import HelmOpChartTab from '@shell/components/fleet/HelmOpChartTab.vue';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import { _CREATE, _VIEW } from '@shell/config/query-params';

const defaultMocks = {
  $store: {
    getters: {
      'i18n/t':      (text: string) => text,
      'i18n/exists': jest.fn(),
    },
  },
};

const mockValue = {
  metadata: {
    name:      'test-helmop',
    namespace: 'fleet-default',
  },
  spec: {
    helm: {
      releaseName: 'my-release',
      repo:        'https://charts.rancher.io',
      chart:       'rancher',
      version:     '1.0.0',
    },
  },
};

const sourceTypeOptions = Object.values(SOURCE_TYPE).map((value) => ({
  value,
  label: `fleet.helmOp.source.types.${ value }`,
}));

describe('component: HelmOpChartTab', () => {
  it.each([
    [SOURCE_TYPE.REPO, _CREATE],
    [SOURCE_TYPE.OCI, _CREATE],
    [SOURCE_TYPE.TARBALL, _CREATE],
    [SOURCE_TYPE.REPO, _VIEW],
  ])('should render correctly with sourceType %p in mode %p', (sourceType, mode) => {
    const wrapper = shallowMount(HelmOpChartTab, {
      props: {
        value:                   mockValue,
        mode,
        sourceType,
        sourceTypeOptions,
        fvGetAndReportPathRules: () => [],
      },
      global: { mocks: defaultMocks },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
