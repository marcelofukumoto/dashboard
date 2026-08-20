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

// @shell UTILITY + MIXIN MODULES — EXPLICIT imports, auto-generated from an SCC scan of
// the @shell import graph (see the require.context note above for why a wildcard cannot be
// used). Every module here is ACYCLIC (not part of an import cycle), so importing it
// explicitly is safe even if it transitively imports a cyclic cluster (webpack places those
// deps in the main bundle, as the app does). Modules that ARE in a cycle (utils/array<->
// object, router, validators, create-yaml, alertmanagerconfig, ...) are excluded.
import * as S_mixins_auth_config from '@shell/mixins/auth-config';
import * as S_mixins_back_link from '@shell/mixins/back-link';
import * as S_mixins_brand from '@shell/mixins/brand';
import * as S_mixins_browser_tab_visibility from '@shell/mixins/browser-tab-visibility';
import * as S_mixins_chart from '@shell/mixins/chart';
import * as S_mixins_child_hook from '@shell/mixins/child-hook';
import * as S_mixins_closeable from '@shell/mixins/closeable';
import * as S_mixins_compact_input from '@shell/mixins/compact-input';
import * as S_mixins_create_edit_view_impl from '@shell/mixins/create-edit-view/impl';
import * as S_mixins_create_edit_view from '@shell/mixins/create-edit-view';
import * as S_mixins_fetch_client from '@shell/mixins/fetch.client';
import * as S_mixins_form_validation from '@shell/mixins/form-validation';
import * as S_mixins_login from '@shell/mixins/login';
import * as S_mixins_metric_poller from '@shell/mixins/metric-poller';
import * as S_mixins_page_actions from '@shell/mixins/page-actions';
import * as S_mixins_preset from '@shell/mixins/preset';
import * as S_mixins_resource_fetch_api_pagination from '@shell/mixins/resource-fetch-api-pagination';
import * as S_mixins_resource_fetch_namespaced from '@shell/mixins/resource-fetch-namespaced';
import * as S_mixins_resource_fetch from '@shell/mixins/resource-fetch';
import * as S_mixins_resource_manager from '@shell/mixins/resource-manager';
import * as S_mixins_resource_table_watch from '@shell/mixins/resource-table-watch';
import * as S_mixins_vue_select_overrides from '@shell/mixins/vue-select-overrides';
import * as S_utils_async from '@shell/utils/async';
import * as S_utils_auth from '@shell/utils/auth';
import * as S_utils_autoscaler_utils from '@shell/utils/autoscaler-utils';
import * as S_utils_aws from '@shell/utils/aws';
import * as S_utils_axios from '@shell/utils/axios';
import * as S_utils_azure from '@shell/utils/azure';
import * as S_utils_back_off from '@shell/utils/back-off';
import * as S_utils_banners from '@shell/utils/banners';
import * as S_utils_brand from '@shell/utils/brand';
import * as S_utils_chart from '@shell/utils/chart';
import * as S_utils_clipboard from '@shell/utils/clipboard';
import * as S_utils_cluster from '@shell/utils/cluster';
import * as S_utils_color from '@shell/utils/color';
import * as S_utils_computed from '@shell/utils/computed';
import * as S_utils_config from '@shell/utils/config';
import * as S_utils_crypto_browserHashUtils from '@shell/utils/crypto/browserHashUtils';
import * as S_utils_crypto_browserMd5 from '@shell/utils/crypto/browserMd5';
import * as S_utils_crypto_browserSha1 from '@shell/utils/crypto/browserSha1';
import * as S_utils_crypto_browserSha256 from '@shell/utils/crypto/browserSha256';
import * as S_utils_crypto_encryption from '@shell/utils/crypto/encryption';
import * as S_utils_crypto from '@shell/utils/crypto';
import * as S_utils_cspAdaptor from '@shell/utils/cspAdaptor';
import * as S_utils_custom_validators from '@shell/utils/custom-validators';
import * as S_utils_dom from '@shell/utils/dom';
import * as S_utils_download from '@shell/utils/download';
import * as S_utils_duration from '@shell/utils/duration';
import * as S_utils_dynamic_content_config from '@shell/utils/dynamic-content/config';
import * as S_utils_dynamic_content_info from '@shell/utils/dynamic-content/info';
import * as S_utils_dynamic_content_new_release from '@shell/utils/dynamic-content/new-release';
import * as S_utils_dynamic_content_util from '@shell/utils/dynamic-content/util';
import * as S_utils_dynamic_importer from '@shell/utils/dynamic-importer';
import * as S_utils_error from '@shell/utils/error';
import * as S_utils_favicon from '@shell/utils/favicon';
import * as S_utils_fleet_appco from '@shell/utils/fleet-appco';
import * as S_utils_fleet_types from '@shell/utils/fleet-types';
import * as S_utils_fleet from '@shell/utils/fleet';
import * as S_utils_formatter from '@shell/utils/formatter';
import * as S_utils_fuzzy from '@shell/utils/fuzzy';
import * as S_utils_gatekeeper_util from '@shell/utils/gatekeeper/util';
import * as S_utils_gc_gc_interval from '@shell/utils/gc/gc-interval';
import * as S_utils_gc_gc_root_store from '@shell/utils/gc/gc-root-store';
import * as S_utils_gc_gc_route_changed from '@shell/utils/gc/gc-route-changed';
import * as S_utils_gc_gc_types from '@shell/utils/gc/gc-types';
import * as S_utils_gc_gc from '@shell/utils/gc/gc';
import * as S_utils_git from '@shell/utils/git';
import * as S_utils_grafana from '@shell/utils/grafana';
import * as S_utils_inactivity from '@shell/utils/inactivity';
import * as S_utils_ingress from '@shell/utils/ingress';
import * as S_utils_kontainer from '@shell/utils/kontainer';
import * as S_utils_kube from '@shell/utils/kube';
import * as S_utils_monitoring from '@shell/utils/monitoring';
import * as S_utils_namespace_filter from '@shell/utils/namespace-filter';
import * as S_utils_operation_cr from '@shell/utils/operation-cr';
import * as S_utils_parse_externalid from '@shell/utils/parse-externalid';
import * as S_utils_perf_setting_utils from '@shell/utils/perf-setting.utils';
import * as S_utils_platform from '@shell/utils/platform';
import * as S_utils_pod_security_admission from '@shell/utils/pod-security-admission';
import * as S_utils_poller_sequential from '@shell/utils/poller-sequential';
import * as S_utils_poller from '@shell/utils/poller';
import * as S_utils_position from '@shell/utils/position';
import * as S_utils_product from '@shell/utils/product';
import * as S_utils_promise from '@shell/utils/promise';
import * as S_utils_provider from '@shell/utils/provider';
import * as S_utils_queue from '@shell/utils/queue';
import * as S_utils_release_notes from '@shell/utils/release-notes';
import * as S_utils_require_asset from '@shell/utils/require-asset';
import * as S_utils_resource from '@shell/utils/resource';
import * as S_utils_scroll from '@shell/utils/scroll';
import * as S_utils_select from '@shell/utils/select';
import * as S_utils_selector_typed from '@shell/utils/selector-typed';
import * as S_utils_selector from '@shell/utils/selector';
import * as S_utils_socket from '@shell/utils/socket';
import * as S_utils_sort from '@shell/utils/sort';
import * as S_utils_stream from '@shell/utils/stream';
import * as S_utils_string from '@shell/utils/string';
import * as S_utils_style from '@shell/utils/style';
import * as S_utils_svg_filter from '@shell/utils/svg-filter';
import * as S_utils_time from '@shell/utils/time';
import * as S_utils_title from '@shell/utils/title';
import * as S_utils_type_helpers from '@shell/utils/type-helpers';
import * as S_utils_uiplugins from '@shell/utils/uiplugins';
import * as S_utils_units from '@shell/utils/units';
import * as S_utils_url from '@shell/utils/url';
import * as S_utils_v_sphere from '@shell/utils/v-sphere';
import * as S_utils_validators_cidr from '@shell/utils/validators/cidr';
import * as S_utils_validators_cluster_name from '@shell/utils/validators/cluster-name';
import * as S_utils_validators_container_images from '@shell/utils/validators/container-images';
import * as S_utils_validators_cron_schedule from '@shell/utils/validators/cron-schedule';
import * as S_utils_validators_flow_output from '@shell/utils/validators/flow-output';
import * as S_utils_validators_formRules from '@shell/utils/validators/formRules';
import * as S_utils_validators_logging_outputs from '@shell/utils/validators/logging-outputs';
import * as S_utils_validators_machine_pool from '@shell/utils/validators/machine-pool';
import * as S_utils_validators_monitoring_route from '@shell/utils/validators/monitoring-route';
import * as S_utils_validators_pod_affinity from '@shell/utils/validators/pod-affinity';
import * as S_utils_validators_private_registry from '@shell/utils/validators/private-registry';
import * as S_utils_validators_prometheusrule from '@shell/utils/validators/prometheusrule';
import * as S_utils_validators_role_template from '@shell/utils/validators/role-template';
import * as S_utils_validators_service from '@shell/utils/validators/service';
import * as S_utils_validators_setting from '@shell/utils/validators/setting';
import * as S_utils_validators_zod_helpers from '@shell/utils/validators/zod-helpers';
import * as S_utils_version from '@shell/utils/version';
import * as S_utils_versions from '@shell/utils/versions';
import * as S_utils_width from '@shell/utils/width';
import * as S_utils_window from '@shell/utils/window';
import * as S_utils_xccdf from '@shell/utils/xccdf';

