// CM6 migration: CodeMirror 6 extensions are imported directly in
// components/CodeMirror.vue, so the old CM5 dynamic-loader is no longer needed.
// A no-op resolver is kept for backwards-compat with any caller that still
// references window.__codeMirrorLoader.

if ( !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = () => Promise.resolve();
}
