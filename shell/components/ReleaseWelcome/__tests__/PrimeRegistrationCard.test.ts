import { shallowMount } from '@vue/test-utils';
import PrimeRegistrationCard from '@shell/components/ReleaseWelcome/PrimeRegistrationCard.vue';
import { ReleaseWelcomeRegistration } from '@shell/config/release-welcome';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: {} }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const HANDBOOK_URL = 'https://www.suse.com/support/handbook/';

const REGISTRATION: ReleaseWelcomeRegistration = {
  title:       'Register',
  description: 'Registering unlocks:',
  benefits:    [
    { text: 'Support', cta: { action: 'Support handbook', link: HANDBOOK_URL } },
    { text: 'Images' },
  ],
  cta: { action: 'Open SUSE Customer Center', link: 'https://scc.suse.com/' },
};

const createWrapper = () => shallowMount(PrimeRegistrationCard, {
  props:  { registration: REGISTRATION },
  global: {
    mocks: { t: (key: string) => key },
    // Render the slot, the content sits inside the card
    stubs: { PrimeCard: { template: '<section><slot /></section>' } },
  },
});

describe('component: PrimeRegistrationCard', () => {
  it('should list every benefit', () => {
    const wrapper = createWrapper();
    const benefits = wrapper.findAll('.benefits li').map((li) => li.text().split(' ')[0]);

    expect(benefits).toStrictEqual(REGISTRATION.benefits.map((b) => b.text));
  });

  it('should hide the benefit icons from screen readers', () => {
    const wrapper = createWrapper();
    const hidden = wrapper.findAll('.icon-checkmark').map((icon) => icon.attributes('aria-hidden'));

    expect(hidden).toStrictEqual(REGISTRATION.benefits.map(() => 'true'));
  });

  it('should link only the benefits with a call to action', () => {
    const wrapper = createWrapper();
    const links = wrapper.findAll('[data-testid="release-welcome-support-handbook"]');

    expect(links.map((link) => link.attributes('href'))).toStrictEqual([HANDBOOK_URL]);
  });

  it('should link the support handbook under its benefit', () => {
    const wrapper = createWrapper();
    const support = wrapper.findAll('.benefits li')[0];

    expect(support.find('[data-testid="release-welcome-support-handbook"]').exists()).toStrictEqual(true);
  });

  it('should link the SUSE Customer Center', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-registration-open"]').attributes('href')).toStrictEqual(REGISTRATION.cta.link);
  });

  it('should name the card after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });
});