const ctx = require.context('@shell/components', true, /^(?:(?!__tests__).)*\.vue$/);

// [import path, namespace module] for every explicitly-exposed @shell util. Registered by
// full path only (utils are imported by path + named export, never a bare name).
const SHELL_MODULES = [
  ['@shell/mixins/auth-config', S_mixins_auth_config],
  ['@shell/mixins/back-link', S_mixins_back_link],
  ['@shell/mixins/brand', S_mixins_brand],
  ['@shell/mixins/browser-tab-visibility', S_mixins_browser_tab_visibility],
  ['@shell/mixins/chart', S_mixins_chart],
  ['@shell/mixins/child-hook', S_mixins_child_hook],
  ['@shell/mixins/closeable', S_mixins_closeable],
  ['@shell/mixins/compact-input', S_mixins_compact_input],
  ['@shell/mixins/create-edit-view/impl', S_mixins_create_edit_view_impl],
  ['@shell/mixins/create-edit-view', S_mixins_create_edit_view],
  ['@shell/mixins/fetch.client', S_mixins_fetch_client],
  ['@shell/mixins/form-validation', S_mixins_form_validation],
  ['@shell/mixins/login', S_mixins_login],
  ['@shell/mixins/metric-poller', S_mixins_metric_poller],
  ['@shell/mixins/page-actions', S_mixins_page_actions],
  ['@shell/mixins/preset', S_mixins_preset],
  ['@shell/mixins/resource-fetch-api-pagination', S_mixins_resource_fetch_api_pagination],
  ['@shell/mixins/resource-fetch-namespaced', S_mixins_resource_fetch_namespaced],
  ['@shell/mixins/resource-fetch', S_mixins_resource_fetch],
  ['@shell/mixins/resource-manager', S_mixins_resource_manager],
  ['@shell/mixins/resource-table-watch', S_mixins_resource_table_watch],
  ['@shell/mixins/vue-select-overrides', S_mixins_vue_select_overrides],
  ['@shell/utils/async', S_utils_async],
  ['@shell/utils/auth', S_utils_auth],
  ['@shell/utils/autoscaler-utils', S_utils_autoscaler_utils],
  ['@shell/utils/aws', S_utils_aws],
  ['@shell/utils/axios', S_utils_axios],
  ['@shell/utils/azure', S_utils_azure],
  ['@shell/utils/back-off', S_utils_back_off],
  ['@shell/utils/banners', S_utils_banners],
  ['@shell/utils/brand', S_utils_brand],
  ['@shell/utils/chart', S_utils_chart],
  ['@shell/utils/clipboard', S_utils_clipboard],
  ['@shell/utils/cluster', S_utils_cluster],
  ['@shell/utils/color', S_utils_color],
  ['@shell/utils/computed', S_utils_computed],
  ['@shell/utils/config', S_utils_config],
  ['@shell/utils/crypto/browserHashUtils', S_utils_crypto_browserHashUtils],
  ['@shell/utils/crypto/browserMd5', S_utils_crypto_browserMd5],
  ['@shell/utils/crypto/browserSha1', S_utils_crypto_browserSha1],
  ['@shell/utils/crypto/browserSha256', S_utils_crypto_browserSha256],
  ['@shell/utils/crypto/encryption', S_utils_crypto_encryption],
  ['@shell/utils/crypto', S_utils_crypto],
  ['@shell/utils/cspAdaptor', S_utils_cspAdaptor],
  ['@shell/utils/custom-validators', S_utils_custom_validators],
  ['@shell/utils/dom', S_utils_dom],
  ['@shell/utils/download', S_utils_download],
  ['@shell/utils/duration', S_utils_duration],
  ['@shell/utils/dynamic-content/config', S_utils_dynamic_content_config],
  ['@shell/utils/dynamic-content/info', S_utils_dynamic_content_info],
  ['@shell/utils/dynamic-content/new-release', S_utils_dynamic_content_new_release],
  ['@shell/utils/dynamic-content/util', S_utils_dynamic_content_util],
  ['@shell/utils/dynamic-importer', S_utils_dynamic_importer],
  ['@shell/utils/error', S_utils_error],
  ['@shell/utils/favicon', S_utils_favicon],
  ['@shell/utils/fleet-appco', S_utils_fleet_appco],
  ['@shell/utils/fleet-types', S_utils_fleet_types],
  ['@shell/utils/fleet', S_utils_fleet],
  ['@shell/utils/formatter', S_utils_formatter],
  ['@shell/utils/fuzzy', S_utils_fuzzy],
  ['@shell/utils/gatekeeper/util', S_utils_gatekeeper_util],
  ['@shell/utils/gc/gc-interval', S_utils_gc_gc_interval],
  ['@shell/utils/gc/gc-root-store', S_utils_gc_gc_root_store],
  ['@shell/utils/gc/gc-route-changed', S_utils_gc_gc_route_changed],
  ['@shell/utils/gc/gc-types', S_utils_gc_gc_types],
  ['@shell/utils/gc/gc', S_utils_gc_gc],
  ['@shell/utils/git', S_utils_git],
  ['@shell/utils/grafana', S_utils_grafana],
  ['@shell/utils/inactivity', S_utils_inactivity],
  ['@shell/utils/ingress', S_utils_ingress],
  ['@shell/utils/kontainer', S_utils_kontainer],
  ['@shell/utils/kube', S_utils_kube],
  ['@shell/utils/monitoring', S_utils_monitoring],
  ['@shell/utils/namespace-filter', S_utils_namespace_filter],
  ['@shell/utils/operation-cr', S_utils_operation_cr],
  ['@shell/utils/parse-externalid', S_utils_parse_externalid],
  ['@shell/utils/perf-setting.utils', S_utils_perf_setting_utils],
  ['@shell/utils/platform', S_utils_platform],
  ['@shell/utils/pod-security-admission', S_utils_pod_security_admission],
  ['@shell/utils/poller-sequential', S_utils_poller_sequential],
  ['@shell/utils/poller', S_utils_poller],
  ['@shell/utils/position', S_utils_position],
  ['@shell/utils/product', S_utils_product],
  ['@shell/utils/promise', S_utils_promise],
  ['@shell/utils/provider', S_utils_provider],
  ['@shell/utils/queue', S_utils_queue],
  ['@shell/utils/release-notes', S_utils_release_notes],
  ['@shell/utils/require-asset', S_utils_require_asset],
  ['@shell/utils/resource', S_utils_resource],
  ['@shell/utils/scroll', S_utils_scroll],
  ['@shell/utils/select', S_utils_select],
  ['@shell/utils/selector-typed', S_utils_selector_typed],
  ['@shell/utils/selector', S_utils_selector],
  ['@shell/utils/socket', S_utils_socket],
  ['@shell/utils/sort', S_utils_sort],
  ['@shell/utils/stream', S_utils_stream],
  ['@shell/utils/string', S_utils_string],
  ['@shell/utils/style', S_utils_style],
  ['@shell/utils/svg-filter', S_utils_svg_filter],
  ['@shell/utils/time', S_utils_time],
  ['@shell/utils/title', S_utils_title],
  ['@shell/utils/type-helpers', S_utils_type_helpers],
  ['@shell/utils/uiplugins', S_utils_uiplugins],
  ['@shell/utils/units', S_utils_units],
  ['@shell/utils/url', S_utils_url],
  ['@shell/utils/v-sphere', S_utils_v_sphere],
  ['@shell/utils/validators/cidr', S_utils_validators_cidr],
  ['@shell/utils/validators/cluster-name', S_utils_validators_cluster_name],
  ['@shell/utils/validators/container-images', S_utils_validators_container_images],
  ['@shell/utils/validators/cron-schedule', S_utils_validators_cron_schedule],
  ['@shell/utils/validators/flow-output', S_utils_validators_flow_output],
  ['@shell/utils/validators/formRules', S_utils_validators_formRules],
  ['@shell/utils/validators/logging-outputs', S_utils_validators_logging_outputs],
  ['@shell/utils/validators/machine-pool', S_utils_validators_machine_pool],
  ['@shell/utils/validators/monitoring-route', S_utils_validators_monitoring_route],
  ['@shell/utils/validators/pod-affinity', S_utils_validators_pod_affinity],
  ['@shell/utils/validators/private-registry', S_utils_validators_private_registry],
  ['@shell/utils/validators/prometheusrule', S_utils_validators_prometheusrule],
  ['@shell/utils/validators/role-template', S_utils_validators_role_template],
  ['@shell/utils/validators/service', S_utils_validators_service],
  ['@shell/utils/validators/setting', S_utils_validators_setting],
  ['@shell/utils/validators/zod-helpers', S_utils_validators_zod_helpers],
  ['@shell/utils/version', S_utils_version],
  ['@shell/utils/versions', S_utils_versions],
  ['@shell/utils/width', S_utils_width],
  ['@shell/utils/window', S_utils_window],
  ['@shell/utils/xccdf', S_utils_xccdf],
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
