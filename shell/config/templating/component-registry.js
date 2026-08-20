// Lazy registry of components for runtime-compiled custom-view SFCs.
//
// @shell/components: exposed via require.context (sync) — mapped by ctx.keys() (lists only)
// and executed on demand when the SFC imports one. Eager execution disrupts the app.
//
// @components (rancher-components): exposed via EXPLICIT imports of every component. We do
// NOT require.context this package — doing so pulls the whole package (including its barrels)
// into a context that creates a circular dependency at chunk-init, crashing the registry
// before it resolves anything ("Cannot read properties of undefined (reading 'hasComponent')"
// / "Cannot access '<var>' before initialization"). Explicit single-module imports sidestep
// the cycle. Keep this list in sync with @components as it grows.
//
// DO NOT re-attempt the require.context('@components') wildcard: it was tried a second time
// AFTER this file was moved to its own async chunk (below) and STILL crashed with
// "Cannot access '<minified>' before initialization" on the deployed build. The async-chunk
// isolation is necessary but NOT sufficient; the package barrels are the problem.
//
// This file is loaded via a dynamic import from TemplateCode (its own async chunk); a
// static import would pull require.context into the page's sync init and cause circulars.
//
// Supported import forms (match real component code so pages can be copied verbatim):
//   import RcButton from 'RcButton'                          (bare name)
//   import Labels from '@shell/components/form/Labels'       (@shell full path)
//   import Banner, { Banner } from '@components/Banner'      (@components dir, default+named)
//   import { RcDropdown, RcDropdownItem } from '@components/RcDropdown'  (multiple named)

import Accordion from '@components/Accordion/Accordion.vue';
import BadgeState from '@components/BadgeState/BadgeState.vue';
import Banner from '@components/Banner/Banner.vue';
import Card from '@components/Card/Card.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import ToggleSwitch from '@components/Form/ToggleSwitch/ToggleSwitch.vue';
import LabeledTooltip from '@components/LabeledTooltip/LabeledTooltip.vue';
import RcCounterBadge from '@components/Pill/RcCounterBadge/RcCounterBadge.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcButtonSplit from '@components/RcButtonSplit/RcButtonSplit.vue';
import RcDropdown from '@components/RcDropdown/RcDropdown.vue';
import RcDropdownItem from '@components/RcDropdown/RcDropdownItem.vue';
import RcDropdownItemCheckbox from '@components/RcDropdown/RcDropdownItemCheckbox.vue';
import RcDropdownItemSelect from '@components/RcDropdown/RcDropdownItemSelect.vue';
import RcDropdownMenu from '@components/RcDropdown/RcDropdownMenu.vue';
import RcDropdownSeparator from '@components/RcDropdown/RcDropdownSeparator.vue';
import RcDropdownTrigger from '@components/RcDropdown/RcDropdownTrigger.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import RcItemCard from '@components/RcItemCard/RcItemCard.vue';
import RcItemCardAction from '@components/RcItemCard/RcItemCardAction.vue';
import RcSection from '@components/RcSection/RcSection.vue';
import RcSectionActions from '@components/RcSection/RcSectionActions.vue';
import RcSectionBadges from '@components/RcSection/RcSectionBadges.vue';
import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import StringList from '@components/StringList/StringList.vue';

// @shell UTILITY MODULES — EXPLICIT imports, added in BATCHES. A require.context over the
// whole @shell/utils subtree crashes at chunk-init (circular deps); explicit single-module
// imports are safe (webpack resolves each individually, like the @components list above).
// Each is a namespace import so `import { fn } from '@shell/utils/x'` resolves its named
// exports. Add a batch, build + deploy to confirm it stays cycle-free, then add the next.
// --- Batch 1 (acyclic utils only) ---
// NOTE: @shell/utils/array <-> @shell/utils/object form an import CYCLE (found via SCC
// analysis), so they are intentionally OMITTED here to avoid a chunk-init TDZ; expose them
// later with care if needed. These five have no cycles in the @shell import graph.
import * as UtilString from '@shell/utils/string';
import * as UtilSort from '@shell/utils/sort';
import * as UtilPromise from '@shell/utils/promise';
import * as UtilUnits from '@shell/utils/units';
import * as UtilDuration from '@shell/utils/duration';

const ctx = require.context('@shell/components', true, /^(?:(?!__tests__).)*\.vue$/);

// [import path, namespace module] for every explicitly-exposed @shell util. Registered by
// full path only (utils are imported by path + named export, never a bare name).
const SHELL_MODULES = [
  ['@shell/utils/string', UtilString],
  ['@shell/utils/sort', UtilSort],
  ['@shell/utils/promise', UtilPromise],
  ['@shell/utils/units', UtilUnits],
  ['@shell/utils/duration', UtilDuration],
];

