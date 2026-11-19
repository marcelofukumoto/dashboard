import type { Router } from 'vue-router';
import type { Store } from 'vuex';
import {
  createGuideContext,
  guideState,
  nextStep,
  previousStep,
  registerHost,
  resolveTarget,
  resolveTargets,
  startGuide,
  stopGuide,
  unregisterHost,
} from '@shell/components/PrototypeGuide/useGuide';
import type { Guide, GuideContext } from '@shell/components/PrototypeGuide/useGuide';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('prototype guide', () => {
  let commit: jest.Mock;
  let ctx: GuideContext;
  let prepared: string[];
  let guide: Guide;

  beforeEach(() => {
    commit = jest.fn();
    prepared = [];
    ctx = createGuideContext({} as Router, { commit } as unknown as Store<unknown>);
    guide = {
      id:        'test',
      keyPrefix: 'test.steps',
      steps:     ['one', 'two', 'three'].map((id) => ({
        id,
        prepare: () => {
          prepared.push(id);
        }
      })),
    };
  });

  afterEach(() => {
    stopGuide();
  });

  it('runs the step\'s prepare and is ready once it finished', async() => {
    startGuide(guide, ctx);
    expect(guideState.ready).toBe(false);
    await flush();

    expect(prepared).toStrictEqual(['one']);
    expect(guideState.index).toBe(0);
    expect(guideState.ready).toBe(true);
  });

  it('closes a drawer left open before each step', async() => {
    startGuide(guide, ctx);
    await flush();

    expect(commit).toHaveBeenCalledWith('slideInPanel/close');
  });

  it('moves forward and back within the steps', async() => {
    startGuide(guide, ctx);
    previousStep();
    await flush();
    expect(guideState.index).toBe(0);

    nextStep();
    nextStep();
    nextStep();
    await flush();
    expect(guideState.index).toBe(2);

    previousStep();
    await flush();
    expect(guideState.index).toBe(1);
    expect(prepared).toStrictEqual(['one', 'two', 'three', 'two']);
  });

  it('starts at a given step, kept within range', async() => {
    startGuide(guide, ctx, 7);
    await flush();

    expect(guideState.index).toBe(2);
  });

  it('lets a newer step win over a slower prepare', async() => {
    let release: () => void = () => {};

    guide.steps[0].prepare = () => new Promise<void>((resolve) => {
      release = resolve;
    });
    startGuide(guide, ctx);
    nextStep();
    await flush();
    release();
    await flush();

    expect(guideState.index).toBe(1);
    expect(guideState.ready).toBe(true);
  });

  it('still shows a step whose prepare fails', async() => {
    guide.steps[0].prepare = () => Promise.reject(new Error('no such tab'));
    startGuide(guide, ctx);
    await flush();

    expect(guideState.ready).toBe(true);
  });

  it('stops', async() => {
    startGuide(guide, ctx);
    await flush();
    stopGuide();

    expect(guideState.guide).toBeNull();
  });

  it('keeps the most recently mounted host on top', () => {
    const first = registerHost();
    const second = registerHost();

    expect(guideState.hosts.slice(-2)).toStrictEqual([first, second]);
    unregisterHost(second);
    expect(guideState.hosts[guideState.hosts.length - 1]).toBe(first);
    unregisterHost(first);
  });

  it('navigates again when another navigation cancels the first one', async() => {
    const currentRoute = { value: { name: 'list' } };
    const push = jest.fn()
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => {
        currentRoute.value = { name: 'form' };

        return Promise.resolve();
      });
    const nav = createGuideContext({ currentRoute, push } as unknown as Router, { commit } as unknown as Store<unknown>);

    await nav.go({ name: 'form' }, (route) => route.name === 'form');

    expect(push).toHaveBeenCalledTimes(2);
    expect(currentRoute.value.name).toBe('form');
  });

  it('doesn\'t navigate when it is already there', async() => {
    const push = jest.fn();
    const nav = createGuideContext({ currentRoute: { value: { name: 'form' } }, push } as unknown as Router, { commit } as unknown as Store<unknown>);

    await nav.go({ name: 'form' }, (route) => route.name === 'form');

    expect(push).not.toHaveBeenCalled();
  });

  it('resolves a target from a selector or a function', () => {
    document.body.innerHTML = '<div data-testid="here"></div>';

    expect(resolveTarget('[data-testid="here"]')).toBe(document.body.firstElementChild);
    expect(resolveTarget(() => document.body.firstElementChild)).toBe(document.body.firstElementChild);
    expect(resolveTarget('[data-testid="missing"]')).toBeNull();
    expect(resolveTarget()).toBeNull();
  });

  it('spotlights several elements from one target', () => {
    document.body.innerHTML = '<p id="a"></p><p id="b"></p>';
    const [a, b] = Array.from(document.body.children);

    expect(resolveTargets(() => [a, b])).toStrictEqual([a, b]);
    expect(resolveTarget(() => [a, b])).toBe(a);
    expect(resolveTargets(() => null)).toStrictEqual([]);
  });
});
