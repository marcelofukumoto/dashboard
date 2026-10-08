import semver from 'semver';
import { getReleaseWelcomeContent, processReleaseWelcome } from '../release-welcome';
import { Context, ReleaseWelcomeInfo } from '../types';

const VERSION_2160 = { version: semver.coerce('v2.16.0') as semver.SemVer, isPrime: false };

const WHATS_NEW = [{
  id: 'navigation', title: 'Improved navigation', description: 'A new switcher'
}];

const PRIME = {
  title:       'Go Prime',
  description: 'Enterprise support',
  products:    ['Rancher Manager'],
  cta:         { action: 'Explore', link: 'https://www.suse.com/products/rancher/' },
};

const REGISTRATION = {
  title:       'Register',
  description: 'Registering unlocks:',
  benefits:    [{ text: 'Support', cta: { action: 'Support handbook', link: 'https://www.suse.com/support/handbook/' } }, { text: 'Images' }],
  cta:         { action: 'Open SUSE Customer Center', link: 'https://scc.suse.com/' },
};

const entry = (content: Partial<ReleaseWelcomeInfo> = {}): ReleaseWelcomeInfo => ({ version: '>=2.16.0 <2.17.0', ...content });

describe('processReleaseWelcome', () => {
  let context: Context;

  beforeEach(() => {
    context = { logger: { error: jest.fn(), info: jest.fn() } } as unknown as Context;
  });

  it('should keep every valid section', () => {
    processReleaseWelcome(context, [entry({
      whatsNew: WHATS_NEW, prime: PRIME, registration: REGISTRATION
    })], VERSION_2160);

    expect(getReleaseWelcomeContent()).toStrictEqual({
      whatsNew: WHATS_NEW, prime: PRIME, registration: REGISTRATION
    });
  });

  it('should only keep the sections that are given', () => {
    processReleaseWelcome(context, [entry({ whatsNew: WHATS_NEW })], VERSION_2160);

    expect(getReleaseWelcomeContent()).toStrictEqual({ whatsNew: WHATS_NEW });
  });

  it('should use the first entry for the running version', () => {
    const other = [{
      id: 'other', title: 'Other', description: 'Other version'
    }];

    processReleaseWelcome(context, [
      { version: '>=2.17.0 <2.18.0', whatsNew: other },
      entry({ whatsNew: WHATS_NEW }),
      entry({ whatsNew: other }),
    ], VERSION_2160);

    expect(getReleaseWelcomeContent()).toStrictEqual({ whatsNew: WHATS_NEW });
  });

  it.each([
    ['no entries', undefined],
    ['an entry that is not a list', { version: '2.16.0' }],
    ['no entry for the running version', [{ version: '>=2.17.0', whatsNew: WHATS_NEW }]],
    ['an entry without a version', [{ whatsNew: WHATS_NEW }]],
  ])('should have no content with %s', (_, entries) => {
    processReleaseWelcome(context, [entry({ whatsNew: WHATS_NEW })], VERSION_2160);
    processReleaseWelcome(context, entries as any, VERSION_2160);

    expect(getReleaseWelcomeContent()).toStrictEqual({});
  });

  it('should keep an empty what\'s new list, to hide the card', () => {
    processReleaseWelcome(context, [entry({ whatsNew: [] })], VERSION_2160);

    expect(getReleaseWelcomeContent()).toStrictEqual({ whatsNew: [] });
  });

  it('should give features without an id one from their position', () => {
    processReleaseWelcome(context, [entry({ whatsNew: [{ title: 'Title', description: 'Description' } as any] })], VERSION_2160);

    expect(getReleaseWelcomeContent().whatsNew).toStrictEqual([{
      id: 'feature-0', title: 'Title', description: 'Description'
    }]);
  });

  it.each([
    ['whatsNew', 'a feature without a description', { whatsNew: [{ id: 'a', title: 'Title' }] }],
    ['whatsNew', 'a list that is not an array', { whatsNew: 'Improved navigation' }],
    ['prime', 'a product that is not text', { prime: { ...PRIME, products: ['Rancher Manager', 1] } }],
    ['prime', 'a link that is not https', { prime: { ...PRIME, cta: { action: 'Explore', link: 'http://www.suse.com/' } } }],
    ['prime', 'a script link', { prime: { ...PRIME, cta: { action: 'Explore', link: 'javascript:alert(1)' } } }],
    ['prime', 'an empty title', { prime: { ...PRIME, title: ' ' } }],
    ['registration', 'a benefit link that is not https', { registration: { ...REGISTRATION, benefits: [{ text: 'Support', cta: { action: 'Handbook', link: 'ftp://suse.com' } }] } }],
    ['registration', 'no call to action', { registration: { ...REGISTRATION, cta: undefined } }],
  ])('should drop the %s section with %s', (section: string, _: string, content: any) => {
    processReleaseWelcome(context, [entry({ whatsNew: WHATS_NEW, ...content })], VERSION_2160);

    expect(section in getReleaseWelcomeContent()).toStrictEqual(false);
    expect(context.logger.error).toHaveBeenCalledWith(`Release welcome: invalid ${ section }, the bundled content is used instead`);
  });
});
