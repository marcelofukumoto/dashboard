import type { CallToAction } from '@shell/utils/dynamic-content/types';

/**
 * Content of the welcome modal, shown once per minor release.
 *
 * The cards render a ReleaseWelcomeContent. Each section comes from dynamic content when it has one for the running
 * version, otherwise from the bundled default below (defaultReleaseWelcomeContent).
 *
 * Update WHATS_NEW_FEATURES for every minor release. The card is hidden when the list is empty.
 */

/**
 * A feature listed in the what's new card
 */
export interface ReleaseWelcomeFeature {
  /**
   * Unique id, used for test ids
   */
  id: string;
  title: string;
  description: string;
}

/**
 * The Rancher Prime promotion, shown to Community installations
 */
export interface ReleaseWelcomePrime {
  title: string;
  description: string;
  products: string[];
  cta: CallToAction;
}

/**
 * A benefit of registering, optionally with a link shown under it
 */
export interface ReleaseWelcomeBenefit {
  text: string;
  cta?: CallToAction;
}

/**
 * The registration card, shown to Prime admins
 */
export interface ReleaseWelcomeRegistration {
  title: string;
  description: string;
  benefits: ReleaseWelcomeBenefit[];
  cta: CallToAction;
}

/**
 * Everything the cards render
 */
export interface ReleaseWelcomeContent {
  whatsNew: ReleaseWelcomeFeature[];
  prime: ReleaseWelcomePrime;
  registration: ReleaseWelcomeRegistration;
}

interface WhatsNewFeatureKeys {
  id: string;
  titleKey: string;
  descriptionKey: string;
}

export const WHATS_NEW_FEATURES: WhatsNewFeatureKeys[] = [
  {
    id:             'navigation',
    titleKey:       'releaseWelcome.whatsNew.features.navigation.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.navigation.description',
  },
  {
    id:             'tables',
    titleKey:       'releaseWelcome.whatsNew.features.tables.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.tables.description',
  },
  {
    id:             'kubernetes',
    titleKey:       'releaseWelcome.whatsNew.features.kubernetes.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.kubernetes.description',
  },
  {
    id:             'hosted-provisioning',
    titleKey:       'releaseWelcome.whatsNew.features.hostedProvisioning.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.hostedProvisioning.description',
  },
];

/**
 * Products listed in the Rancher Prime promotion, shown to Community installations
 */
export const PRIME_PRODUCTS = [
  'releaseWelcome.prime.products.manager',
  'releaseWelcome.prime.products.distributions',
  'releaseWelcome.prime.products.fleet',
  'releaseWelcome.prime.products.security',
  'releaseWelcome.prime.products.storage',
  'releaseWelcome.prime.products.virtualization',
  'releaseWelcome.prime.products.observability',
  'releaseWelcome.prime.products.appCollection',
];

export const PRIME_URL = 'https://www.suse.com/products/rancher/';

export const SCC_URL = 'https://scc.suse.com/';

export const SUPPORT_HANDBOOK_URL = 'https://www.suse.com/support/handbook/';

/**
 * Benefits unlocked by registering a Prime installation
 */
export const PRIME_BENEFITS: { textKey: string, cta?: { actionKey: string, link: string } }[] = [
  { textKey: 'releaseWelcome.registration.benefits.support', cta: { actionKey: 'releaseWelcome.registration.supportHandbook', link: SUPPORT_HANDBOOK_URL } },
  { textKey: 'releaseWelcome.registration.benefits.appCollection' },
  { textKey: 'releaseWelcome.registration.benefits.images' },
  { textKey: 'releaseWelcome.registration.benefits.academy' },
];

/**
 * Registration page added by the rancher-prime extension (pkg/rancher-prime/config/constants.ts)
 */
export const REGISTRATION_ROUTE = { name: 'c-cluster-settings-registration', params: { cluster: 'local' } };

/**
 * The bundled content, in the language of the user
 */
export function defaultReleaseWelcomeContent(t: (key: string, args?: unknown, raw?: boolean) => string): ReleaseWelcomeContent {
  const text = (key: string) => t(key, {}, true);

  return {
    whatsNew: WHATS_NEW_FEATURES.map(({ id, titleKey, descriptionKey }) => ({
      id, title: text(titleKey), description: text(descriptionKey)
    })),
    prime: {
      title:       text('releaseWelcome.prime.title'),
      description: text('releaseWelcome.prime.description'),
      products:    PRIME_PRODUCTS.map(text),
      cta:         { action: text('releaseWelcome.prime.explore'), link: PRIME_URL },
    },
    registration: {
      title:       text('releaseWelcome.registration.title'),
      description: text('releaseWelcome.registration.description'),
      benefits:    PRIME_BENEFITS.map(({ textKey, cta }) => ({
        text: text(textKey),
        ...(cta ? { cta: { action: text(cta.actionKey), link: cta.link } } : {}),
      })),
      cta: { action: text('releaseWelcome.registration.open'), link: SCC_URL },
    },
  };
}
