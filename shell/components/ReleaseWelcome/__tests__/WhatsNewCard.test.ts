import { shallowMount } from '@vue/test-utils';
import WhatsNewCard from '@shell/components/ReleaseWelcome/WhatsNewCard.vue';
import { ReleaseWelcomeFeature } from '@shell/config/release-welcome';

const RELEASE_NOTES_URL = 'https://github.com/rancher/rancher/releases/tag/v2.16.0';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: { releaseNotesUrl: 'https://github.com/rancher/rancher/releases/tag/v2.16.0' } }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const FEATURES: ReleaseWelcomeFeature[] = [
  {
    id: 'navigation', title: 'Improved navigation', description: 'A new switcher'
  },
  {
    id: 'tables', title: 'Smarter tables', description: 'Advanced filtering'
  },
];

const createWrapper = (features = FEATURES) => shallowMount(WhatsNewCard, {
  props:  { version: '2.16', features },
  global: { mocks: { t: (key: string, args?: any) => (args?.version ? `${ key } ${ args.version }` : key) } },
});

describe('component: WhatsNewCard', () => {
  it('should show the release version', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-version"]').text()).toStrictEqual('releaseWelcome.whatsNew.version 2.16');
  });

  it('should link the release notes', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-release-notes"]').attributes('href')).toStrictEqual(RELEASE_NOTES_URL);
  });

  it('should open the release notes in a new tab', () => {
    const wrapper = createWrapper();
    const link = wrapper.find('[data-testid="release-welcome-release-notes"]');

    expect([link.attributes('target'), link.attributes('rel')]).toStrictEqual(['_blank', 'noopener noreferrer nofollow']);
  });

  it('should list every feature', () => {
    const wrapper = createWrapper();
    const ids = wrapper.findAll('li').map((li) => li.attributes('data-testid'));

    expect(ids).toStrictEqual(FEATURES.map((f) => `release-welcome-feature-${ f.id }`));
  });

  it.each(FEATURES.map((f) => [f.id, f]))('should show the title and description of %p', (id, feature: any) => {
    const wrapper = createWrapper();

    expect(wrapper.find(`[data-testid="release-welcome-feature-${ id }"]`).text()).toStrictEqual(`${ feature.title }${ feature.description }`);
  });

  it('should be hidden without features', () => {
    const wrapper = createWrapper([]);

    expect(wrapper.find('section').exists()).toStrictEqual(false);
  });

  it('should name the section after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });
});
