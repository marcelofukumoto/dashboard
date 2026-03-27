import { shallowMount } from '@vue/test-utils';
import GitRepoRepositoryTab from '@shell/components/fleet/GitRepoRepositoryTab.vue';
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
    repo:    'https://github.com/rancher/fleet-examples',
    branch:  'master',
    paths:   ['/'],
    bundles: [],
  },
};

describe('component: GitRepoRepositoryTab', () => {
  it.each([
    _CREATE,
    _VIEW,
  ])('should render correctly in mode %p', (mode) => {
    const wrapper = shallowMount(GitRepoRepositoryTab, {
      props: {
        value:                   mockValue,
        mode,
        refType:                 'branch',
        refValue:                'master',
        touched:                 null,
        fvGetAndReportPathRules: () => [],
      },
      global: { mocks: defaultMocks },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
