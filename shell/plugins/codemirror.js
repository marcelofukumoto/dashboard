/**
 * Monaco migration: this module previously registered CodeMirror 5 modes, themes,
 * keymaps, lint/fold addons and custom fold helpers. The YAML editor is now backed
 * by the Monaco editor (see components/CodeMirror.vue), so none of that CM5 setup
 * is needed. Emptied (not deleted) to avoid churn in anything referencing the path.
 */
export default {};
