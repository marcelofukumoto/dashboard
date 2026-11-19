import type { Router } from 'vue-router';
import type { Store } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { createGuideContext, startGuide } from '@shell/components/PrototypeGuide/useGuide';
import type { Guide, GuideContext } from '@shell/components/PrototypeGuide/useGuide';
import { FALLBACK_SECRET } from '@shell/components/fleet/FleetOCIStorage/resolve';
import {
  APPLICATIONS_ROUTE, OCI_STORAGE_ROUTE, SECRET_ROUTE, bundleLocation, fleetClusterLocation, gitRepoLocation, secretLocation,
} from '@shell/components/fleet/FleetOCIStorage/locations';

const PAGES = 'fleet.ociStorage.guide.pages';
const FAILING_REPO = 'store-pos';
const RETRYING_PULL = 'store-pos/store-pos-app/harvester-11-2';
const FALLBACK_BUNDLE = 'payments-api-deployment';
// test-k3s: its Fleet Cluster object is named after the imported cluster's id
const SHOWCASE_CLUSTER = 'c-p2bmg';

async function onList(ctx: GuideContext) {
  await ctx.go({ name: OCI_STORAGE_ROUTE, params: { cluster: BLANK_CLUSTER } }, (route) => route.name === OCI_STORAGE_ROUTE);
}

const secretRow = (name: string) => document.querySelector(`[data-testid="fleet-oci-secret-${ name }"]`)?.closest('tr') || null;
const setList = (name: string) => secretRow(name)?.nextElementSibling?.querySelector('[data-testid="fleet-oci-set-list"]') || null;

async function expandSecret(ctx: GuideContext, name: string) {
  await onList(ctx);
  await ctx.waitFor(() => secretRow(name));
  if (!setList(name)) {
    await ctx.click(() => secretRow(name)?.querySelector('td.row-expand i'));
  }
}

async function onForm(ctx: GuideContext, name: string) {
  await ctx.go(secretLocation(name), (route) => route.name === SECRET_ROUTE && route.params.id === name);
}

/** A Fleet detail page, on its OCI Storage tab */
async function onTab(ctx: GuideContext, location: { name: string, params: Record<string, string> }) {
  await ctx.go(location, (route) => route.name === location.name && route.params.id === location.params.id);
  await ctx.click('[data-testid="btn-oci-storage"]');
}

// A row's reason is the line the table draws under it
const reasonRow = (testId: string) => () => document.querySelector(`[data-testid="${ testId }"]`)?.closest('tr')?.nextElementSibling;

// The GitRepo's row and the state message the table draws under it
const appRow = (name: string) => () => {
  const link = Array.from(document.querySelectorAll('table tbody tr.main-row a')).find((a) => a.textContent?.trim() === name);
  const row = link?.closest('tr');
  const message = row?.nextElementSibling?.classList.contains('state-description') ? row.nextElementSibling : null;

  return row ? [row, ...(message ? [message] : [])] : null;
};

