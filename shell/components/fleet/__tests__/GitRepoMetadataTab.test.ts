import { shallowMount } from '@vue/test-utils';
import GitRepoMetadataTab from '@shell/components/fleet/GitRepoMetadataTab.vue';
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
    name:        'test-repo',
    namespace:   'fleet-default',
    labels:      { 'app.kubernetes.io/name': 'test' },
    annotations: { description: 'A test repo' },
  },
};

describe('component: GitRepoMetadataTab', () => {
  it.each([
    _CREATE,
    _VIEW,
  ])('should render Labels with correct props in mode %p', (mode) => {
    const wrapper = shallowMount(GitRepoMetadataTab, {
      props: {
        value: mockValue,
        mode,
      },
      global: { mocks: defaultMocks },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
