import { shallowMount } from '@vue/test-utils';
import HelmOpMetadataTab from '@shell/components/fleet/HelmOpMetadataTab.vue';
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
    name:        'test-helmop',
    namespace:   'fleet-default',
    labels:      { 'app.kubernetes.io/name': 'test' },
    annotations: { description: 'A test helmop' },
  },
};

describe('component: HelmOpMetadataTab', () => {
  it.each([
    _CREATE,
    _VIEW,
  ])('should render Labels with correct props in mode %p', (mode) => {
    const wrapper = shallowMount(HelmOpMetadataTab, {
      props: {
        value: mockValue,
        mode,
      },
      global: { mocks: defaultMocks },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
