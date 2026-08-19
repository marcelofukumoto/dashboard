/**
 * CM6 migration: this module previously registered CodeMirror 5 modes, themes,
 * keymaps, lint/fold addons and custom fold helpers (foldYaml, foldLinesMatching,
 * showMarkdownLineBreaks, styleSelectedText). CodeMirror 6 provides folding,
 * linting and language modes via composable extensions wired up directly in
 * components/CodeMirror.vue, so none of that CM5 setup is needed here.
 *
 * The file is intentionally emptied (not deleted) to avoid churn in anything that
 * may still reference the module path. It is no longer imported by the app.
 *
 * TODO(cm6): reimplement the custom "fold to path" (foldYaml) outline helper as a
 * CM6 foldService if the YAML outline feature is brought back.
 */
export default {};