// [name, source path, component] for every @components export. The path is the real
// .vue location; the DIRECTORY of that path is the package import path used in real code
// (e.g. '@components/Banner', '@components/Form/LabeledInput').
const RANCHER_COMPONENTS = [
  ['Accordion', '@components/Accordion/Accordion.vue', Accordion],
  ['BadgeState', '@components/BadgeState/BadgeState.vue', BadgeState],
  ['Banner', '@components/Banner/Banner.vue', Banner],
  ['Card', '@components/Card/Card.vue', Card],
  ['Checkbox', '@components/Form/Checkbox/Checkbox.vue', Checkbox],
  ['LabeledInput', '@components/Form/LabeledInput/LabeledInput.vue', LabeledInput],
  ['RadioButton', '@components/Form/Radio/RadioButton.vue', RadioButton],
  ['RadioGroup', '@components/Form/Radio/RadioGroup.vue', RadioGroup],
  ['TextAreaAutoGrow', '@components/Form/TextArea/TextAreaAutoGrow.vue', TextAreaAutoGrow],
  ['ToggleSwitch', '@components/Form/ToggleSwitch/ToggleSwitch.vue', ToggleSwitch],
  ['LabeledTooltip', '@components/LabeledTooltip/LabeledTooltip.vue', LabeledTooltip],
  ['RcCounterBadge', '@components/Pill/RcCounterBadge/RcCounterBadge.vue', RcCounterBadge],
  ['RcStatusBadge', '@components/Pill/RcStatusBadge/RcStatusBadge.vue', RcStatusBadge],
  ['RcStatusIndicator', '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue', RcStatusIndicator],
  ['RcTag', '@components/Pill/RcTag/RcTag.vue', RcTag],
  ['RcButton', '@components/RcButton/RcButton.vue', RcButton],
  ['RcButtonSplit', '@components/RcButtonSplit/RcButtonSplit.vue', RcButtonSplit],
  ['RcDropdown', '@components/RcDropdown/RcDropdown.vue', RcDropdown],
  ['RcDropdownItem', '@components/RcDropdown/RcDropdownItem.vue', RcDropdownItem],
  ['RcDropdownItemCheckbox', '@components/RcDropdown/RcDropdownItemCheckbox.vue', RcDropdownItemCheckbox],
  ['RcDropdownItemSelect', '@components/RcDropdown/RcDropdownItemSelect.vue', RcDropdownItemSelect],
  ['RcDropdownMenu', '@components/RcDropdown/RcDropdownMenu.vue', RcDropdownMenu],
  ['RcDropdownSeparator', '@components/RcDropdown/RcDropdownSeparator.vue', RcDropdownSeparator],
  ['RcDropdownTrigger', '@components/RcDropdown/RcDropdownTrigger.vue', RcDropdownTrigger],
  ['RcIcon', '@components/RcIcon/RcIcon.vue', RcIcon],
  ['RcItemCard', '@components/RcItemCard/RcItemCard.vue', RcItemCard],
  ['RcItemCardAction', '@components/RcItemCard/RcItemCardAction.vue', RcItemCardAction],
  ['RcSection', '@components/RcSection/RcSection.vue', RcSection],
  ['RcSectionActions', '@components/RcSection/RcSectionActions.vue', RcSectionActions],
  ['RcSectionBadges', '@components/RcSection/RcSectionBadges.vue', RcSectionBadges],
  ['RcSeparator', '@components/RcSeparator/RcSeparator.vue', RcSeparator],
  ['StringList', '@components/StringList/StringList.vue', StringList],
];

// Register each @components component so it resolves the same way real code imports it:
//   - bare name:      'Banner'
//   - full .vue path: '@components/Banner/Banner.vue'  (and without extension)
//   - package dir:    '@components/Banner'             (named + default export)
// Each entry is an ES-module namespace ({ __esModule, default, [Name] }) so BOTH
//   import Banner from '@components/Banner'   and   import { Banner } from '@components/Banner'
// work. __esModule makes the loader's default-interop unwrap .default (else a default
// import would be the namespace object and Vue warns "missing render").
const EXTRA = {};
const dirExports = {};

RANCHER_COMPONENTS.forEach(([name, filePath, comp]) => {
  const single = {
    __esModule: true, default: comp, [name]: comp
  };
  const dir = filePath.replace(/\/[^/]+\.vue$/, '');

  EXTRA[name] = single;
  EXTRA[filePath] = single;
  EXTRA[filePath.replace(/\.vue$/, '')] = single;

  // Accumulate named exports per package dir (a dir may hold several components).
  dirExports[dir] = dirExports[dir] || {};
  dirExports[dir][name] = comp;
});

Object.entries(dirExports).forEach(([dir, comps]) => {
  const dirName = dir.split('/').pop();

  EXTRA[dir] = {
    __esModule: true, ...comps, default: comps[dirName] || Object.values(comps)[0]
  };
});

// Register each explicitly-exposed @shell util under its real import path, as an ES-module
// namespace so `import { fn } from '@shell/utils/x'` resolves the named export.
SHELL_MODULES.forEach(([path, mod]) => {
  EXTRA[path] = { __esModule: true, ...mod };
});

let keyMap = null;

// Build import-id -> context key WITHOUT executing any module.
function buildKeyMap() {
  if (keyMap) {
    return keyMap;
  }

  keyMap = {};

  ctx.keys().forEach((key) => {
    const rel = key.replace(/^\.\//, '');
    const parts = rel.replace(/\.vue$/, '').split('/');
    // For Foo/index.vue the component name/import id is the DIRECTORY (Foo), not "index".
    const isIndex = parts[parts.length - 1] === 'index' && parts.length > 1;
    const name = isIndex ? parts[parts.length - 2] : parts[parts.length - 1];
    const path = `@shell/components/${ rel }`;

    if (!(name in keyMap)) {
      keyMap[name] = key;
    }
    keyMap[path] = key;
    keyMap[path.replace(/\.vue$/, '')] = key;

    // Foo/index.vue is normally imported as '@shell/components/Foo' — add that key too.
    if (isIndex) {
      keyMap[`@shell/components/${ parts.slice(0, -1).join('/') }`] = key;
    }
  });

  return keyMap;
}

export function hasComponent(id) {
  return typeof id === 'string' && (id in EXTRA || id in buildKeyMap());
}

// Returns the requested module namespace (with .default), executing only that one module.
export function resolveComponent(id) {
  if (id in EXTRA) {
    return EXTRA[id];
  }

  const key = id in buildKeyMap() ? buildKeyMap()[id] : null;

  return key ? ctx(key) : undefined;
}
