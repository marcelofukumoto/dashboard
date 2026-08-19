// Monaco migration: the previous CodeMirror 5 dynamic loader is no longer used.
// A no-op resolver is kept for backwards-compat with any caller that still
// references window.__codeMirrorLoader.

if ( !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = () => Promise.resolve();
}
