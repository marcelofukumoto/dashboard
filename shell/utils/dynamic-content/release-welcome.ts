/**
 *
 * The code in this file picks the release welcome modal content for the running version from the dynamic content metadata
 *
 * The content is remote, so each section is checked and only kept when it is complete. The modal shows its bundled
 * content for the sections that are missing or invalid.
 *
 */

import semver from 'semver';
import type {
  ReleaseWelcomeBenefit, ReleaseWelcomeContent, ReleaseWelcomeFeature, ReleaseWelcomePrime, ReleaseWelcomeRegistration
} from '@shell/config/release-welcome';
import { CallToAction, Context, ReleaseWelcomeInfo, VersionInfo } from './types';

// Links have to be secure, the same as the dynamic content endpoint
const HTTPS_PREFIX = 'https://';

let releaseWelcomeContent: Partial<ReleaseWelcomeContent> = {};

/**
 * Release welcome content for the running version from the last processed dynamic content, one entry per valid section
 */
export function getReleaseWelcomeContent(): Partial<ReleaseWelcomeContent> {
  return releaseWelcomeContent;
}

const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();

const isCallToAction = (cta: any): cta is CallToAction => isText(cta?.action) && isText(cta?.link) && cta.link.startsWith(HTTPS_PREFIX);

const isFeature = (feature: any): feature is ReleaseWelcomeFeature => isText(feature?.title) && isText(feature?.description);

const isBenefit = (benefit: any): benefit is ReleaseWelcomeBenefit => isText(benefit?.text) && (benefit.cta === undefined || isCallToAction(benefit.cta));

const isPrime = (prime: any): prime is ReleaseWelcomePrime => isText(prime?.title) && isText(prime?.description) &&
  Array.isArray(prime.products) && prime.products.every(isText) && isCallToAction(prime.cta);

const isRegistration = (registration: any): registration is ReleaseWelcomeRegistration => isText(registration?.title) && isText(registration?.description) &&
  Array.isArray(registration.benefits) && registration.benefits.every(isBenefit) && isCallToAction(registration.cta);

/**
 * Main exported function that will process the release welcome content
 *
 * @param context Context helper providing access to config, logger, store
 * @param entries Release welcome content, per version
 * @param versionInfo Version information
 */
export function processReleaseWelcome(context: Context, entries: ReleaseWelcomeInfo[] | undefined, versionInfo: VersionInfo): void {
  const { logger } = context;

  releaseWelcomeContent = {};

  if (!Array.isArray(entries) || !versionInfo?.version) {
    return;
  }

  const entry = entries.find((e) => isText(e?.version) && semver.satisfies(versionInfo.version, e.version));

  if (!entry) {
    return;
  }

  const content: Partial<ReleaseWelcomeContent> = {};

  if (entry.whatsNew !== undefined) {
    if (Array.isArray(entry.whatsNew) && entry.whatsNew.every(isFeature)) {
      // An empty list hides the card
      content.whatsNew = entry.whatsNew.map((feature, i) => ({
        id: isText(feature.id) ? feature.id : `feature-${ i }`, title: feature.title, description: feature.description
      }));
    } else {
      logger.error('Release welcome: invalid whatsNew, the bundled content is used instead');
    }
  }

  if (entry.prime !== undefined) {
    if (isPrime(entry.prime)) {
      content.prime = entry.prime;
    } else {
      logger.error('Release welcome: invalid prime, the bundled content is used instead');
    }
  }

  if (entry.registration !== undefined) {
    if (isRegistration(entry.registration)) {
      content.registration = entry.registration;
    } else {
      logger.error('Release welcome: invalid registration, the bundled content is used instead');
    }
  }

  logger.info(`Release welcome content for ${ entry.version }: ${ Object.keys(content).join(', ') || 'none' }`);

  releaseWelcomeContent = content;
}
