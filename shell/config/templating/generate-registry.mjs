// Generate the explicit-import block for component-registry.js's SHELL_MODULES.
//
//   node shell/config/templating/generate-registry.mjs
//
// WHY THIS EXISTS
// A runtime custom view (see README) can import @shell modules. We cannot expose @shell with
// a `require.context` wildcard: bundling an app-core subtree (utils/models/edit/…) into the
// code-view async chunk creates a circular-dependency init order that TDZ-crashes every code
// view at load ("Cannot access '<var>' before initialization"). EXPLICIT single-module imports
// are safe (webpack resolves each individually and places shared deps in the main chunk, just
// like the app does) — but only for modules that are NOT themselves part of an import cycle.
//
// So this script SCC-scans the @shell import graph and emits an `import * as …` + a
// SHELL_MODULES entry for every ACYCLIC module across the exposed dirs. Modules that ARE in a
// cycle are skipped automatically, so the list can't regress into a crash as @shell evolves.
//
// USAGE: run it, then paste the two sections it prints over the corresponding blocks in
// component-registry.js (the `import * as S_…` list, and the SHELL_MODULES array body).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Repo's shell/ dir (this file lives in shell/config/templating/).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Dirs whose acyclic modules are exposed to custom views. Deliberately EXCLUDES app-core /
// browser-hostile trees: config (contains the registry itself), store, plugins, initialize,
// server (node built-ins), apis/core/types (type/plumbing).
const DIRS = [
  'utils', 'mixins', 'models', 'edit', 'detail', 'list', 'dialog',
  'chart', 'composables', 'directives', 'cloud-credential', 'machine-config', 'promptRemove',
  'pages',
];
const EXTS = ['.ts', '.js', '.vue', '/index.ts', '/index.js', '/index.vue'];
const skip = (n) => /\.(test|spec)\.|\.d\.ts$/.test(n) || n.includes('__mocks__') || n.includes('__tests__') || n.includes('unit-tests');

function resolveSpec(fromFile, spec) {
  let base;
  if (spec.startsWith('@shell/')) base = path.join(ROOT, spec.slice('@shell/'.length));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // bare npm package — not part of the @shell graph
  for (const e of EXTS) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

const IMPORT_RE = /(?:import|export)\s[^;]*?\sfrom\s*['"]([^'"]+)['"]/g;
const graph = new Map();
const seen = new Set();

function scan(file) {
  if (seen.has(file)) return;
  seen.add(file);
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { return; }
  const deps = new Set();
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const r = resolveSpec(file, m[1]);
    if (r && r.includes(`${ path.sep }shell${ path.sep }`)) deps.add(r);
  }
  graph.set(file, deps);
  for (const d of deps) scan(d);
}

const seeds = [];
for (const d of DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  const walk = (p) => fs.readdirSync(p).forEach((n) => {
    const full = path.join(p, n);
    if (fs.statSync(full).isDirectory()) {
      if (!skip(`${ n }/`)) walk(full);
    } else if (/\.(ts|js|vue)$/.test(n) && !skip(n)) {
      seeds.push(full);
      scan(full);
    }
  });
  walk(dir);
}

// Tarjan strongly-connected components → any module in an SCC of size > 1 is "cyclic".
let idx = 0;
const stack = [];
const onStack = new Set();
const index = new Map();
const low = new Map();
const cyclic = new Set();
function strongconnect(v) {
  index.set(v, idx); low.set(v, idx); idx++; stack.push(v); onStack.add(v);
  for (const w of (graph.get(v) || [])) {
    if (!index.has(w)) {
      if (graph.has(w)) { strongconnect(w); low.set(v, Math.min(low.get(v), low.get(w))); }
    } else if (onStack.has(w)) {
      low.set(v, Math.min(low.get(v), index.get(w)));
    }
  }
  if (low.get(v) === index.get(v)) {
    const comp = [];
    let w;
    do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
    if (comp.length > 1) comp.forEach((x) => cyclic.add(x));
  }
}
for (const v of graph.keys()) if (!index.has(v)) strongconnect(v);

const importPath = (f) => `@shell/${ path.relative(ROOT, f).replace(/\.(ts|js|vue)$/, '').replace(/\/index$/, '') }`;
const identBase = (p) => `S_${ p.replace('@shell/', '').replace(/[^a-zA-Z0-9]/g, '_') }`;

const acyclic = seeds.filter((f) => !cyclic.has(f)).sort();
const seenPath = new Set();
const usedId = new Set();
const rows = [];
for (const f of acyclic) {
  const p = importPath(f);
  if (seenPath.has(p)) continue;
  seenPath.add(p);
  let id = identBase(p);
  let k = 2;
  while (usedId.has(id)) id = `${ identBase(p) }_${ k++ }`;
  usedId.add(id);
  rows.push({ p, id });
}

const excluded = [...seeds.filter((f) => cyclic.has(f))].map(importPath).sort();
console.error(`// ${ rows.length } acyclic modules exposed; ${ excluded.length } skipped (in cycles):`);
console.error(`// ${ excluded.join(', ') }`);

console.log('// ===== IMPORTS (paste over the `import * as S_…` block) =====');
rows.forEach((r) => console.log(`import * as ${ r.id } from '${ r.p }';`));
console.log('\n// ===== ENTRIES (paste inside `const SHELL_MODULES = [ … ];`) =====');
rows.forEach((r) => console.log(`  ['${ r.p }', ${ r.id }],`));
