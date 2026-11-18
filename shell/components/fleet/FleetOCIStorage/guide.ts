import type { Router } from 'vue-router';
import type { Store } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { createGuideContext, startGuide } from '@shell/components/PrototypeGuide/useGuide';
import type { Guide, GuideContext } from '@shell/components/PrototypeGuide/useGuide';
import { FALLBACK_SECRET } from '@shell/components/fleet/FleetOCIStorage/resolve';

const LIST = 'c-cluster-fleet-oci-storage';
const FORM = 'c-cluster-fleet-oci-storage-secret-id';
const SHOWCASE_DEPLOYMENT = 'monitoring-stack/monitoring-stack-grafana/eu-staging-01';
const RETRYING_DEPLOYMENT = 'store-pos/store-pos-app/edge-store-0142';

async function onList(ctx: GuideContext, tab: 'secrets' | 'deployments') {
  await ctx.go({
    name: LIST, params: { cluster: BLANK_CLUSTER }, hash: `#${ tab }`
  }, (route) => route.name === LIST);
  await ctx.click(`[data-testid="btn-${ tab }"]`);
}

const secretRow = (name: string) => document.querySelector(`[data-testid="fleet-oci-secret-${ name }"]`)?.closest('tr') || null;
const setList = (name: string) => secretRow(name)?.nextElementSibling?.querySelector('[data-testid="fleet-oci-set-list"]') || null;

async function expandSecret(ctx: GuideContext, name: string) {
  await onList(ctx, 'secrets');
  await ctx.waitFor(() => secretRow(name));
  if (!setList(name)) {
    await ctx.click(() => secretRow(name)?.querySelector('td.row-expand i'));
  }
}

async function onForm(ctx: GuideContext, name: string) {
  await ctx.go({ name: FORM, params: { cluster: BLANK_CLUSTER, id: name } }, (route) => route.name === FORM && route.params.id === name);
}

export const OCI_STORAGE_GUIDE: Guide = {
  id:        'fleet-oci-storage',
  keyPrefix: 'fleet.ociStorage.guide.steps',
  steps:     [
    { id: 'intro', prepare: (ctx) => onList(ctx, 'secrets') },
    {
      id: 'summary', target: '[data-testid="fleet-oci-summary"]', prepare: (ctx) => onList(ctx, 'secrets')
    },
    {
      id: 'failing', target: '[data-testid="fleet-oci-failing-banner"]', prepare: (ctx) => onList(ctx, 'secrets')
    },
    {
      id: 'secrets', target: '[data-testid="fleet-oci-secrets-table"]', prepare: (ctx) => onList(ctx, 'secrets')
    },
    {
      id: 'fallback', target: '[data-testid="fleet-oci-default-tag"]', prepare: (ctx) => onList(ctx, 'secrets')
    },
    {
      id: 'push', target: `[data-testid="fleet-oci-push-${ FALLBACK_SECRET }"]`, prepare: (ctx) => onList(ctx, 'secrets')
    },
    {
      id: 'sets', target: () => setList(FALLBACK_SECRET), prepare: (ctx) => expandSecret(ctx, FALLBACK_SECRET)
    },
    {
      id:      'matches',
      target:  () => setList(FALLBACK_SECRET)?.querySelector('[data-testid="fleet-oci-set-matches-eu-staging"]'),
      prepare: (ctx) => expandSecret(ctx, FALLBACK_SECRET),
    },
    {
      id: 'formPush', target: '[data-testid="fleet-oci-form-push"]', prepare: (ctx) => onForm(ctx, FALLBACK_SECRET)
    },
    {
      id: 'formSet', target: '[data-testid="fleet-oci-set-0"]', prepare: (ctx) => onForm(ctx, FALLBACK_SECRET)
    },
    {
      id: 'formPreview', target: '[data-testid="fleet-oci-form-preview"]', prepare: (ctx) => onForm(ctx, FALLBACK_SECRET)
    },
    {
      id: 'formYaml', target: '[data-testid="fleet-oci-form-yaml"]', prepare: (ctx) => onForm(ctx, FALLBACK_SECRET)
    },
    {
      id: 'deployments', target: '[data-testid="fleet-oci-deployments-table"]', prepare: (ctx) => onList(ctx, 'deployments')
    },
    {
      id:      'retrying',
      // The reason line the table draws under the row
      target:  () => document.querySelector(`[data-testid="fleet-oci-deployment-${ RETRYING_DEPLOYMENT }"]`)?.closest('tr')?.nextElementSibling,
      prepare: (ctx) => onList(ctx, 'deployments'),
    },
    {
      id:      'drawer',
      target:  '[data-testid="fleet-oci-deployment-panel"] ol.attempts',
      prepare: async(ctx) => {
        await onList(ctx, 'deployments');
        await ctx.click(`[data-testid="fleet-oci-deployment-${ SHOWCASE_DEPLOYMENT }"]`);
      },
    },
    { id: 'elsewhere', prepare: (ctx) => onList(ctx, 'secrets') },
    { id: 'questions', prepare: (ctx) => onList(ctx, 'secrets') },
  ],
};

export function startOCIStorageGuide(router: Router, store: Store<unknown>, index = 0) {
  startGuide(OCI_STORAGE_GUIDE, createGuideContext(router, store), index);
}
