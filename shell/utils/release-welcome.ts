import { defineAsyncComponent } from 'vue';
import semver from 'semver';
import { getVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import { defaultReleaseWelcomeContent, ReleaseWelcomeContent } from '@shell/config/release-welcome';
import { getReleaseWelcomeContent } from '@shell/utils/dynamic-content/release-welcome';

// Longest wait for dynamic content after login. It is fetched once a day, 3 seconds after login, and can take longer
// or never arrive (e.g. air-gapped). Past this the modal opens with the bundled content
const DYNAMIC_CONTENT_WAIT = 5000;

/**
 * Minor version of the running Rancher (e.g. '2.16'), or undefined when the version can't be parsed (e.g. dev builds)
 */
export function releaseWelcomeVersion(): string | undefined {
  const version = semver.coerce(getVersionData().Version);

  return version ? `${ version.major }.${ version.minor }` : undefined;
}

/**
 * The welcome modal is shown once per minor release: when the user has not read it for this minor version or a later one.
 * Not shown in single product mode (e.g. Harvester), the content is about Rancher
 */
export function shouldShowReleaseWelcome(getters: any): boolean {
  const version = releaseWelcomeVersion();

  if (!version || getters['isSingleProduct']) {
    return false;
  }

  const lastRead = semver.coerce(getters['prefs/get'](READ_RELEASE_WELCOME));

  return !lastRead || semver.lt(lastRead, `${ version }.0`);
}

/**
 * Content of the welcome modal: the sections from dynamic content for the running version, the bundled ones otherwise
 */
export function releaseWelcomeContent(t: (key: string, args?: unknown, raw?: boolean) => string): ReleaseWelcomeContent {
  return {
    ...defaultReleaseWelcomeContent(t),
    ...getReleaseWelcomeContent(),
  };
}

/**
 * Open the welcome modal and mark it as read, it can be reopened from the user menu
 */
export async function openReleaseWelcome(commit: any, dispatch: any) {
  commit('modal/openModal', {
    component:           defineAsyncComponent(() => import('@shell/dialog/ReleaseWelcomeDialog.vue')),
    modalWidth:          '900px',
    // Only informative, so Escape and clicking outside close it too
    closeOnClickOutside: true,
  });

  const version = releaseWelcomeVersion();

  if (version) {
    try {
      await dispatch('prefs/set', { key: READ_RELEASE_WELCOME, value: version });
    } catch (e) {
      // Not saved: the modal is shown again on the next login
      console.warn('Unable to mark the welcome modal as read', e); // eslint-disable-line no-console
    }
  }
}

/**
 * Open the welcome modal if the user has not read it for this minor version.
 * Waits for dynamic content first (up to DYNAMIC_CONTENT_WAIT), so the modal opens with its content
 */
export async function showReleaseWelcomeIfNew(commit: any, dispatch: any, getters: any, dynamicContent?: Promise<unknown>) {
  if (!shouldShowReleaseWelcome(getters)) {
    return;
  }

  if (dynamicContent) {
    await Promise.race([dynamicContent, new Promise((resolve) => setTimeout(resolve, DYNAMIC_CONTENT_WAIT))]);
  }

  await openReleaseWelcome(commit, dispatch);
}
