<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import {
  guideState, nextStep, previousStep, registerHost, resolveTarget, stopGuide, unregisterHost
} from '@shell/components/PrototypeGuide/useGuide';

const PADDING = 6;
const GAP = 16;
const MARGIN = 16;

interface Box { top: number, left: number, width: number, height: number }

const store = useStore();
const { t: translate } = useI18n(store);
// Raw because every caller renders through text interpolation
const t = (key: string, args?: unknown): string => translate(key, args, true);
const exists = (key: string): boolean => !!store.getters['i18n/exists'](key);

const host = registerHost();
const card = ref<HTMLElement | null>(null);
const target = ref<Box | null>(null);
const cardSize = ref({ width: 400, height: 260 });
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
let frame = 0;

const visible = computed(() => !!guideState.guide && guideState.hosts[guideState.hosts.length - 1] === host);
const step = computed(() => guideState.guide?.steps[guideState.index]);
const total = computed(() => guideState.guide?.steps.length || 0);
const isLast = computed(() => guideState.index === total.value - 1);
const titleId = `prototype-guide-title-${ host }`;

const text = (part: string): string => {
  const key = `${ guideState.guide?.keyPrefix }.${ step.value?.id }.${ part }`;

  return exists(key) ? t(key) : '';
};

const spotlight = computed<Box | null>(() => {
  if (!guideState.ready || !target.value) {
    return null;
  }

  const {
    top, left, width, height
  } = target.value;

  return {
    top: top - PADDING, left: left - PADDING, width: width + PADDING * 2, height: height + PADDING * 2
  };
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

// Below the target, then above, then beside it; a target that fills the screen gets the card in a corner
const cardPosition = computed(() => {
  const { width, height } = cardSize.value;
  const vw = viewport.value.width;
  const vh = viewport.value.height;
  const box = spotlight.value;

  if (!box) {
    return { top: (vh - height) / 2, left: (vw - width) / 2 };
  }

  const bottom = box.top + box.height;
  const right = box.left + box.width;

  if (bottom + GAP + height <= vh - MARGIN) {
    return { top: bottom + GAP, left: clamp(box.left, MARGIN, vw - width - MARGIN) };
  }

  if (box.top - GAP - height >= MARGIN) {
    return { top: box.top - GAP - height, left: clamp(box.left, MARGIN, vw - width - MARGIN) };
  }

  if (right + GAP + width <= vw - MARGIN) {
    return { top: clamp(box.top, MARGIN, vh - height - MARGIN), left: right + GAP };
  }

  if (box.left - GAP - width >= MARGIN) {
    return { top: clamp(box.top, MARGIN, vh - height - MARGIN), left: box.left - GAP - width };
  }

  return { top: vh - height - MARGIN, left: vw - width - MARGIN };
});

const px = (box: Partial<Box>) => Object.fromEntries(Object.entries(box).map(([k, v]) => [k, `${ Math.round(v as number) }px`]));

const same = (a: Box | null, b: Box | null) => a === b || (!!a && !!b &&
  Math.round(a.top) === Math.round(b.top) && Math.round(a.left) === Math.round(b.left) &&
  Math.round(a.width) === Math.round(b.width) && Math.round(a.height) === Math.round(b.height));

// The target moves when the page scrolls, a row expands or the drawer slides in, so follow it every frame
function track() {
  const found = resolveTarget(step.value?.target);
  const rect = found?.getBoundingClientRect();
  const next = rect && rect.width && rect.height ? {
    top: rect.top, left: rect.left, width: rect.width, height: rect.height
  } : null;

  if (!same(target.value, next)) {
    target.value = next;
  }

  if (card.value && (card.value.offsetWidth !== cardSize.value.width || card.value.offsetHeight !== cardSize.value.height)) {
    cardSize.value = { width: card.value.offsetWidth, height: card.value.offsetHeight };
  }

  if (viewport.value.width !== window.innerWidth || viewport.value.height !== window.innerHeight) {
    viewport.value = { width: window.innerWidth, height: window.innerHeight };
  }

  frame = requestAnimationFrame(track);
}

function onKey(event: KeyboardEvent) {
  if (!visible.value) {
    return;
  }

  if (event.key === 'Escape') {
    event.stopPropagation();
    stopGuide();
  } else if (event.key === 'ArrowRight') {
    nextStep();
  } else if (event.key === 'ArrowLeft') {
    previousStep();
  }
}

watch(() => [guideState.ready, guideState.index, visible.value], async([ready]) => {
  if (!ready || !visible.value) {
    return;
  }

  const found = resolveTarget(step.value?.target);

  if (found) {
    const tall = found.getBoundingClientRect().height > window.innerHeight * 0.6;

    found.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' });
  }

  await nextTick();
  card.value?.focus();
});

onMounted(() => {
  frame = requestAnimationFrame(track);
  document.addEventListener('keydown', onKey, true);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  document.removeEventListener('keydown', onKey, true);
  unregisterHost(host);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && step"
      class="prototype-guide"
      data-testid="prototype-guide"
    >
      <div
        class="guide-blocker"
        :class="{ dimmed: !spotlight }"
        @click.stop
      />
      <div
        v-if="spotlight"
        class="guide-spotlight"
        :style="px(spotlight)"
      />
      <section
        ref="card"
        class="guide-card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        :style="px(cardPosition)"
        data-testid="prototype-guide-card"
      >
        <header class="guide-header">
          <span class="text-muted">{{ t('prototypeGuide.step', { current: guideState.index + 1, total }) }}</span>
          <RcButton
            variant="ghost"
            size="small"
            :aria-label="t('prototypeGuide.close')"
            data-testid="prototype-guide-close"
            @click="stopGuide"
          >
            <i
              class="icon icon-close"
              aria-hidden="true"
            />
          </RcButton>
        </header>

        <h3 :id="titleId">
          {{ text('title') }}
        </h3>
        <p>{{ text('body') }}</p>

        <div
          v-if="text('design')"
          class="guide-note design"
          data-testid="prototype-guide-design"
        >
          <span class="guide-label">{{ t('prototypeGuide.design') }}</span>
          <p>{{ text('design') }}</p>
        </div>
        <div
          v-if="text('backend')"
          class="guide-note backend"
          data-testid="prototype-guide-backend"
        >
          <span class="guide-label">{{ t('prototypeGuide.backend') }}</span>
          <p>{{ text('backend') }}</p>
        </div>

        <footer class="guide-footer">
          <span
            v-if="!guideState.ready"
            class="text-muted"
          >
            <i
              class="icon icon-spinner icon-spin"
              aria-hidden="true"
            />
          </span>
          <RcButton
            variant="secondary"
            size="small"
            :disabled="guideState.index === 0"
            data-testid="prototype-guide-back"
            @click="previousStep"
          >
            {{ t('prototypeGuide.back') }}
          </RcButton>
          <RcButton
            variant="primary"
            size="small"
            data-testid="prototype-guide-next"
            @click="isLast ? stopGuide() : nextStep()"
          >
            {{ isLast ? t('prototypeGuide.finish') : t('prototypeGuide.next') }}
          </RcButton>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
// The slide-in panel renders at z-index 102, above the modal layers, and a step can point inside it
$guide-layer: 1000;

.guide-blocker {
  position: fixed;
  inset: 0;
  z-index: $guide-layer;

  &.dimmed {
    background: rgba(0, 0, 0, 0.55);
  }
}

.guide-spotlight {
  position: fixed;
  z-index: $guide-layer;
  border-radius: var(--border-radius);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  outline: 2px solid var(--primary);
  pointer-events: none;
  transition: top 0.2s, left 0.2s, width 0.2s, height 0.2s;
}

.guide-card {
  position: fixed;
  z-index: $guide-layer + 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background: var(--body-bg);
  color: var(--body-text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: top 0.2s, left 0.2s;

  &:focus {
    outline: none;
  }

  h3, p {
    margin: 0;
  }
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.guide-note {
  padding: 8px 12px;
  border-left: 3px solid var(--border);
  background: var(--box-bg);

  &.design {
    border-left-color: var(--primary);
  }

  &.backend {
    border-left-color: var(--warning);
  }

  p {
    font-size: 13px;
  }
}

.guide-label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.guide-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
