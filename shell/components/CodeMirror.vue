<script>
import { Codemirror } from 'vue-codemirror';
import { EditorState } from '@codemirror/state';
import {
  EditorView, lineNumbers, highlightActiveLine, keymap, drawSelection, highlightActiveLineGutter
} from '@codemirror/view';
import {
  defaultKeymap, history, historyKeymap, indentWithTab
} from '@codemirror/commands';
import {
  foldGutter, codeFolding, foldKeymap, indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle
} from '@codemirror/language';
import { yaml } from '@codemirror/lang-yaml';
import { linter, lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import jsyaml from 'js-yaml';
import { KEYMAP } from '@shell/store/prefs';
import { _EDIT, _VIEW } from '@shell/config/query-params';

/**
 * CM6 migration NOTE (spike): this adapter replaces the CodeMirror 5 wrapper
 * (`codemirror-editor-vue3`) with `vue-codemirror` (CodeMirror 6). It preserves
 * the public props/events/methods contract so consumers (YamlEditor.vue, etc.)
 * need no changes. CM5-only options passed by parents — `extraKeys` with `cm.*`
 * callbacks, `gutters` (CM5 gutter names), `cursorBlinkRate`, custom `foldYaml` —
 * are intentionally ignored; CM6 handles indentation/folding/lint natively.
 * TODO(cm6): vim/emacs keymaps, markdown line-break markers, styleSelectedText.
 */
export default {
  name: 'CodeMirror',

  components: { Codemirror },

  emits: ['onReady', 'onInput', 'onChanges', 'onFocus', 'validationChanged'],

  props: {
    /**
     * Sets the edit mode for Text Area.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:     String,
      required: true,
    },
    options: {
      type:    Object,
      default: () => {}
    },
    asTextArea: {
      type:    Boolean,
      default: false
    },
    showKeyMapBox: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      view:                null,
      loaded:              true, // CM6 extensions load synchronously; no async loader needed
      removeKeyMapBox:     false,
      hasLintErrors:       false,
      currFocusedElem:        undefined,
      isCodeMirrorFocused:    false,
      codeMirrorContainerRef: undefined
    };
  },

  computed: {
    isDisabled() {
      return this.mode === _VIEW;
    },

    // CM5 options object is translated to CM6 extensions here.
    extensions() {
      const theme = this.$store.getters['prefs/theme'];
      const opts = this.options || {};

      const ext = [
        yaml(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        EditorView.lineWrapping,
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
        EditorView.contentAttributes.of({ 'aria-label': opts.screenReaderLabel || 'Code editor' }),
        // vue-codemirror does not emit focus/blur, so track them via CM6 DOM handlers.
        EditorView.domEventHandlers({
          focus: () => this.onFocus(),
          blur:  () => this.onBlur(),
        }),
      ];

      const wantsLineNumbers = opts.lineNumbers !== false && !this.asTextArea;

      if (wantsLineNumbers) {
        ext.push(lineNumbers());
        ext.push(highlightActiveLineGutter());
      }

      if (!this.asTextArea && opts.foldGutter !== false) {
        ext.push(codeFolding());
        ext.push(foldGutter());
      }

      if (opts.styleActiveLine) {
        ext.push(highlightActiveLine());
      }

      // parent components enable lint with a boolean; wire the diagnostics into
      // dashboard validation via handleLintErrors (see validationChanged emit).
      if (opts.lint) {
        ext.push(lintGutter());
        ext.push(linter((view) => this.runLint(view)));
      }

      if (this.isDisabled || opts.readOnly) {
        ext.push(EditorState.readOnly.of(true));
        ext.push(EditorView.editable.of(false));
      }

      if (theme === 'dark') {
        ext.push(oneDark);
      }

      return ext;
    },

    tabSize() {
      return this.asTextArea ? 0 : (this.options?.tabSize ?? 2);
    },

    keyMapTooltip() {
      const keymapPref = this.$store.getters['prefs/get'](KEYMAP);

      if (keymapPref) {
        const name = this.t(`prefs.keymap.${ keymapPref }`);

        return this.t('codeMirror.keymap.indicatorToolip', { name });
      }

      return null;
    },

    isNonDefaultKeyMap() {
      return this.$store.getters['prefs/get'](KEYMAP) !== 'sublime';
    },

    isCodeMirrorContainerFocused() {
      return this.currFocusedElem === this.codeMirrorContainerRef;
    },

    codeMirrorContainerTabIndex() {
      return this.isCodeMirrorFocused ? 0 : -1;
    }
  },

  mounted() {
    const el = this.$refs.codeMirrorContainer;

    el.addEventListener('keydown', this.handleKeyPress);
    this.codeMirrorContainerRef = this.$refs.codeMirrorContainer;
  },

  beforeUnmount() {
    const el = this.$refs.codeMirrorContainer;

    el.removeEventListener('keydown', this.handleKeyPress);
  },

  watch: {
    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },
  },

  methods: {
    focusChanged(ev, isBlurred = false) {
      if (isBlurred) {
        this.currFocusedElem = undefined;
      } else {
        this.currFocusedElem = ev.target;
      }
    },

    handleKeyPress(ev) {
      // allows pressing escape in the editor, useful for modal editing with vim
      if (this.isCodeMirrorFocused && ev.code === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
      }

      // make focus leave the editor for it's parent container so that we can tab
      const didPressEscapeSequence = ev.shiftKey && ev.code === 'Escape';

      if (this.isCodeMirrorFocused && didPressEscapeSequence) {
        this.$refs?.codeMirrorContainer?.focus();
      }

      // if parent container is focused and we press a trigger, focus goes to the editor inside
      if (this.isCodeMirrorContainerFocused && (ev.code === 'Enter' || ev.code === 'Space')) {
        this.view?.focus();
      }
    },

    /**
     * YAML linting uses js-yaml parse. It does not distinguish between warnings
     * and errors so we treat all yaml lint messages as errors. Only 'error' level
     * linting triggers a validation event from this component.
     */
    runLint(view) {
      const text = view.state.doc.toString();
      const diagnostics = [];

      try {
        jsyaml.load(text);
      } catch (ex) {
        const docLen = view.state.doc.length;
        const from = Math.min(ex?.mark?.position ?? 0, docLen);
        const to = Math.min(from + 1, docLen);

        diagnostics.push({
          from, to, severity: 'error', message: ex.message || 'Invalid YAML'
        });
      }

      this.handleLintErrors(diagnostics);

      return diagnostics;
    },

    handleLintErrors(diagnostics = []) {
      this.hasLintErrors = diagnostics.filter((d) => !d.severity || d.severity === 'error').length > 0;
    },

    focus() {
      this.view?.focus();
    },

    // CM6 measures automatically; kept as a no-op so consumers calling refresh() still work.
    refresh() {
      this.view?.requestMeasure();
    },

    onReady(payload) {
      this.view = payload.view;
      this.$emit('validationChanged', true);
      this.$emit('onReady', payload.view);
    },

    onChange(newCode) {
      this.$emit('onInput', newCode);
      this.$emit('onChanges', this.view, newCode);
    },

    onFocus() {
      this.isCodeMirrorFocused = true;
      this.$emit('onFocus', this.isCodeMirrorFocused);
    },

    onBlur() {
      this.isCodeMirrorFocused = false;
      this.$emit('onFocus', false);
    },

    updateValue(value) {
      const view = this.view;

      if (!view || value === view.state.doc.toString()) {
        return;
      }

      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    },

    closeKeyMapInfo() {
      this.removeKeyMapBox = true;
    },
  }
};
</script>

<template>
  <div
    ref="codeMirrorContainer"
    :tabindex="codeMirrorContainerTabIndex"
    class="code-mirror code-mirror-container"
    :class="{['as-text-area']: asTextArea}"
    @focusin="focusChanged"
    @blur="focusChanged($event, true)"
  >
    <div v-if="loaded">
      <div
        v-if="showKeyMapBox && !removeKeyMapBox && keyMapTooltip && isNonDefaultKeyMap"
        class="keymap overlay"
      >
        <div
          v-clean-tooltip="keyMapTooltip"
          class="keymap-indicator"
          data-testid="code-mirror-keymap"
          @click="closeKeyMapInfo"
        >
          <i class="icon icon-keyboard keymap-icon" />
          <div class="close-indicator">
            <i class="icon icon-close icon-sm" />
          </div>
        </div>
      </div>
      <Codemirror
        id="code-mirror-el"
        ref="codeMirrorRef"
        class="codemirror-container"
        :model-value="value"
        :extensions="extensions"
        :disabled="isDisabled"
        :indent-with-tab="!asTextArea"
        :tab-size="tabSize"
        :autofocus="false"
        @ready="onReady"
        @change="onChange"
      />
      <span
        v-show="isCodeMirrorFocused"
        class="escape-text"
        role="alert"
        :aria-describedby="t('wm.containerShell.escapeText')"
      >{{ t('codeMirror.escapeText') }}</span>
    </div>
    <div v-else>
      Loading...
    </div>
  </div>
</template>

<style lang="scss">
  $code-mirror-animation-time: 0.1s;

  .code-mirror {
    &.code-mirror-container:focus-visible {
      @include focus-outline;
    }

    // CM6 editor chrome — inherit dashboard colors/fonts so the theme vars show through.
    .cm-editor {
      background: none;
      font-size: inherit;

      .cm-gutters {
        background: inherit;
        border: none;
      }

      .cm-content {
        font-family: monospace;
      }

      &.cm-focused {
        outline: none;
      }
    }

    &.as-text-area .codemirror-container {
      min-height: 40px;
      position: relative;
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: 10px;
      background-color: var(--input-bg);
      border-radius: var(--border-radius);
      border: solid var(--border-width) var(--input-border);
      color: var(--input-text);

      &:hover {
        border-color: var(--input-hover-border);
      }

      &:focus, &.focus {
        outline: none;
        border-color: var(--primary-border);
      }

      .cm-editor {
        color: var(--input-text);
      }
    }
  }

  .code-mirror {
    position: relative;
    margin-bottom: 20px;

    .escape-text {
      font-size: 12px;
      position: absolute;
      bottom: -20px;
      left: 0;
    }

    .codemirror-container {
      z-index: 0;
      font-size: inherit !important;
    }

    .keymap.overlay {
      position: absolute;
      display: flex;
      top: 7px;
      right: 7px;
      z-index: 1;
      cursor: pointer;

      .keymap-indicator {
        width: 48px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        color: var(--darker);
        background-color: var(--subtle-overlay-bg);
        font-size: 12px;

        .close-indicator {
          width: 0;

          .icon-close {
            color: var(--primary);
            opacity: 0;
          }
        }

        .keymap-icon {
          font-size: 24px;
          opacity: 0.8;
          transition: margin-right $code-mirror-animation-time ease-in-out;
        }

        &:hover {
          border: 1px solid var(--primary);
          border-radius: var(--border-radius);;

          .close-indicator {
            margin-left: -6px;
            width: auto;

            .icon-close {
              opacity: 1;
              transition: opacity $code-mirror-animation-time ease-in-out $code-mirror-animation-time; // Only animate when being shown
            }
          }

          .keymap-icon {
            opacity: 0.6;
            margin-right: 10px;
          }
        }
      }
    }
  }
</style>
