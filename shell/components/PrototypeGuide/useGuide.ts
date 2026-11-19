import { reactive, readonly } from 'vue';
import type { RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router';
import type { Store } from 'vuex';

// A guided tour for prototypes: each step spotlights part of the page and explains it. The state lives at module
// level, so a tour that moves between pages keeps going when one page's host unmounts and the next one mounts.

/** A selector, or a function for anything a selector can't reach; several elements are spotlighted together */
export type GuideTarget = string | (() => Element | Element[] | null | undefined);

export interface GuideContext {
  router: Router;
  store: Store<unknown>;
  /** Clicks the first element matching the selector once it exists */
  click(selector: string | (() => Element | null | undefined)): Promise<void>;
  waitFor(target: GuideTarget, timeout?: number): Promise<Element | null>;
  /** Navigates until `arrived` holds: a page that writes its tab hash on mount cancels a navigation made at that moment */
  go(location: RouteLocationRaw, arrived: (route: RouteLocationNormalizedLoaded) => boolean): Promise<void>;
}

/** How the page a step is on relates to the product today, so reviewers see where the change lands */
export type GuidePageChange = 'new' | 'changed' | 'existing';

export interface GuideStep {
  /** Also the i18n key: `${ keyPrefix }.${ id }.title`, `.body`, and the optional `.design` and `.backend` */
  id: string;
  /** i18n key of the page's name, shown with `change` on the card */
  page?: string;
  change?: GuidePageChange;
  /** What to spotlight. Without one, the card shows in the middle of the page */
  target?: GuideTarget;
  /** Gets the page into the state the step talks about. It must work from any other step, going back or forward */
  prepare?: (ctx: GuideContext) => Promise<void> | void;
}

export interface Guide {
  id: string;
  keyPrefix: string;
  steps: GuideStep[];
}

interface GuideState {
  guide: Guide | null;
  index: number;
  ready: boolean;
  hosts: number[];
}

const state = reactive<GuideState>({
  guide: null, index: 0, ready: false, hosts: []
});

let context: GuideContext | null = null;
// A newer step change wins over a slower prepare
let run = 0;
let nextHost = 1;

export const guideState = readonly(state);

export function resolveTargets(target?: GuideTarget): Element[] {
  if (!target) {
    return [];
  }

  const found = typeof target === 'string' ? document.querySelector(target) : target();

  return (Array.isArray(found) ? found : [found]).filter((el): el is Element => !!el);
}

export function resolveTarget(target?: GuideTarget): Element | null {
  return resolveTargets(target)[0] || null;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(target: GuideTarget, timeout = 5000): Promise<Element | null> {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    const found = resolveTarget(target);

    if (found) {
      return found;
    }

    await pause(100);
  }

  return null;
}

export function createGuideContext(router: Router, store: Store<unknown>): GuideContext {
  return {
    router,
    store,
    waitFor,
    async click(target) {
      const found = await waitFor(target);

      if (found instanceof HTMLElement) {
        found.click();
        // Let the page react (tabs, rows, drawers) before the step measures its target
        await pause(300);
      }
    },
    async go(location, arrived) {
      for (let attempt = 0; attempt < 5 && !arrived(router.currentRoute.value); attempt++) {
        await router.push(location).catch(() => {});
        if (!arrived(router.currentRoute.value)) {
          await pause(300);
        }
      }
    },
  };
}

async function show(index: number) {
  const guide = state.guide;

  if (!guide || !context) {
    return;
  }

  const current = ++run;
  const step = guide.steps[index];

  state.index = index;
  state.ready = false;

  try {
    // A drawer left open by an earlier step would cover what this one points at
    context.store.commit('slideInPanel/close');
    await step.prepare?.(context);
    if (step.target) {
      // Generous, because a step can land on a page that still has to load its resources
      await waitFor(step.target, 10000);
    }
  } catch {
    // A step that can't set itself up still shows its card, in the middle of the page
  }

  if (current === run) {
    state.ready = true;
  }
}

export function startGuide(guide: Guide, ctx: GuideContext, index = 0) {
  state.guide = guide;
  context = ctx;
  show(Math.min(Math.max(index, 0), guide.steps.length - 1));
}

export function nextStep() {
  if (state.guide && state.index < state.guide.steps.length - 1) {
    show(state.index + 1);
  }
}

export function previousStep() {
  if (state.guide && state.index > 0) {
    show(state.index - 1);
  }
}

export function stopGuide() {
  run++;
  state.guide = null;
  state.ready = false;
  context = null;
}

/** Several pages can host the overlay; only the most recently mounted one draws it */
export function registerHost(): number {
  const id = nextHost++;

  state.hosts.push(id);

  return id;
}

export function unregisterHost(id: number) {
  state.hosts = state.hosts.filter((host) => host !== id);
}
