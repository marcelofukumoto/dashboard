<script>
import {
  EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap, drawSelection
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
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
 * CM6 migration (spike, DIRECT): this adapter drives CodeMirror 6 imperatively via
 * @codemirror/* — no third-party Vue wrapper (dropped `vue-codemirror`). The editor
 * is a framework-agnostic EditorView, mounted in mounted()/destroyed in beforeUnmount(),
 * exactly like the Monaco spike. It preserves the public props/events/methods contract
 * so consumers (YamlEditor.vue, etc.) need no changes. CM5-only options (extraKeys with
 * cm.* callbacks, gutters, cursorBlinkRate, custom foldYaml) are ignored.
 * TODO(cm6): vim/emacs keymaps, foldYaml outline, markdown line-break markers.
 */
export default {
  name: 'CodeMirror',

  emits: ['onReady', 'onInput', 'onChanges', 'onFocus', 'validationChanged'],

  props: {
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
      loaded:              true,
      removeKeyMapBox:     false,
      isCodeMirrorFocused: false,
      hasLintErrors:       false,
    };
  },

  computed: {
    isDisabled() {
      return this.mode === _VIEW;
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
  },

  watch: {
    value(neu) {
      const cur = this.view?.state.doc.toString();

      if (this.view && (neu ?? '') !== cur) {
        this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: neu ?? '' } });
      }
    },

    isDisabled(neu) {
      this.view?.dispatch({ effects: this.readOnlyComp.reconfigure(this.readOnlyExt(neu)) });
    },

    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },
  },

  mounted() {
    const theme = this.$store.getters['prefs/theme'];
    const opts = this.options || {};

    this.readOnlyComp = new Compartment();

    const extensions = [
      yaml(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
      EditorView.contentAttributes.of({ 'aria-label': opts.screenReaderLabel || 'Code editor' }),
      EditorView.domEventHandlers({
        focus: () => this.onFocus(),
        blur:  () => this.onBlur(),
      }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) {
          return;
        }

        const val = update.state.doc.toString();

        if (val === (this.value ?? '')) {
          return; // ignore echoes from a parent-pushed value
        }
        this.$emit('onInput', val);
        this.$emit('onChanges', this.view, val);
      }),
      this.readOnlyComp.of(this.readOnlyExt(this.isDisabled || opts.readOnly)),
      theme === 'dark' ? oneDark : [],
    ];

    if (!this.asTextArea && opts.lineNumbers !== false) {
      extensions.push(lineNumbers(), highlightActiveLineGutter());
    }

    if (!this.asTextArea && opts.foldGutter !== false) {
      extensions.push(codeFolding(), foldGutter());
    }

    if (opts.styleActiveLine) {
      extensions.push(highlightActiveLine());
    }

    if (opts.lint) {
      extensions.push(lintGutter(), linter((view) => this.runLint(view)));
    }

    this.view = new EditorView({
      parent: this.$refs.editorEl,
      doc:    this.value ?? '',
      extensions,
    });

    this.$refs.codeMirrorContainer.addEventListener('keydown', this.handleKeyPress);

    this.$emit('validationChanged', true);
    this.$emit('onReady', this.view);
  },

  beforeUnmount() {
    this.$refs.codeMirrorContainer?.removeEventListener('keydown', this.handleKeyPress);
    this.view?.destroy();
  },

  methods: {
    readOnlyExt(on) {
      return on ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : [];
    },

    handleKeyPress(ev) {
      // allow pressing escape in the editor, useful for modal editing with vim
      if (this.isCodeMirrorFocused && ev.code === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
      }
    },

    /**
     * YAML linting uses js-yaml parse; all yaml lint messages are treated as errors.
     * Only 'error' level linting triggers a validation event from this component.
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

      this.hasLintErrors = diagnostics.some((d) => !d.severity || d.severity === 'error');

      return diagnostics;
    },

    focus() {
      this.view?.focus();
    },

    // CM6 measures automatically; kept so consumers calling refresh() still work.
    refresh() {
      this.view?.requestMeasure();
    },

    onFocus() {
      this.isCodeMirrorFocused = true;
      this.$emit('onFocus', true);
    },

    onBlur() {
      this.isCodeMirrorFocused = false;
      this.$emit('onFocus', false);
    },

    updateValue(value) {
      const cur = this.view?.state.doc.toString();

      if (this.view && (value ?? '') !== cur) {
        this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: value ?? '' } });
      }
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
    class="code-mirror code-mirror-container codemirror-container"
    :class="{['as-text-area']: asTextArea}"
  >
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
    <div
      ref="editorEl"
      class="cm-host"
      data-testid="code-mirror-el"
    />
    <span
      v-show="isCodeMirrorFocused"
      class="escape-text"
      role="alert"
      :aria-describedby="t('wm.containerShell.escapeText')"
    >{{ t('codeMirror.escapeText') }}</span>
  </div>
</template>

<style lang="scss">
  $code-mirror-animation-time: 0.1s;

  .code-mirror {
    position: relative;
    margin-bottom: 20px;

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

    &.as-text-area {
      margin-bottom: 0;

      .cm-host .cm-editor {
        min-height: 40px;
        padding: 6px 0;
        background-color: var(--input-bg);
        border-radius: var(--border-radius);
        border: solid var(--border-width) var(--input-border);
        color: var(--input-text);
      }
    }

    .escape-text {
      font-size: 12px;
      position: absolute;
      bottom: -20px;
      left: 0;
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
          border-radius: var(--border-radius);

          .close-indicator {
            margin-left: -6px;
            width: auto;

            .icon-close {
              opacity: 1;
              transition: opacity $code-mirror-animation-time ease-in-out $code-mirror-animation-time;
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
