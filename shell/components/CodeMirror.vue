<script>
import { monaco, setupMonacoYaml, nextModelUri } from '@shell/utils/monaco';
import { _EDIT, _VIEW } from '@shell/config/query-params';

/**
 * Monaco migration (spike): this adapter replaces the CodeMirror 5 wrapper
 * (`codemirror-editor-vue3`) with the Monaco editor + monaco-yaml. It preserves the
 * public props/events/methods contract so consumers (YamlEditor.vue, etc.) need no
 * changes. CM5-only options (extraKeys with cm.* callbacks, gutters, cursorBlinkRate,
 * custom foldYaml) are ignored. The headline gain is schema-aware editing: autocomplete,
 * hover docs and type validation for Kubernetes YAML (see @shell/utils/monaco).
 * TODO(monaco): vim/emacs keymaps, per-CRD schema resolution, markdown line-break markers.
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
      isCodeMirrorFocused: false,
      hasLintErrors:       false,
    };
  },

  computed: {
    isDisabled() {
      return this.mode === _VIEW;
    },
  },

  watch: {
    value(neu) {
      if (this.editor && (neu ?? '') !== this.editor.getValue()) {
        this.editor.setValue(neu ?? '');
      }
    },

    isDisabled(neu) {
      this.editor?.updateOptions({ readOnly: neu });
    },

    hasLintErrors(neu) {
      this.$emit('validationChanged', !neu);
    },
  },

  mounted() {
    setupMonacoYaml();

    const theme = this.$store.getters['prefs/theme'];
    const opts = this.options || {};

    this.model = monaco.editor.createModel(this.value ?? '', 'yaml', nextModelUri());

    this.editor = monaco.editor.create(this.$refs.editorEl, {
      model:                this.model,
      theme:                theme === 'dark' ? 'vs-dark' : 'vs',
      readOnly:             this.isDisabled || !!opts.readOnly,
      automaticLayout:      true,
      minimap:              { enabled: false },
      scrollBeyondLastLine: false,
      tabSize:              opts.tabSize ?? 2,
      insertSpaces:         true,
      lineNumbers:          (this.asTextArea || opts.lineNumbers === false) ? 'off' : 'on',
      folding:              !this.asTextArea,
      wordWrap:             'on',
      fontSize:             13,
      fontFamily:           'monospace, "Courier New"',
      renderLineHighlight:  this.asTextArea ? 'none' : 'line',
      overviewRulerLanes:   0,
      fixedOverflowWidgets: true,
      padding:              { top: 6, bottom: 6 },
      scrollbar:            { alwaysConsumeMouseWheel: false },
      ariaLabel:            opts.screenReaderLabel || 'Code editor',
    });

    this.editor.onDidChangeModelContent(() => {
      const val = this.editor.getValue();

      if (val === (this.value ?? '')) {
        return; // ignore echoes from a parent-pushed value
      }
      this.$emit('onInput', val);
      this.$emit('onChanges', this.editor, val);
    });

    this.editor.onDidFocusEditorText(() => this.onFocus());
    this.editor.onDidBlurEditorText(() => this.onBlur());

    // monaco-yaml publishes diagnostics as model markers; wire them into dashboard validation.
    this.markerDisposable = monaco.editor.onDidChangeMarkers((uris) => {
      const myUri = this.model?.uri?.toString();

      if (!myUri || !uris.some((u) => u.toString() === myUri)) {
        return;
      }

      const markers = monaco.editor.getModelMarkers({ resource: this.model.uri });

      this.hasLintErrors = markers.some((m) => m.severity === monaco.MarkerSeverity.Error);
    });

    this.$emit('validationChanged', true);
    this.$emit('onReady', this.editor);
  },

  beforeUnmount() {
    this.markerDisposable?.dispose();
    this.editor?.dispose();
    this.model?.dispose();
  },

  methods: {
    focus() {
      this.editor?.focus();
    },

    // Monaco lays out via automaticLayout; kept so consumers calling refresh() still work.
    refresh() {
      this.editor?.layout();
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
      if (this.editor && (value ?? '') !== this.editor.getValue()) {
        this.editor.setValue(value ?? '');
      }
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
      ref="editorEl"
      class="monaco-editor-el"
      data-testid="code-mirror-el"
    />
  </div>
</template>

<style lang="scss">
  .code-mirror {
    position: relative;
    margin-bottom: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;

    .monaco-editor-el {
      flex: 1;
      width: 100%;
      min-height: 300px;
    }

    &.as-text-area {
      margin-bottom: 0;

      .monaco-editor-el {
        min-height: 40px;
      }
    }

    // Let the dashboard background show through Monaco's editor surface.
    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background {
      background-color: transparent;
    }
  }
</style>
