// Lazy registry of components for runtime-compiled custom-view SFCs.
//
// @shell: exposed via ONE require.context PER SAFE SUBTREE (sync) — mapped by ctx.keys()
// (lists only) and executed on demand when the SFC imports one. Eager execution disrupts
// the app. We do NOT require.context all of @shell in one shot: that drags in browser-hostile
// code (e.g. @shell/server imports node: built-ins) and @shell/config (which contains THIS
// file → self-cycle), and failed to build. Instead we opt IN a curated list of subtrees
// below. Adding a subtree is one line; if it breaks the build (node deps) or crashes at
// chunk-init (circular deps, like @components did), remove it.
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

// Regexes: components are .vue only; utils/models/mixins are code modules (.js/.ts), never
// .d.ts type declarations (they fail to compile as modules) and never __tests__.
const VUE_ONLY = /^(?:(?!__tests__).)*\.vue$/;
const CODE = /^(?:(?!__tests__|\.d\.ts).)*\.(vue|js|ts)$/;

// Curated, opt-in @shell subtrees. require.context needs a STRING LITERAL dir, so each is
// spelled out. Add a line to expose more; remove a line if it breaks the build or crashes.
// EXCLUDED on purpose: config (self-cycle), server (node built-ins), store/plugins/initialize
// (app bootstrap + side effects + heavy cycles), apis/core/types (type-only / api plumbing).
const SHELL_CONTEXTS = [
  ['@shell/components', require.context('@shell/components', true, VUE_ONLY)],
  ['@shell/utils', require.context('@shell/utils', true, CODE)],
  ['@shell/mixins', require.context('@shell/mixins', true, CODE)],
  // @shell/models is DROPPED: 85% of its files import @shell/config/store/plugins, and
  // bundling them all into this chunk crashed at init ("Cannot access '<var>' before
  // initialization") — a circular-dependency TDZ. Expose specific models explicitly if needed.
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

let keyMap = null;

// Build import-id -> { ctx, key } across every @shell subtree, WITHOUT executing any module.
function buildKeyMap() {
  if (keyMap) {
    return keyMap;
  }

  keyMap = {};

  SHELL_CONTEXTS.forEach(([base, ctx]) => {
    ctx.keys().forEach((key) => {
      const rel = key.replace(/^\.\//, '');
      const parts = rel.replace(/\.(vue|js|ts)$/, '').split('/');
      // For Foo/index.* the import id is the DIRECTORY (Foo), not "index".
      const isIndex = parts[parts.length - 1] === 'index' && parts.length > 1;
      const name = isIndex ? parts[parts.length - 2] : parts[parts.length - 1];
      const path = `${ base }/${ rel }`;
      const entry = { ctx, key };

      // Bare name: first-wins (components are listed first, so they win shared bare names);
      // full paths are always unambiguous.
      if (!(name in keyMap)) {
        keyMap[name] = entry;
      }
      keyMap[path] = entry;
      keyMap[path.replace(/\.(vue|js|ts)$/, '')] = entry;

      // Foo/index.* is normally imported as '<base>/<dir>/Foo' — add that key too.
      if (isIndex) {
        keyMap[`${ base }/${ parts.slice(0, -1).join('/') }`] = entry;
      }
    });
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

  const entry = buildKeyMap()[id];

  return entry ? entry.ctx(entry.key) : undefined;
}