export const OCI_STORAGE_GUIDE: Guide = {
  id:        'fleet-oci-storage',
  keyPrefix: 'fleet.ociStorage.guide.steps',
  steps:     [
    {
      id: 'intro', page: `${ PAGES }.ociStorage`, change: 'new', prepare: onList
    },
    {
      id: 'secrets', page: `${ PAGES }.ociStorage`, change: 'new', target: '[data-testid="fleet-oci-secrets-table"]', prepare: onList
    },
    {
      id: 'fallback', page: `${ PAGES }.ociStorage`, change: 'new', target: '[data-testid="fleet-oci-default-tag"]', prepare: onList
    },
    {
      id: 'push', page: `${ PAGES }.ociStorage`, change: 'new', target: `[data-testid="fleet-oci-push-${ FALLBACK_SECRET }"]`, prepare: onList
    },
    {
      id:      'sets',
      page:    `${ PAGES }.ociStorage`,
      change:  'new',
      target:  () => setList(FALLBACK_SECRET),
      prepare: (ctx) => expandSecret(ctx, FALLBACK_SECRET),
    },
    {
      id:      'matches',
      page:    `${ PAGES }.ociStorage`,
      change:  'new',
      target:  () => setList(FALLBACK_SECRET)?.querySelector('[data-testid="fleet-oci-set-matches-eu-staging"]'),
      prepare: (ctx) => expandSecret(ctx, FALLBACK_SECRET),
    },
    {
      id: 'usedBy', page: `${ PAGES }.ociStorage`, change: 'new', target: `[data-testid="fleet-oci-used-by-${ FALLBACK_SECRET }"]`, prepare: onList
    },
    {
      id:      'formPush',
      page:    `${ PAGES }.secretForm`,
      change:  'new',
      target:  '[data-testid="fleet-oci-form-push"]',
      prepare: (ctx) => onForm(ctx, FALLBACK_SECRET),
    },
    {
      id: 'formSet', page: `${ PAGES }.secretForm`, change: 'new', target: '[data-testid="fleet-oci-set-0"]', prepare: (ctx) => onForm(ctx, FALLBACK_SECRET)
    },
    {
      id:      'formPreview',
      page:    `${ PAGES }.secretForm`,
      change:  'new',
      target:  '[data-testid="fleet-oci-form-preview"]',
      prepare: (ctx) => onForm(ctx, FALLBACK_SECRET),
    },
    {
      id:      'formYaml',
      page:    `${ PAGES }.secretForm`,
      change:  'new',
      target:  '[data-testid="fleet-oci-form-yaml"]',
      prepare: (ctx) => onForm(ctx, FALLBACK_SECRET),
    },
    {
      id:      'appBundles',
      page:    `${ PAGES }.appBundles`,
      change:  'existing',
      target:  appRow(FAILING_REPO),
      prepare: (ctx) => ctx.go({ name: APPLICATIONS_ROUTE, params: { cluster: BLANK_CLUSTER } }, (route) => route.name === APPLICATIONS_ROUTE),
    },
    {
      id:      'gitRepoTab',
      page:    `${ PAGES }.gitRepo`,
      change:  'changed',
      target:  '[data-testid="fleet-oci-workload-tab"]',
      prepare: (ctx) => onTab(ctx, gitRepoLocation(FAILING_REPO)),
    },
    {
      id:      'retrying',
      page:    `${ PAGES }.gitRepo`,
      change:  'changed',
      target:  reasonRow(`fleet-oci-pull-${ RETRYING_PULL }`),
      prepare: (ctx) => onTab(ctx, gitRepoLocation(FAILING_REPO)),
    },
    {
      id:      'drawer',
      page:    `${ PAGES }.gitRepo`,
      change:  'changed',
      target:  '[data-testid="fleet-oci-deployment-panel"] ol.attempts',
      prepare: async(ctx) => {
        await onTab(ctx, gitRepoLocation(FAILING_REPO));
        await ctx.click(`[data-testid="fleet-oci-pull-${ RETRYING_PULL }"]`);
      },
    },
    {
      id:      'bundleTab',
      page:    `${ PAGES }.bundle`,
      change:  'changed',
      target:  '[data-testid="fleet-oci-workload-tab"]',
      prepare: (ctx) => onTab(ctx, bundleLocation(FALLBACK_BUNDLE)),
    },
    {
      id:      'clusterTab',
      page:    `${ PAGES }.cluster`,
      change:  'changed',
      target:  '[data-testid="fleet-oci-cluster-tab"]',
      prepare: (ctx) => onTab(ctx, fleetClusterLocation(SHOWCASE_CLUSTER)),
    },
    {
      id: 'forms', page: `${ PAGES }.forms`, change: 'changed', prepare: onList
    },
    {
      id: 'questions', page: `${ PAGES }.ociStorage`, change: 'new', prepare: onList
    },
  ],
};

export function startOCIStorageGuide(router: Router, store: Store<unknown>, index = 0) {
  startGuide(OCI_STORAGE_GUIDE, createGuideContext(router, store), index);
}
