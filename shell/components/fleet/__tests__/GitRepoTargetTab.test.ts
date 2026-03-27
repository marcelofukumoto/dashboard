import { shallowMount } from '@vue/test-utils';
import GitRepoTargetTab from '@shell/components/fleet/GitRepoTargetTab.vue';
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
    name:      'test-repo',
    namespace: 'fleet-default',
  },
  spec: {
    targets:         [{ clusterName: 'fleet-local' }],
    serviceAccount:  '',
    targetNamespace: '',
  },
  targetClusters: [],
};

describe('component: GitRepoTargetTab', () => {
  it.each([
    _CREATE,
    _VIEW,
  ])('should render correctly in mode %p', (mode) => {
    const wrapper = shallowMount(GitRepoTargetTab, {
      props: {
        value:          mockValue,
        mode,
        realMode:       mode,
        targetsCreated: '',
      },
      global: { mocks: defaultMocks },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
