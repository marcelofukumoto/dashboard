import { shallowMount } from '@vue/test-utils';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import { ReleaseWelcomePrime } from '@shell/config/release-welcome';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: {} }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const PRIME: ReleaseWelcomePrime = {
  title:       'Go Prime',
  description: 'Enterprise support',
  products:    ['Rancher Manager', 'SUSE Security'],
  cta:         { action: 'Explore', link: 'https://www.suse.com/products/rancher/' },
};

const createWrapper = () => shallowMount(PrimePromoCard, {
  props:  { prime: PRIME },
  global: {
    mocks: { t: (key: string) => key },
    // Render the slots, the content sits inside the card and the tags
    stubs: { PrimeCard: { template: '<section><slot /></section>' }, RcTag: { template: '<span><slot /></span>' } },
  },
});

describe('component: PrimePromoCard', () => {
  it('should list every Prime product', () => {
    const wrapper = createWrapper();
    const products = wrapper.findAll('.products li').map((li) => li.text());

    expect(products).toStrictEqual(PRIME.products);
  });

  it('should show the title and description', () => {
    const wrapper = createWrapper();

    expect([wrapper.find('h3').text(), wrapper.find('p').text()]).toStrictEqual([PRIME.title, PRIME.description]);
  });

  it('should link Rancher Prime', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').attributes('href')).toStrictEqual(PRIME.cta.link);
  });

  it('should open Rancher Prime in a new tab', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').attributes('target')).toStrictEqual('_blank');
  });

  it('should name the card after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });
});
