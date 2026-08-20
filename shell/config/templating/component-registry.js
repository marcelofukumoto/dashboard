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

// @shell MODULES — EXPLICIT imports, auto-generated from an SCC scan of the @shell import
// graph (see the require.context note above for why a wildcard cannot be used). Every
// module here is ACYCLIC (not part of an import cycle), so importing it explicitly is safe
// even when it transitively imports a cyclic cluster (webpack bundles those deps in the
// main chunk, as the app does). Covers utils, mixins, models, edit/detail/list, dialog,
// composables, chart, directives, cloud-credential, machine-config, promptRemove. In-cycle
// modules are excluded by construction. Regenerate with the SCC generator + re-splice.
import * as S_chart_example from '@shell/chart/example';
import * as S_chart_gatekeeper from '@shell/chart/gatekeeper';
import * as S_chart_istio from '@shell/chart/istio';
import * as S_chart_logging from '@shell/chart/logging';
import * as S_chart_monitoring_ClusterSelector from '@shell/chart/monitoring/ClusterSelector';
import * as S_chart_monitoring_StorageClassSelector from '@shell/chart/monitoring/StorageClassSelector';
import * as S_chart_monitoring_alerting from '@shell/chart/monitoring/alerting';
import * as S_chart_monitoring_grafana from '@shell/chart/monitoring/grafana';
import * as S_chart_monitoring from '@shell/chart/monitoring';
import * as S_chart_monitoring_prometheus from '@shell/chart/monitoring/prometheus';
import * as S_chart_rancher_backup_S3 from '@shell/chart/rancher-backup/S3';
import * as S_chart_rancher_backup from '@shell/chart/rancher-backup';
import * as S_chart_rancher_monitoring_dashboards from '@shell/chart/rancher-monitoring-dashboards';
import * as S_cloud_credential_aws from '@shell/cloud-credential/aws';
import * as S_cloud_credential_azure from '@shell/cloud-credential/azure';
import * as S_cloud_credential_digitalocean from '@shell/cloud-credential/digitalocean';
import * as S_cloud_credential_gcp from '@shell/cloud-credential/gcp';
import * as S_cloud_credential_generic from '@shell/cloud-credential/generic';
import * as S_cloud_credential_harvester from '@shell/cloud-credential/harvester';
import * as S_cloud_credential_linode from '@shell/cloud-credential/linode';
import * as S_cloud_credential_pnap from '@shell/cloud-credential/pnap';
import * as S_cloud_credential_s3 from '@shell/cloud-credential/s3';
import * as S_cloud_credential_vmwarevsphere from '@shell/cloud-credential/vmwarevsphere';
import * as S_composables_cruResource from '@shell/composables/cruResource';
import * as S_composables_drawer from '@shell/composables/drawer';
import * as S_composables_focusTrap from '@shell/composables/focusTrap';
import * as S_composables_resourceDetail from '@shell/composables/resourceDetail';
import * as S_composables_resources from '@shell/composables/resources';
import * as S_composables_useClickOutside from '@shell/composables/useClickOutside';
import * as S_composables_useCompactInput from '@shell/composables/useCompactInput';
import * as S_composables_useFormValidation from '@shell/composables/useFormValidation';
import * as S_composables_useHelmOpResources from '@shell/composables/useHelmOpResources';
import * as S_composables_useI18n from '@shell/composables/useI18n';
import * as S_composables_useInterval from '@shell/composables/useInterval';
import * as S_composables_useIsNewDetailPageEnabled from '@shell/composables/useIsNewDetailPageEnabled';
import * as S_composables_useLabeledFormElement from '@shell/composables/useLabeledFormElement';
import * as S_composables_useLabeledSelect from '@shell/composables/useLabeledSelect';
import * as S_composables_useRuntimeFlag from '@shell/composables/useRuntimeFlag';
import * as S_composables_useStateColor from '@shell/composables/useStateColor';
import * as S_composables_useUserRetentionValidation from '@shell/composables/useUserRetentionValidation';
import * as S_composables_useVeeValidateField from '@shell/composables/useVeeValidateField';
import * as S_detail_auditlog_cattle_io_auditpolicy from '@shell/detail/auditlog.cattle.io.auditpolicy';
import * as S_detail_autoscaling_horizontalpodautoscaler from '@shell/detail/autoscaling.horizontalpodautoscaler';
import * as S_detail_catalog_cattle_io_app from '@shell/detail/catalog.cattle.io.app';
import * as S_detail_catalog_cattle_io_clusterrepo from '@shell/detail/catalog.cattle.io.clusterrepo';
import * as S_detail_compliance_cattle_io_clusterscan from '@shell/detail/compliance.cattle.io.clusterscan';
import * as S_detail_configmap from '@shell/detail/configmap';
import * as S_detail_constraints_gatekeeper_sh_constraint from '@shell/detail/constraints.gatekeeper.sh.constraint';
import * as S_detail_fleet_cattle_io_bundle from '@shell/detail/fleet.cattle.io.bundle';
import * as S_detail_fleet_cattle_io_cluster from '@shell/detail/fleet.cattle.io.cluster';
import * as S_detail_fleet_cattle_io_clustergroup from '@shell/detail/fleet.cattle.io.clustergroup';
import * as S_detail_fleet_cattle_io_gitrepo from '@shell/detail/fleet.cattle.io.gitrepo';
import * as S_detail_fleet_cattle_io_helmop from '@shell/detail/fleet.cattle.io.helmop';
import * as S_detail_harvesterhci_io_management_cluster from '@shell/detail/harvesterhci.io.management.cluster';
import * as S_detail_helm_cattle_io_projecthelmchart from '@shell/detail/helm.cattle.io.projecthelmchart';
import * as S_detail_management_cattle_io_fleetworkspace from '@shell/detail/management.cattle.io.fleetworkspace';
import * as S_detail_management_cattle_io_globalrole from '@shell/detail/management.cattle.io.globalrole';
import * as S_detail_management_cattle_io_oidcclient from '@shell/detail/management.cattle.io.oidcclient';
import * as S_detail_management_cattle_io_roletemplate from '@shell/detail/management.cattle.io.roletemplate';
import * as S_detail_management_cattle_io_user from '@shell/detail/management.cattle.io.user';
import * as S_detail_namespace from '@shell/detail/namespace';
import * as S_detail_networking_k8s_io_ingress from '@shell/detail/networking.k8s.io.ingress';
import * as S_detail_node from '@shell/detail/node';
import * as S_detail_pod from '@shell/detail/pod';
import * as S_detail_projectsecret from '@shell/detail/projectsecret';
import * as S_detail_provisioning_cattle_io_cluster from '@shell/detail/provisioning.cattle.io.cluster';
import * as S_detail_rbac_authorization_k8s_io_clusterrole from '@shell/detail/rbac.authorization.k8s.io.clusterrole';
import * as S_detail_rbac_authorization_k8s_io_role from '@shell/detail/rbac.authorization.k8s.io.role';
import * as S_detail_secret from '@shell/detail/secret';
import * as S_detail_service from '@shell/detail/service';
import * as S_detail_workload from '@shell/detail/workload';
import * as S_dialog_AddClusterMemberDialog from '@shell/dialog/AddClusterMemberDialog';
import * as S_dialog_AddCustomBadgeDialog from '@shell/dialog/AddCustomBadgeDialog';
import * as S_dialog_AddExtensionReposDialog from '@shell/dialog/AddExtensionReposDialog';
import * as S_dialog_AddProjectMemberDialog from '@shell/dialog/AddProjectMemberDialog';
import * as S_dialog_AddonConfigConfirmationDialog from '@shell/dialog/AddonConfigConfirmationDialog';
import * as S_dialog_AssignToDialog from '@shell/dialog/AssignToDialog';
import * as S_dialog_ChangePasswordDialog from '@shell/dialog/ChangePasswordDialog';
import * as S_dialog_DeactivateDriverDialog from '@shell/dialog/DeactivateDriverDialog';
import * as S_dialog_DeveloperLoadExtensionDialog from '@shell/dialog/DeveloperLoadExtensionDialog';
import * as S_dialog_DiagnosticTimingsDialog from '@shell/dialog/DiagnosticTimingsDialog';
import * as S_dialog_DisableAuthProviderDialog from '@shell/dialog/DisableAuthProviderDialog';
import * as S_dialog_DrainNode from '@shell/dialog/DrainNode';
import * as S_dialog_ExtensionCatalogInstallDialog from '@shell/dialog/ExtensionCatalogInstallDialog';
import * as S_dialog_ExtensionCatalogUninstallDialog from '@shell/dialog/ExtensionCatalogUninstallDialog';
import * as S_dialog_FeatureFlagListDialog from '@shell/dialog/FeatureFlagListDialog';
import * as S_dialog_ForceMachineRemoveDialog from '@shell/dialog/ForceMachineRemoveDialog';
import * as S_dialog_GenericPrompt from '@shell/dialog/GenericPrompt';
import * as S_dialog_GitRepoForceUpdateDialog from '@shell/dialog/GitRepoForceUpdateDialog';
import * as S_dialog_HelmOpForceUpdateDialog from '@shell/dialog/HelmOpForceUpdateDialog';
import * as S_dialog_ImportDialog from '@shell/dialog/ImportDialog';
import * as S_dialog_InstallExtensionDialog from '@shell/dialog/InstallExtensionDialog';
import * as S_dialog_Ipv6NetworkingDialog from '@shell/dialog/Ipv6NetworkingDialog';
import * as S_dialog_KnownHostsEditDialog from '@shell/dialog/KnownHostsEditDialog';
import * as S_dialog_MoveNamespaceDialog from '@shell/dialog/MoveNamespaceDialog';
import * as S_dialog_OidcClientSecretDialog from '@shell/dialog/OidcClientSecretDialog';
import * as S_dialog_RedeployWorkloadDialog from '@shell/dialog/RedeployWorkloadDialog';
import * as S_dialog_RollbackWorkloadDialog from '@shell/dialog/RollbackWorkloadDialog';
import * as S_dialog_RotateCertificatesDialog from '@shell/dialog/RotateCertificatesDialog';
import * as S_dialog_RotateEncryptionKeyDialog from '@shell/dialog/RotateEncryptionKeyDialog';
import * as S_dialog_ScaleMachineDownDialog from '@shell/dialog/ScaleMachineDownDialog';
import * as S_dialog_ScalePoolDownDialog from '@shell/dialog/ScalePoolDownDialog';
import * as S_dialog_SearchDialog from '@shell/dialog/SearchDialog';
import * as S_dialog_SloDialog from '@shell/dialog/SloDialog';
import * as S_dialog_UninstallExistingExtensionDialog from '@shell/dialog/UninstallExistingExtensionDialog';
import * as S_dialog_UninstallExtensionDialog from '@shell/dialog/UninstallExtensionDialog';
import * as S_dialog_WechatDialog from '@shell/dialog/WechatDialog';
import * as S_directives_clean_html from '@shell/directives/clean-html';
import * as S_directives_clean_tooltip from '@shell/directives/clean-tooltip';
import * as S_directives_focus from '@shell/directives/focus';
import * as S_directives_int_number from '@shell/directives/int-number';
import * as S_directives_positive_int_number from '@shell/directives/positive-int-number';
import * as S_directives_strip_html_aria_label from '@shell/directives/strip-html-aria-label';
import * as S_directives_trim_whitespace from '@shell/directives/trim-whitespace';
import * as S_directives_ui_context from '@shell/directives/ui-context';
import * as S_edit_auditlog_cattle_io_auditpolicy_AdditionalRedactions from '@shell/edit/auditlog.cattle.io.auditpolicy/AdditionalRedactions';
import * as S_edit_auditlog_cattle_io_auditpolicy_Filters from '@shell/edit/auditlog.cattle.io.auditpolicy/Filters';
import * as S_edit_auditlog_cattle_io_auditpolicy_General from '@shell/edit/auditlog.cattle.io.auditpolicy/General';
import * as S_edit_auditlog_cattle_io_auditpolicy from '@shell/edit/auditlog.cattle.io.auditpolicy';
import * as S_edit_auditlog_cattle_io_auditpolicy_types from '@shell/edit/auditlog.cattle.io.auditpolicy/types';
import * as S_edit_auth_AuthProviderWarningBanners from '@shell/edit/auth/AuthProviderWarningBanners';
import * as S_edit_auth_azuread from '@shell/edit/auth/azuread';
import * as S_edit_auth_github_app_steps from '@shell/edit/auth/github-app-steps';
import * as S_edit_auth_github_steps from '@shell/edit/auth/github-steps';
import * as S_edit_auth_github from '@shell/edit/auth/github';
import * as S_edit_auth_googleoauth from '@shell/edit/auth/googleoauth';
import * as S_edit_auth_ldap_config from '@shell/edit/auth/ldap/config';
import * as S_edit_auth_ldap from '@shell/edit/auth/ldap';
import * as S_edit_auth_oidc from '@shell/edit/auth/oidc';
import * as S_edit_auth_saml from '@shell/edit/auth/saml';
import * as S_edit_autoscaling_horizontalpodautoscaler_external_metric from '@shell/edit/autoscaling.horizontalpodautoscaler/external-metric';
import * as S_edit_autoscaling_horizontalpodautoscaler_hpa_scaling_rule from '@shell/edit/autoscaling.horizontalpodautoscaler/hpa-scaling-rule';
import * as S_edit_autoscaling_horizontalpodautoscaler from '@shell/edit/autoscaling.horizontalpodautoscaler';
import * as S_edit_autoscaling_horizontalpodautoscaler_metric_identifier from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier';
import * as S_edit_autoscaling_horizontalpodautoscaler_metric_object_reference from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-object-reference';
import * as S_edit_autoscaling_horizontalpodautoscaler_metric_target from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-target';
import * as S_edit_autoscaling_horizontalpodautoscaler_metrics_row from '@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row';
import * as S_edit_autoscaling_horizontalpodautoscaler_object_metric from '@shell/edit/autoscaling.horizontalpodautoscaler/object-metric';
import * as S_edit_autoscaling_horizontalpodautoscaler_pod_metric from '@shell/edit/autoscaling.horizontalpodautoscaler/pod-metric';
import * as S_edit_autoscaling_horizontalpodautoscaler_resource_metric from '@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric';
import * as S_edit_catalog_cattle_io_clusterrepo from '@shell/edit/catalog.cattle.io.clusterrepo';
import * as S_edit_cloudcredential from '@shell/edit/cloudcredential';
import * as S_edit_compliance_cattle_io_clusterscan from '@shell/edit/compliance.cattle.io.clusterscan';
import * as S_edit_compliance_cattle_io_clusterscanbenchmark from '@shell/edit/compliance.cattle.io.clusterscanbenchmark';
import * as S_edit_compliance_cattle_io_clusterscanprofile from '@shell/edit/compliance.cattle.io.clusterscanprofile';
import * as S_edit_configmap from '@shell/edit/configmap';
import * as S_edit_constraints_gatekeeper_sh_constraint_MatchKinds from '@shell/edit/constraints.gatekeeper.sh.constraint/MatchKinds';
import * as S_edit_constraints_gatekeeper_sh_constraint_NamespaceList from '@shell/edit/constraints.gatekeeper.sh.constraint/NamespaceList';
import * as S_edit_constraints_gatekeeper_sh_constraint_Scope from '@shell/edit/constraints.gatekeeper.sh.constraint/Scope';
import * as S_edit_constraints_gatekeeper_sh_constraint from '@shell/edit/constraints.gatekeeper.sh.constraint';
import * as S_edit_fleet_cattle_io_cluster from '@shell/edit/fleet.cattle.io.cluster';
import * as S_edit_fleet_cattle_io_clustergroup from '@shell/edit/fleet.cattle.io.clustergroup';
import * as S_edit_fleet_cattle_io_gitrepo from '@shell/edit/fleet.cattle.io.gitrepo';
import * as S_edit_fleet_cattle_io_helmop from '@shell/edit/fleet.cattle.io.helmop';
import * as S_edit_group_principal from '@shell/edit/group.principal';
import * as S_edit_helm_cattle_io_projecthelmchart from '@shell/edit/helm.cattle.io.projecthelmchart';
import * as S_edit_k8s_cni_cncf_io_networkattachmentdefinition from '@shell/edit/k8s.cni.cncf.io.networkattachmentdefinition';
import * as S_edit_kontainerDriver from '@shell/edit/kontainerDriver';
import * as S_edit_logging_flow_Match from '@shell/edit/logging-flow/Match';
import * as S_edit_logging_flow from '@shell/edit/logging-flow';
import * as S_edit_logging_banzaicloud_io_clusterflow from '@shell/edit/logging.banzaicloud.io.clusterflow';
import * as S_edit_logging_banzaicloud_io_clusteroutput from '@shell/edit/logging.banzaicloud.io.clusteroutput';
import * as S_edit_logging_banzaicloud_io_flow from '@shell/edit/logging.banzaicloud.io.flow';
import * as S_edit_logging_banzaicloud_io_output from '@shell/edit/logging.banzaicloud.io.output';
import * as S_edit_logging_banzaicloud_io_output_providers_awsElasticsearch from '@shell/edit/logging.banzaicloud.io.output/providers/awsElasticsearch';
import * as S_edit_logging_banzaicloud_io_output_providers_azurestorage from '@shell/edit/logging.banzaicloud.io.output/providers/azurestorage';
import * as S_edit_logging_banzaicloud_io_output_providers_cloudwatch from '@shell/edit/logging.banzaicloud.io.output/providers/cloudwatch';
import * as S_edit_logging_banzaicloud_io_output_providers_datadog from '@shell/edit/logging.banzaicloud.io.output/providers/datadog';
import * as S_edit_logging_banzaicloud_io_output_providers_elasticsearch from '@shell/edit/logging.banzaicloud.io.output/providers/elasticsearch';
import * as S_edit_logging_banzaicloud_io_output_providers_file from '@shell/edit/logging.banzaicloud.io.output/providers/file';
import * as S_edit_logging_banzaicloud_io_output_providers_forward from '@shell/edit/logging.banzaicloud.io.output/providers/forward';
import * as S_edit_logging_banzaicloud_io_output_providers_gcs from '@shell/edit/logging.banzaicloud.io.output/providers/gcs';
import * as S_edit_logging_banzaicloud_io_output_providers_gelf from '@shell/edit/logging.banzaicloud.io.output/providers/gelf';
import * as S_edit_logging_banzaicloud_io_output_providers_kafka from '@shell/edit/logging.banzaicloud.io.output/providers/kafka';
import * as S_edit_logging_banzaicloud_io_output_providers_kinesisStream from '@shell/edit/logging.banzaicloud.io.output/providers/kinesisStream';
import * as S_edit_logging_banzaicloud_io_output_providers_logdna from '@shell/edit/logging.banzaicloud.io.output/providers/logdna';
import * as S_edit_logging_banzaicloud_io_output_providers_logz from '@shell/edit/logging.banzaicloud.io.output/providers/logz';
import * as S_edit_logging_banzaicloud_io_output_providers_loki from '@shell/edit/logging.banzaicloud.io.output/providers/loki';
import * as S_edit_logging_banzaicloud_io_output_providers_newrelic from '@shell/edit/logging.banzaicloud.io.output/providers/newrelic';
import * as S_edit_logging_banzaicloud_io_output_providers_opensearch from '@shell/edit/logging.banzaicloud.io.output/providers/opensearch';
import * as S_edit_logging_banzaicloud_io_output_providers_redis from '@shell/edit/logging.banzaicloud.io.output/providers/redis';
import * as S_edit_logging_banzaicloud_io_output_providers_s3 from '@shell/edit/logging.banzaicloud.io.output/providers/s3';
import * as S_edit_logging_banzaicloud_io_output_providers_splunkHec from '@shell/edit/logging.banzaicloud.io.output/providers/splunkHec';
import * as S_edit_logging_banzaicloud_io_output_providers_sumologic from '@shell/edit/logging.banzaicloud.io.output/providers/sumologic';
import * as S_edit_logging_banzaicloud_io_output_providers_syslog from '@shell/edit/logging.banzaicloud.io.output/providers/syslog';
import * as S_edit_logging_banzaicloud_io_output_providers_utils from '@shell/edit/logging.banzaicloud.io.output/providers/utils';
import * as S_edit_management_cattle_io_clusterroletemplatebinding from '@shell/edit/management.cattle.io.clusterroletemplatebinding';
import * as S_edit_management_cattle_io_fleetworkspace from '@shell/edit/management.cattle.io.fleetworkspace';
import * as S_edit_management_cattle_io_globalrole from '@shell/edit/management.cattle.io.globalrole';
import * as S_edit_management_cattle_io_node from '@shell/edit/management.cattle.io.node';
import * as S_edit_management_cattle_io_oidcclient from '@shell/edit/management.cattle.io.oidcclient';
import * as S_edit_management_cattle_io_podsecurityadmissionconfigurationtemplate from '@shell/edit/management.cattle.io.podsecurityadmissionconfigurationtemplate';
import * as S_edit_management_cattle_io_project from '@shell/edit/management.cattle.io.project';
import * as S_edit_management_cattle_io_projectroletemplatebinding from '@shell/edit/management.cattle.io.projectroletemplatebinding';
import * as S_edit_management_cattle_io_roletemplate from '@shell/edit/management.cattle.io.roletemplate';
import * as S_edit_management_cattle_io_setting_delete_machine_on_failure_after from '@shell/edit/management.cattle.io.setting/delete-machine-on-failure-after';
import * as S_edit_management_cattle_io_setting from '@shell/edit/management.cattle.io.setting';
import * as S_edit_management_cattle_io_setting_system_default_registry_pull_secrets from '@shell/edit/management.cattle.io.setting/system-default-registry-pull-secrets';
import * as S_edit_management_cattle_io_user from '@shell/edit/management.cattle.io.user';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_auth from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/auth';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig from '@shell/edit/monitoring.coreos.com.alertmanagerconfig';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_receiverConfig from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_routeConfig from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/routeConfig';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_tls from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/tls';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_types_email from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/email';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_types_opsgenie from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_types_pagerduty from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_types_slack from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack';
import * as S_edit_monitoring_coreos_com_alertmanagerconfig_types_webhook from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/webhook';
import * as S_edit_monitoring_coreos_com_prometheusrule_AlertingRule from '@shell/edit/monitoring.coreos.com.prometheusrule/AlertingRule';
import * as S_edit_monitoring_coreos_com_prometheusrule_GroupRules from '@shell/edit/monitoring.coreos.com.prometheusrule/GroupRules';
import * as S_edit_monitoring_coreos_com_prometheusrule_RecordingRule from '@shell/edit/monitoring.coreos.com.prometheusrule/RecordingRule';
import * as S_edit_monitoring_coreos_com_prometheusrule from '@shell/edit/monitoring.coreos.com.prometheusrule';
import * as S_edit_monitoring_coreos_com_receiver_auth from '@shell/edit/monitoring.coreos.com.receiver/auth';
import * as S_edit_monitoring_coreos_com_receiver from '@shell/edit/monitoring.coreos.com.receiver';
import * as S_edit_monitoring_coreos_com_receiver_tls from '@shell/edit/monitoring.coreos.com.receiver/tls';
import * as S_edit_monitoring_coreos_com_receiver_types_email from '@shell/edit/monitoring.coreos.com.receiver/types/email';
import * as S_edit_monitoring_coreos_com_receiver_types_opsgenie from '@shell/edit/monitoring.coreos.com.receiver/types/opsgenie';
import * as S_edit_monitoring_coreos_com_receiver_types_pagerduty from '@shell/edit/monitoring.coreos.com.receiver/types/pagerduty';
import * as S_edit_monitoring_coreos_com_receiver_types_slack from '@shell/edit/monitoring.coreos.com.receiver/types/slack';
import * as S_edit_monitoring_coreos_com_receiver_types_webhook_add from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.add';
import * as S_edit_monitoring_coreos_com_receiver_types_webhook_banner from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.banner';
import * as S_edit_monitoring_coreos_com_receiver_types_webhook from '@shell/edit/monitoring.coreos.com.receiver/types/webhook';
import * as S_edit_monitoring_coreos_com_route from '@shell/edit/monitoring.coreos.com.route';
import * as S_edit_namespace from '@shell/edit/namespace';
import * as S_edit_networking_istio_io_destinationrule_LoadBalancer from '@shell/edit/networking.istio.io.destinationrule/LoadBalancer';
import * as S_edit_networking_istio_io_destinationrule from '@shell/edit/networking.istio.io.destinationrule';
import * as S_edit_networking_k8s_io_ingress_Certificate from '@shell/edit/networking.k8s.io.ingress/Certificate';
import * as S_edit_networking_k8s_io_ingress_Certificates from '@shell/edit/networking.k8s.io.ingress/Certificates';
import * as S_edit_networking_k8s_io_ingress_DefaultBackend from '@shell/edit/networking.k8s.io.ingress/DefaultBackend';
import * as S_edit_networking_k8s_io_ingress_IngressClass from '@shell/edit/networking.k8s.io.ingress/IngressClass';
import * as S_edit_networking_k8s_io_ingress_Rule from '@shell/edit/networking.k8s.io.ingress/Rule';
import * as S_edit_networking_k8s_io_ingress_RulePath from '@shell/edit/networking.k8s.io.ingress/RulePath';
import * as S_edit_networking_k8s_io_ingress_Rules from '@shell/edit/networking.k8s.io.ingress/Rules';
import * as S_edit_networking_k8s_io_ingress from '@shell/edit/networking.k8s.io.ingress';
import * as S_edit_networking_k8s_io_networkpolicy_PolicyRule from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRule';
import * as S_edit_networking_k8s_io_networkpolicy_PolicyRulePort from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRulePort';
import * as S_edit_networking_k8s_io_networkpolicy_PolicyRuleTarget from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget';
import * as S_edit_networking_k8s_io_networkpolicy_PolicyRules from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRules';
import * as S_edit_networking_k8s_io_networkpolicy from '@shell/edit/networking.k8s.io.networkpolicy';
import * as S_edit_node from '@shell/edit/node';
import * as S_edit_nodeDriver from '@shell/edit/nodeDriver';
import * as S_edit_persistentvolume from '@shell/edit/persistentvolume';
import * as S_edit_persistentvolume_plugins_awsElasticBlockStore from '@shell/edit/persistentvolume/plugins/awsElasticBlockStore';
import * as S_edit_persistentvolume_plugins_azureDisk from '@shell/edit/persistentvolume/plugins/azureDisk';
import * as S_edit_persistentvolume_plugins_azureFile from '@shell/edit/persistentvolume/plugins/azureFile';
import * as S_edit_persistentvolume_plugins_cephfs from '@shell/edit/persistentvolume/plugins/cephfs';
import * as S_edit_persistentvolume_plugins_cinder from '@shell/edit/persistentvolume/plugins/cinder';
import * as S_edit_persistentvolume_plugins_csi from '@shell/edit/persistentvolume/plugins/csi';
import * as S_edit_persistentvolume_plugins_fc from '@shell/edit/persistentvolume/plugins/fc';
import * as S_edit_persistentvolume_plugins_flexVolume from '@shell/edit/persistentvolume/plugins/flexVolume';
import * as S_edit_persistentvolume_plugins_flocker from '@shell/edit/persistentvolume/plugins/flocker';
import * as S_edit_persistentvolume_plugins_gcePersistentDisk from '@shell/edit/persistentvolume/plugins/gcePersistentDisk';
import * as S_edit_persistentvolume_plugins_glusterfs from '@shell/edit/persistentvolume/plugins/glusterfs';
import * as S_edit_persistentvolume_plugins_hostPath from '@shell/edit/persistentvolume/plugins/hostPath';
import * as S_edit_persistentvolume_plugins_iscsi from '@shell/edit/persistentvolume/plugins/iscsi';
import * as S_edit_persistentvolume_plugins_local from '@shell/edit/persistentvolume/plugins/local';
import * as S_edit_persistentvolume_plugins_longhorn from '@shell/edit/persistentvolume/plugins/longhorn';
import * as S_edit_persistentvolume_plugins_nfs from '@shell/edit/persistentvolume/plugins/nfs';
import * as S_edit_persistentvolume_plugins_photonPersistentDisk from '@shell/edit/persistentvolume/plugins/photonPersistentDisk';
import * as S_edit_persistentvolume_plugins_portworxVolume from '@shell/edit/persistentvolume/plugins/portworxVolume';
import * as S_edit_persistentvolume_plugins_quobyte from '@shell/edit/persistentvolume/plugins/quobyte';
import * as S_edit_persistentvolume_plugins_rbd from '@shell/edit/persistentvolume/plugins/rbd';
import * as S_edit_persistentvolume_plugins_scaleIO from '@shell/edit/persistentvolume/plugins/scaleIO';
import * as S_edit_persistentvolume_plugins_storageos from '@shell/edit/persistentvolume/plugins/storageos';
import * as S_edit_persistentvolume_plugins_vsphereVolume from '@shell/edit/persistentvolume/plugins/vsphereVolume';
import * as S_edit_persistentvolumeclaim from '@shell/edit/persistentvolumeclaim';
import * as S_edit_pod from '@shell/edit/pod';
import * as S_edit_policy_poddisruptionbudget from '@shell/edit/policy.poddisruptionbudget';
import * as S_edit_projectsecret from '@shell/edit/projectsecret';
import * as S_edit_provisioning_cattle_io_cluster_AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv';
import * as S_edit_provisioning_cattle_io_cluster_CustomCommand from '@shell/edit/provisioning.cattle.io.cluster/CustomCommand';
import * as S_edit_provisioning_cattle_io_cluster_Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import * as S_edit_provisioning_cattle_io_cluster_SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential';
import * as S_edit_provisioning_cattle_io_cluster from '@shell/edit/provisioning.cattle.io.cluster';
import * as S_edit_provisioning_cattle_io_cluster_ingress_IngressCards from '@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards';
import * as S_edit_provisioning_cattle_io_cluster_ingress_IngressConfiguration from '@shell/edit/provisioning.cattle.io.cluster/ingress/IngressConfiguration';
import * as S_edit_provisioning_cattle_io_cluster_rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2';
import * as S_edit_provisioning_cattle_io_cluster_shared from '@shell/edit/provisioning.cattle.io.cluster/shared';
import * as S_edit_provisioning_cattle_io_cluster_subtype_detection from '@shell/edit/provisioning.cattle.io.cluster/subtype-detection';
import * as S_edit_provisioning_cattle_io_cluster_tabs_AddOnAdditionalManifest from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest';
import * as S_edit_provisioning_cattle_io_cluster_tabs_AddOnConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig';
import * as S_edit_provisioning_cattle_io_cluster_tabs_Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced';
import * as S_edit_provisioning_cattle_io_cluster_tabs_AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration';
import * as S_edit_provisioning_cattle_io_cluster_tabs_Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics';
import * as S_edit_provisioning_cattle_io_cluster_tabs_DirectoryConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig';
import * as S_edit_provisioning_cattle_io_cluster_tabs_Ingress from '@shell/edit/provisioning.cattle.io.cluster/tabs/Ingress';
import * as S_edit_provisioning_cattle_io_cluster_tabs_MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool';
import * as S_edit_provisioning_cattle_io_cluster_tabs_MemberRoles from '@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles';
import * as S_edit_provisioning_cattle_io_cluster_tabs_etcd_S3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config';
import * as S_edit_provisioning_cattle_io_cluster_tabs_etcd from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd';
import * as S_edit_provisioning_cattle_io_cluster_tabs_networking_ACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE';
import * as S_edit_provisioning_cattle_io_cluster_tabs_networking from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking';
import * as S_edit_provisioning_cattle_io_cluster_tabs_registries_RegistryConfigs from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs';
import * as S_edit_provisioning_cattle_io_cluster_tabs_registries_RegistryMirrors from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors';
import * as S_edit_provisioning_cattle_io_cluster_tabs_registries from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries';
import * as S_edit_provisioning_cattle_io_cluster_tabs_upgrade_DrainOptions from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions';
import * as S_edit_provisioning_cattle_io_cluster_tabs_upgrade from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade';
import * as S_edit_rbac_authorization_k8s_io_clusterrole from '@shell/edit/rbac.authorization.k8s.io.clusterrole';
import * as S_edit_rbac_authorization_k8s_io_role from '@shell/edit/rbac.authorization.k8s.io.role';
import * as S_edit_resources_cattle_io_backup from '@shell/edit/resources.cattle.io.backup';
import * as S_edit_resources_cattle_io_restore from '@shell/edit/resources.cattle.io.restore';
import * as S_edit_secret_basic from '@shell/edit/secret/basic';
import * as S_edit_secret_generic from '@shell/edit/secret/generic';
import * as S_edit_secret from '@shell/edit/secret';
import * as S_edit_secret_registry from '@shell/edit/secret/registry';
import * as S_edit_secret_ssh from '@shell/edit/secret/ssh';
import * as S_edit_secret_tls from '@shell/edit/secret/tls';
import * as S_edit_service from '@shell/edit/service';
import * as S_edit_serviceaccount from '@shell/edit/serviceaccount';
import * as S_edit_storage_k8s_io_storageclass from '@shell/edit/storage.k8s.io.storageclass';
import * as S_edit_storage_k8s_io_storageclass_provisioners_custom from '@shell/edit/storage.k8s.io.storageclass/provisioners/custom';
import * as S_edit_storage_k8s_io_storageclass_provisioners_driver_harvesterhci_io from '@shell/edit/storage.k8s.io.storageclass/provisioners/driver.harvesterhci.io';
import * as S_edit_storage_k8s_io_storageclass_provisioners_driver_longhorn_io from '@shell/edit/storage.k8s.io.storageclass/provisioners/driver.longhorn.io';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_aws_ebs from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/aws-ebs';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_azure_disk from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-disk';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_azure_file from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-file';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_cinder from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/cinder';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_gce_pd from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/gce-pd';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_glusterfs from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/glusterfs';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_no_provisioner from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/no-provisioner';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_portworx_volume from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/portworx-volume';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_quobyte from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/quobyte';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_rbd from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/rbd';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_scaleio from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/scaleio';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_storageos from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/storageos';
import * as S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_vsphere_volume from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/vsphere-volume';
import * as S_edit_token from '@shell/edit/token';
import * as S_edit_ui_cattle_io_navlink from '@shell/edit/ui.cattle.io.navlink';
import * as S_edit_workload_Job from '@shell/edit/workload/Job';
import * as S_edit_workload_Upgrading from '@shell/edit/workload/Upgrading';
import * as S_edit_workload_VolumeClaimTemplate from '@shell/edit/workload/VolumeClaimTemplate';
import * as S_edit_workload from '@shell/edit/workload';
import * as S_edit_workload_mixins_workload from '@shell/edit/workload/mixins/workload';
import * as S_edit_workload_storage_ContainerMountPaths from '@shell/edit/workload/storage/ContainerMountPaths';
import * as S_edit_workload_storage_Mount from '@shell/edit/workload/storage/Mount';
import * as S_edit_workload_storage_awsElasticBlockStore from '@shell/edit/workload/storage/awsElasticBlockStore';
import * as S_edit_workload_storage_azureDisk from '@shell/edit/workload/storage/azureDisk';
import * as S_edit_workload_storage_azureFile from '@shell/edit/workload/storage/azureFile';
import * as S_edit_workload_storage_csi_driver_longhorn_io from '@shell/edit/workload/storage/csi/driver.longhorn.io';
import * as S_edit_workload_storage_csi from '@shell/edit/workload/storage/csi';
import * as S_edit_workload_storage_emptyDir from '@shell/edit/workload/storage/emptyDir';
import * as S_edit_workload_storage_ephemeralVolume from '@shell/edit/workload/storage/ephemeralVolume';
import * as S_edit_workload_storage_gcePersistentDisk from '@shell/edit/workload/storage/gcePersistentDisk';
import * as S_edit_workload_storage_hostPath from '@shell/edit/workload/storage/hostPath';
import * as S_edit_workload_storage from '@shell/edit/workload/storage';
import * as S_edit_workload_storage_nfs from '@shell/edit/workload/storage/nfs';
import * as S_edit_workload_storage_persistentVolumeClaim from '@shell/edit/workload/storage/persistentVolumeClaim';
import * as S_edit_workload_storage_persistentVolumeClaim_persistentvolumeclaim from '@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim';
import * as S_edit_workload_storage_secret from '@shell/edit/workload/storage/secret';
import * as S_edit_workload_storage_vsphereVolume from '@shell/edit/workload/storage/vsphereVolume';
import * as S_list_auditlog_cattle_io_auditpolicy from '@shell/list/auditlog.cattle.io.auditpolicy';
import * as S_list_catalog_cattle_io_app from '@shell/list/catalog.cattle.io.app';
import * as S_list_catalog_cattle_io_clusterrepo from '@shell/list/catalog.cattle.io.clusterrepo';
import * as S_list_compliance_cattle_io_clusterscan from '@shell/list/compliance.cattle.io.clusterscan';
import * as S_list_ext_cattle_io_kubeconfig from '@shell/list/ext.cattle.io.kubeconfig';
import * as S_list_fleet_cattle_io_bundle from '@shell/list/fleet.cattle.io.bundle';
import * as S_list_fleet_cattle_io_cluster from '@shell/list/fleet.cattle.io.cluster';
import * as S_list_fleet_cattle_io_clustergroup from '@shell/list/fleet.cattle.io.clustergroup';
import * as S_list_fleet_cattle_io_clusterregistrationtoken from '@shell/list/fleet.cattle.io.clusterregistrationtoken';
import * as S_list_fleet_cattle_io_gitrepo from '@shell/list/fleet.cattle.io.gitrepo';
import * as S_list_fleet_cattle_io_helmop from '@shell/list/fleet.cattle.io.helmop';
import * as S_list_group_principal from '@shell/list/group.principal';
import * as S_list_harvesterhci_io_management_cluster from '@shell/list/harvesterhci.io.management.cluster';
import * as S_list_helm_cattle_io_projecthelmchart from '@shell/list/helm.cattle.io.projecthelmchart';
import * as S_list_logging_banzaicloud_io_clusterflow from '@shell/list/logging.banzaicloud.io.clusterflow';
import * as S_list_logging_banzaicloud_io_flow from '@shell/list/logging.banzaicloud.io.flow';
import * as S_list_management_cattle_io_cluster from '@shell/list/management.cattle.io.cluster';
import * as S_list_management_cattle_io_feature from '@shell/list/management.cattle.io.feature';
import * as S_list_management_cattle_io_fleetworkspace from '@shell/list/management.cattle.io.fleetworkspace';
import * as S_list_management_cattle_io_oidcclient from '@shell/list/management.cattle.io.oidcclient';
import * as S_list_management_cattle_io_podsecurityadmissionconfigurationtemplate from '@shell/list/management.cattle.io.podsecurityadmissionconfigurationtemplate';
import * as S_list_management_cattle_io_setting from '@shell/list/management.cattle.io.setting';
import * as S_list_management_cattle_io_user from '@shell/list/management.cattle.io.user';
import * as S_list_monitoring_coreos_com_alertmanagerconfig from '@shell/list/monitoring.coreos.com.alertmanagerconfig';
import * as S_list_namespace from '@shell/list/namespace';
import * as S_list_networking_k8s_io_ingress from '@shell/list/networking.k8s.io.ingress';
import * as S_list_node from '@shell/list/node';
import * as S_list_persistentvolume from '@shell/list/persistentvolume';
import * as S_list_persistentvolumeclaim from '@shell/list/persistentvolumeclaim';
import * as S_list_projectsecret from '@shell/list/projectsecret';
import * as S_list_provisioning_cattle_io_cluster from '@shell/list/provisioning.cattle.io.cluster';
import * as S_list_rbac_authorization_k8s_io_clusterrolebinding from '@shell/list/rbac.authorization.k8s.io.clusterrolebinding';
import * as S_list_secret from '@shell/list/secret';
import * as S_list_service from '@shell/list/service';
import * as S_list_ui_cattle_io_navlink from '@shell/list/ui.cattle.io.navlink';
import * as S_list_utils_management_cattle_io_cluster_utils from '@shell/list/utils/management.cattle.io.cluster.utils';
import * as S_list_workload from '@shell/list/workload';
import * as S_machine_config_amazonec2 from '@shell/machine-config/amazonec2';
import * as S_machine_config_azure from '@shell/machine-config/azure';
import * as S_machine_config_components_EC2Networking from '@shell/machine-config/components/EC2Networking';
import * as S_machine_config_components_GCEImage from '@shell/machine-config/components/GCEImage';
import * as S_machine_config_digitalocean from '@shell/machine-config/digitalocean';
import * as S_machine_config_generic from '@shell/machine-config/generic';
import * as S_machine_config_google from '@shell/machine-config/google';
import * as S_machine_config_linode from '@shell/machine-config/linode';
import * as S_machine_config_pnap from '@shell/machine-config/pnap';
import * as S_machine_config_vmwarevsphere_config from '@shell/machine-config/vmwarevsphere-config';
import * as S_machine_config_vmwarevsphere from '@shell/machine-config/vmwarevsphere';
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
import * as S_models_apiextensions_k8s_io_customresourcedefinition from '@shell/models/apiextensions.k8s.io.customresourcedefinition';
import * as S_models_app from '@shell/models/app';
import * as S_models_apps_controllerrevision from '@shell/models/apps.controllerrevision';
import * as S_models_apps_daemonset from '@shell/models/apps.daemonset';
import * as S_models_apps_deployment from '@shell/models/apps.deployment';
import * as S_models_apps_replicaset from '@shell/models/apps.replicaset';
import * as S_models_apps_statefulset from '@shell/models/apps.statefulset';
import * as S_models_auditlog_cattle_io_auditpolicy from '@shell/models/auditlog.cattle.io.auditpolicy';
import * as S_models_autoscaling_horizontalpodautoscaler from '@shell/models/autoscaling.horizontalpodautoscaler';
import * as S_models_base_cluster_x_k8s_io from '@shell/models/base-cluster.x-k8s.io';
import * as S_models_batch_cronjob from '@shell/models/batch.cronjob';
import * as S_models_batch_job from '@shell/models/batch.job';
import * as S_models_catalog_cattle_io_app from '@shell/models/catalog.cattle.io.app';
import * as S_models_catalog_cattle_io_clusterrepo from '@shell/models/catalog.cattle.io.clusterrepo';
import * as S_models_catalog_cattle_io_operation from '@shell/models/catalog.cattle.io.operation';
import * as S_models_catalog_cattle_io_repo from '@shell/models/catalog.cattle.io.repo';
import * as S_models_catalog_cattle_io_uiplugin from '@shell/models/catalog.cattle.io.uiplugin';
import * as S_models_chart from '@shell/models/chart';
import * as S_models_chartinstallaction from '@shell/models/chartinstallaction';
import * as S_models_chartupgradeaction from '@shell/models/chartupgradeaction';
import * as S_models_cloudcredential from '@shell/models/cloudcredential';
import * as S_models_cluster from '@shell/models/cluster';
import * as S_models_cluster_x_k8s_io_machine from '@shell/models/cluster.x-k8s.io.machine';
import * as S_models_cluster_x_k8s_io_machinedeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';
import * as S_models_cluster_x_k8s_io_machineset from '@shell/models/cluster.x-k8s.io.machineset';
import * as S_models_cluster_node from '@shell/models/cluster/node';
import * as S_models_cluster_schema from '@shell/models/cluster/schema';
import * as S_models_clusterroletemplatebinding from '@shell/models/clusterroletemplatebinding';
import * as S_models_compliance_cattle_io_clusterscan from '@shell/models/compliance.cattle.io.clusterscan';
import * as S_models_compliance_cattle_io_clusterscanbenchmark from '@shell/models/compliance.cattle.io.clusterscanbenchmark';
import * as S_models_compliance_cattle_io_clusterscanprofile from '@shell/models/compliance.cattle.io.clusterscanprofile';
import * as S_models_compliance_cattle_io_clusterscanreport from '@shell/models/compliance.cattle.io.clusterscanreport';
import * as S_models_configmap from '@shell/models/configmap';
import * as S_models_constraints_gatekeeper_sh_constraint from '@shell/models/constraints.gatekeeper.sh.constraint';
import * as S_models_driver from '@shell/models/driver';
import * as S_models_event from '@shell/models/event';
import * as S_models_ext_cattle_io_groupmembershiprefreshrequest from '@shell/models/ext.cattle.io.groupmembershiprefreshrequest';
import * as S_models_ext_cattle_io_kubeconfig from '@shell/models/ext.cattle.io.kubeconfig';
import * as S_models_ext_cattle_io_passwordchangerequest from '@shell/models/ext.cattle.io.passwordchangerequest';
import * as S_models_ext_cattle_io_selfuser from '@shell/models/ext.cattle.io.selfuser';
import * as S_models_fleet_application from '@shell/models/fleet-application';
import * as S_models_fleet_cattle_io_bundle from '@shell/models/fleet.cattle.io.bundle';
import * as S_models_fleet_cattle_io_cluster from '@shell/models/fleet.cattle.io.cluster';
import * as S_models_fleet_cattle_io_clustergroup from '@shell/models/fleet.cattle.io.clustergroup';
import * as S_models_fleet_cattle_io_clusterregistrationtoken from '@shell/models/fleet.cattle.io.clusterregistrationtoken';
import * as S_models_fleet_cattle_io_gitrepo from '@shell/models/fleet.cattle.io.gitrepo';
import * as S_models_fleet_cattle_io_helmop from '@shell/models/fleet.cattle.io.helmop';
import * as S_models_group_principal from '@shell/models/group.principal';
import * as S_models_helm_cattle_io_projecthelmchart from '@shell/models/helm.cattle.io.projecthelmchart';
import * as S_models_k8s_cni_cncf_io_networkattachmentdefinition from '@shell/models/k8s.cni.cncf.io.networkattachmentdefinition';
import * as S_models_kontainerdriver from '@shell/models/kontainerdriver';
import * as S_models_logging_banzaicloud_io_clusterflow from '@shell/models/logging.banzaicloud.io.clusterflow';
import * as S_models_logging_banzaicloud_io_clusteroutput from '@shell/models/logging.banzaicloud.io.clusteroutput';
import * as S_models_logging_banzaicloud_io_flow from '@shell/models/logging.banzaicloud.io.flow';
import * as S_models_logging_banzaicloud_io_output from '@shell/models/logging.banzaicloud.io.output';
import * as S_models_management_cattle_io_authconfig from '@shell/models/management.cattle.io.authconfig';
import * as S_models_management_cattle_io_cluster from '@shell/models/management.cattle.io.cluster';
import * as S_models_management_cattle_io_clusterroletemplatebinding from '@shell/models/management.cattle.io.clusterroletemplatebinding';
import * as S_models_management_cattle_io_feature from '@shell/models/management.cattle.io.feature';
import * as S_models_management_cattle_io_fleetworkspace from '@shell/models/management.cattle.io.fleetworkspace';
import * as S_models_management_cattle_io_gitreporestriction from '@shell/models/management.cattle.io.gitreporestriction';
import * as S_models_management_cattle_io_globalrole from '@shell/models/management.cattle.io.globalrole';
import * as S_models_management_cattle_io_globalrolebinding from '@shell/models/management.cattle.io.globalrolebinding';
import * as S_models_management_cattle_io_kontainerdriver from '@shell/models/management.cattle.io.kontainerdriver';
import * as S_models_management_cattle_io_node from '@shell/models/management.cattle.io.node';
import * as S_models_management_cattle_io_nodepool from '@shell/models/management.cattle.io.nodepool';
import * as S_models_management_cattle_io_nodetemplate from '@shell/models/management.cattle.io.nodetemplate';
import * as S_models_management_cattle_io_oidcclient from '@shell/models/management.cattle.io.oidcclient';
import * as S_models_management_cattle_io_podsecurityadmissionconfigurationtemplate from '@shell/models/management.cattle.io.podsecurityadmissionconfigurationtemplate';
import * as S_models_management_cattle_io_project from '@shell/models/management.cattle.io.project';
import * as S_models_management_cattle_io_projectroletemplatebinding from '@shell/models/management.cattle.io.projectroletemplatebinding';
import * as S_models_management_cattle_io_registration from '@shell/models/management.cattle.io.registration';
import * as S_models_management_cattle_io_roletemplate from '@shell/models/management.cattle.io.roletemplate';
import * as S_models_management_cattle_io_setting from '@shell/models/management.cattle.io.setting';
import * as S_models_management_cattle_io_user from '@shell/models/management.cattle.io.user';
import * as S_models_management_schema from '@shell/models/management/schema';
import * as S_models_metrics_k8s_io_nodemetrics from '@shell/models/metrics.k8s.io.nodemetrics';
import * as S_models_monitoring_coreos_com_alertmanagerconfig from '@shell/models/monitoring.coreos.com.alertmanagerconfig';
import * as S_models_monitoring_coreos_com_podmonitor from '@shell/models/monitoring.coreos.com.podmonitor';
import * as S_models_monitoring_coreos_com_prometheusrule from '@shell/models/monitoring.coreos.com.prometheusrule';
import * as S_models_monitoring_coreos_com_receiver from '@shell/models/monitoring.coreos.com.receiver';
import * as S_models_monitoring_coreos_com_servicemonitor from '@shell/models/monitoring.coreos.com.servicemonitor';
import * as S_models_networking_istio_io_destinationrule from '@shell/models/networking.istio.io.destinationrule';
import * as S_models_networking_k8s_io_ingress from '@shell/models/networking.k8s.io.ingress';
import * as S_models_nodedriver from '@shell/models/nodedriver';
import * as S_models_persistentvolume from '@shell/models/persistentvolume';
import * as S_models_persistentvolumeclaim from '@shell/models/persistentvolumeclaim';
import * as S_models_pod from '@shell/models/pod';
import * as S_models_principal from '@shell/models/principal';
import * as S_models_projectroletemplatebinding from '@shell/models/projectroletemplatebinding';
import * as S_models_provisioning_cattle_io_cluster from '@shell/models/provisioning.cattle.io.cluster';
import * as S_models_rbac_authorization_k8s_io_clusterrole from '@shell/models/rbac.authorization.k8s.io.clusterrole';
import * as S_models_rbac_authorization_k8s_io_clusterrolebinding from '@shell/models/rbac.authorization.k8s.io.clusterrolebinding';
import * as S_models_rbac_authorization_k8s_io_role from '@shell/models/rbac.authorization.k8s.io.role';
import * as S_models_rbac_authorization_k8s_io_rolebinding from '@shell/models/rbac.authorization.k8s.io.rolebinding';
import * as S_models_replicationcontroller from '@shell/models/replicationcontroller';
import * as S_models_resources_cattle_io_backup from '@shell/models/resources.cattle.io.backup';
import * as S_models_resources_cattle_io_restore from '@shell/models/resources.cattle.io.restore';
import * as S_models_rke_machine_config_cattle_io_harvesterconfig from '@shell/models/rke-machine-config.cattle.io.harvesterconfig';
import * as S_models_rke_machine_cattle_io_amazonec2machinetemplate from '@shell/models/rke-machine.cattle.io.amazonec2machinetemplate';
import * as S_models_rke_machine_cattle_io_azuremachinetemplate from '@shell/models/rke-machine.cattle.io.azuremachinetemplate';
import * as S_models_rke_machine_cattle_io_digitaloceanmachinetemplate from '@shell/models/rke-machine.cattle.io.digitaloceanmachinetemplate';
import * as S_models_rke_machine_cattle_io_linodemachinetemplate from '@shell/models/rke-machine.cattle.io.linodemachinetemplate';
import * as S_models_rke_machine_cattle_io_machinetemplate from '@shell/models/rke-machine.cattle.io.machinetemplate';
import * as S_models_rke_machine_cattle_io_pnapmachinetemplate from '@shell/models/rke-machine.cattle.io.pnapmachinetemplate';
import * as S_models_rke_machine_cattle_io_vmwarevspheremachinetemplate from '@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate';
import * as S_models_rke_cattle_io_etcdsnapshot from '@shell/models/rke.cattle.io.etcdsnapshot';
import * as S_models_secret from '@shell/models/secret';
import * as S_models_service from '@shell/models/service';
import * as S_models_steve_schema from '@shell/models/steve-schema';
import * as S_models_storage_k8s_io_storageclass from '@shell/models/storage.k8s.io.storageclass';
import * as S_models_templates_gatekeeper_sh_constrainttemplate from '@shell/models/templates.gatekeeper.sh.constrainttemplate';
import * as S_models_token from '@shell/models/token';
import * as S_models_ui_cattle_io_navlink from '@shell/models/ui.cattle.io.navlink';
import * as S_models_workload from '@shell/models/workload';
import * as S_models_workload_service from '@shell/models/workload.service';
import * as S_promptRemove_management_cattle_io_fleetworkspace from '@shell/promptRemove/management.cattle.io.fleetworkspace';
import * as S_promptRemove_management_cattle_io_globalrole from '@shell/promptRemove/management.cattle.io.globalrole';
import * as S_promptRemove_management_cattle_io_project from '@shell/promptRemove/management.cattle.io.project';
import * as S_promptRemove_management_cattle_io_roletemplate from '@shell/promptRemove/management.cattle.io.roletemplate';
import * as S_promptRemove_mixin_roleDeletionCheck from '@shell/promptRemove/mixin/roleDeletionCheck';
import * as S_promptRemove_pod from '@shell/promptRemove/pod';
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
  ['@shell/chart/example', S_chart_example],
  ['@shell/chart/gatekeeper', S_chart_gatekeeper],
  ['@shell/chart/istio', S_chart_istio],
  ['@shell/chart/logging', S_chart_logging],
  ['@shell/chart/monitoring/ClusterSelector', S_chart_monitoring_ClusterSelector],
  ['@shell/chart/monitoring/StorageClassSelector', S_chart_monitoring_StorageClassSelector],
  ['@shell/chart/monitoring/alerting', S_chart_monitoring_alerting],
  ['@shell/chart/monitoring/grafana', S_chart_monitoring_grafana],
  ['@shell/chart/monitoring', S_chart_monitoring],
  ['@shell/chart/monitoring/prometheus', S_chart_monitoring_prometheus],
  ['@shell/chart/rancher-backup/S3', S_chart_rancher_backup_S3],
  ['@shell/chart/rancher-backup', S_chart_rancher_backup],
  ['@shell/chart/rancher-monitoring-dashboards', S_chart_rancher_monitoring_dashboards],
  ['@shell/cloud-credential/aws', S_cloud_credential_aws],
  ['@shell/cloud-credential/azure', S_cloud_credential_azure],
  ['@shell/cloud-credential/digitalocean', S_cloud_credential_digitalocean],
  ['@shell/cloud-credential/gcp', S_cloud_credential_gcp],
  ['@shell/cloud-credential/generic', S_cloud_credential_generic],
  ['@shell/cloud-credential/harvester', S_cloud_credential_harvester],
  ['@shell/cloud-credential/linode', S_cloud_credential_linode],
  ['@shell/cloud-credential/pnap', S_cloud_credential_pnap],
  ['@shell/cloud-credential/s3', S_cloud_credential_s3],
  ['@shell/cloud-credential/vmwarevsphere', S_cloud_credential_vmwarevsphere],
  ['@shell/composables/cruResource', S_composables_cruResource],
  ['@shell/composables/drawer', S_composables_drawer],
  ['@shell/composables/focusTrap', S_composables_focusTrap],
  ['@shell/composables/resourceDetail', S_composables_resourceDetail],
  ['@shell/composables/resources', S_composables_resources],
  ['@shell/composables/useClickOutside', S_composables_useClickOutside],
  ['@shell/composables/useCompactInput', S_composables_useCompactInput],
  ['@shell/composables/useFormValidation', S_composables_useFormValidation],
  ['@shell/composables/useHelmOpResources', S_composables_useHelmOpResources],
  ['@shell/composables/useI18n', S_composables_useI18n],
  ['@shell/composables/useInterval', S_composables_useInterval],
  ['@shell/composables/useIsNewDetailPageEnabled', S_composables_useIsNewDetailPageEnabled],
  ['@shell/composables/useLabeledFormElement', S_composables_useLabeledFormElement],
  ['@shell/composables/useLabeledSelect', S_composables_useLabeledSelect],
  ['@shell/composables/useRuntimeFlag', S_composables_useRuntimeFlag],
  ['@shell/composables/useStateColor', S_composables_useStateColor],
  ['@shell/composables/useUserRetentionValidation', S_composables_useUserRetentionValidation],
  ['@shell/composables/useVeeValidateField', S_composables_useVeeValidateField],
  ['@shell/detail/auditlog.cattle.io.auditpolicy', S_detail_auditlog_cattle_io_auditpolicy],
  ['@shell/detail/autoscaling.horizontalpodautoscaler', S_detail_autoscaling_horizontalpodautoscaler],
  ['@shell/detail/catalog.cattle.io.app', S_detail_catalog_cattle_io_app],
  ['@shell/detail/catalog.cattle.io.clusterrepo', S_detail_catalog_cattle_io_clusterrepo],
  ['@shell/detail/compliance.cattle.io.clusterscan', S_detail_compliance_cattle_io_clusterscan],
  ['@shell/detail/configmap', S_detail_configmap],
  ['@shell/detail/constraints.gatekeeper.sh.constraint', S_detail_constraints_gatekeeper_sh_constraint],
  ['@shell/detail/fleet.cattle.io.bundle', S_detail_fleet_cattle_io_bundle],
  ['@shell/detail/fleet.cattle.io.cluster', S_detail_fleet_cattle_io_cluster],
  ['@shell/detail/fleet.cattle.io.clustergroup', S_detail_fleet_cattle_io_clustergroup],
  ['@shell/detail/fleet.cattle.io.gitrepo', S_detail_fleet_cattle_io_gitrepo],
  ['@shell/detail/fleet.cattle.io.helmop', S_detail_fleet_cattle_io_helmop],
  ['@shell/detail/harvesterhci.io.management.cluster', S_detail_harvesterhci_io_management_cluster],
  ['@shell/detail/helm.cattle.io.projecthelmchart', S_detail_helm_cattle_io_projecthelmchart],
  ['@shell/detail/management.cattle.io.fleetworkspace', S_detail_management_cattle_io_fleetworkspace],
  ['@shell/detail/management.cattle.io.globalrole', S_detail_management_cattle_io_globalrole],
  ['@shell/detail/management.cattle.io.oidcclient', S_detail_management_cattle_io_oidcclient],
  ['@shell/detail/management.cattle.io.roletemplate', S_detail_management_cattle_io_roletemplate],
  ['@shell/detail/management.cattle.io.user', S_detail_management_cattle_io_user],
  ['@shell/detail/namespace', S_detail_namespace],
  ['@shell/detail/networking.k8s.io.ingress', S_detail_networking_k8s_io_ingress],
  ['@shell/detail/node', S_detail_node],
  ['@shell/detail/pod', S_detail_pod],
  ['@shell/detail/projectsecret', S_detail_projectsecret],
  ['@shell/detail/provisioning.cattle.io.cluster', S_detail_provisioning_cattle_io_cluster],
  ['@shell/detail/rbac.authorization.k8s.io.clusterrole', S_detail_rbac_authorization_k8s_io_clusterrole],
  ['@shell/detail/rbac.authorization.k8s.io.role', S_detail_rbac_authorization_k8s_io_role],
  ['@shell/detail/secret', S_detail_secret],
  ['@shell/detail/service', S_detail_service],
  ['@shell/detail/workload', S_detail_workload],
  ['@shell/dialog/AddClusterMemberDialog', S_dialog_AddClusterMemberDialog],
  ['@shell/dialog/AddCustomBadgeDialog', S_dialog_AddCustomBadgeDialog],
  ['@shell/dialog/AddExtensionReposDialog', S_dialog_AddExtensionReposDialog],
  ['@shell/dialog/AddProjectMemberDialog', S_dialog_AddProjectMemberDialog],
  ['@shell/dialog/AddonConfigConfirmationDialog', S_dialog_AddonConfigConfirmationDialog],
  ['@shell/dialog/AssignToDialog', S_dialog_AssignToDialog],
  ['@shell/dialog/ChangePasswordDialog', S_dialog_ChangePasswordDialog],
  ['@shell/dialog/DeactivateDriverDialog', S_dialog_DeactivateDriverDialog],
  ['@shell/dialog/DeveloperLoadExtensionDialog', S_dialog_DeveloperLoadExtensionDialog],
  ['@shell/dialog/DiagnosticTimingsDialog', S_dialog_DiagnosticTimingsDialog],
  ['@shell/dialog/DisableAuthProviderDialog', S_dialog_DisableAuthProviderDialog],
  ['@shell/dialog/DrainNode', S_dialog_DrainNode],
  ['@shell/dialog/ExtensionCatalogInstallDialog', S_dialog_ExtensionCatalogInstallDialog],
  ['@shell/dialog/ExtensionCatalogUninstallDialog', S_dialog_ExtensionCatalogUninstallDialog],
  ['@shell/dialog/FeatureFlagListDialog', S_dialog_FeatureFlagListDialog],
  ['@shell/dialog/ForceMachineRemoveDialog', S_dialog_ForceMachineRemoveDialog],
  ['@shell/dialog/GenericPrompt', S_dialog_GenericPrompt],
  ['@shell/dialog/GitRepoForceUpdateDialog', S_dialog_GitRepoForceUpdateDialog],
  ['@shell/dialog/HelmOpForceUpdateDialog', S_dialog_HelmOpForceUpdateDialog],
  ['@shell/dialog/ImportDialog', S_dialog_ImportDialog],
  ['@shell/dialog/InstallExtensionDialog', S_dialog_InstallExtensionDialog],
  ['@shell/dialog/Ipv6NetworkingDialog', S_dialog_Ipv6NetworkingDialog],
  ['@shell/dialog/KnownHostsEditDialog', S_dialog_KnownHostsEditDialog],
  ['@shell/dialog/MoveNamespaceDialog', S_dialog_MoveNamespaceDialog],
  ['@shell/dialog/OidcClientSecretDialog', S_dialog_OidcClientSecretDialog],
  ['@shell/dialog/RedeployWorkloadDialog', S_dialog_RedeployWorkloadDialog],
  ['@shell/dialog/RollbackWorkloadDialog', S_dialog_RollbackWorkloadDialog],
  ['@shell/dialog/RotateCertificatesDialog', S_dialog_RotateCertificatesDialog],
  ['@shell/dialog/RotateEncryptionKeyDialog', S_dialog_RotateEncryptionKeyDialog],
  ['@shell/dialog/ScaleMachineDownDialog', S_dialog_ScaleMachineDownDialog],
  ['@shell/dialog/ScalePoolDownDialog', S_dialog_ScalePoolDownDialog],
  ['@shell/dialog/SearchDialog', S_dialog_SearchDialog],
  ['@shell/dialog/SloDialog', S_dialog_SloDialog],
  ['@shell/dialog/UninstallExistingExtensionDialog', S_dialog_UninstallExistingExtensionDialog],
  ['@shell/dialog/UninstallExtensionDialog', S_dialog_UninstallExtensionDialog],
  ['@shell/dialog/WechatDialog', S_dialog_WechatDialog],
  ['@shell/directives/clean-html', S_directives_clean_html],
  ['@shell/directives/clean-tooltip', S_directives_clean_tooltip],
  ['@shell/directives/focus', S_directives_focus],
  ['@shell/directives/int-number', S_directives_int_number],
  ['@shell/directives/positive-int-number', S_directives_positive_int_number],
  ['@shell/directives/strip-html-aria-label', S_directives_strip_html_aria_label],
  ['@shell/directives/trim-whitespace', S_directives_trim_whitespace],
  ['@shell/directives/ui-context', S_directives_ui_context],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/AdditionalRedactions', S_edit_auditlog_cattle_io_auditpolicy_AdditionalRedactions],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/Filters', S_edit_auditlog_cattle_io_auditpolicy_Filters],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/General', S_edit_auditlog_cattle_io_auditpolicy_General],
  ['@shell/edit/auditlog.cattle.io.auditpolicy', S_edit_auditlog_cattle_io_auditpolicy],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/types', S_edit_auditlog_cattle_io_auditpolicy_types],
  ['@shell/edit/auth/AuthProviderWarningBanners', S_edit_auth_AuthProviderWarningBanners],
  ['@shell/edit/auth/azuread', S_edit_auth_azuread],
  ['@shell/edit/auth/github-app-steps', S_edit_auth_github_app_steps],
  ['@shell/edit/auth/github-steps', S_edit_auth_github_steps],
  ['@shell/edit/auth/github', S_edit_auth_github],
  ['@shell/edit/auth/googleoauth', S_edit_auth_googleoauth],
  ['@shell/edit/auth/ldap/config', S_edit_auth_ldap_config],
  ['@shell/edit/auth/ldap', S_edit_auth_ldap],
  ['@shell/edit/auth/oidc', S_edit_auth_oidc],
  ['@shell/edit/auth/saml', S_edit_auth_saml],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/external-metric', S_edit_autoscaling_horizontalpodautoscaler_external_metric],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/hpa-scaling-rule', S_edit_autoscaling_horizontalpodautoscaler_hpa_scaling_rule],
  ['@shell/edit/autoscaling.horizontalpodautoscaler', S_edit_autoscaling_horizontalpodautoscaler],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier', S_edit_autoscaling_horizontalpodautoscaler_metric_identifier],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-object-reference', S_edit_autoscaling_horizontalpodautoscaler_metric_object_reference],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-target', S_edit_autoscaling_horizontalpodautoscaler_metric_target],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row', S_edit_autoscaling_horizontalpodautoscaler_metrics_row],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/object-metric', S_edit_autoscaling_horizontalpodautoscaler_object_metric],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/pod-metric', S_edit_autoscaling_horizontalpodautoscaler_pod_metric],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric', S_edit_autoscaling_horizontalpodautoscaler_resource_metric],
  ['@shell/edit/catalog.cattle.io.clusterrepo', S_edit_catalog_cattle_io_clusterrepo],
  ['@shell/edit/cloudcredential', S_edit_cloudcredential],
  ['@shell/edit/compliance.cattle.io.clusterscan', S_edit_compliance_cattle_io_clusterscan],
  ['@shell/edit/compliance.cattle.io.clusterscanbenchmark', S_edit_compliance_cattle_io_clusterscanbenchmark],
  ['@shell/edit/compliance.cattle.io.clusterscanprofile', S_edit_compliance_cattle_io_clusterscanprofile],
  ['@shell/edit/configmap', S_edit_configmap],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/MatchKinds', S_edit_constraints_gatekeeper_sh_constraint_MatchKinds],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/NamespaceList', S_edit_constraints_gatekeeper_sh_constraint_NamespaceList],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/Scope', S_edit_constraints_gatekeeper_sh_constraint_Scope],
  ['@shell/edit/constraints.gatekeeper.sh.constraint', S_edit_constraints_gatekeeper_sh_constraint],
  ['@shell/edit/fleet.cattle.io.cluster', S_edit_fleet_cattle_io_cluster],
  ['@shell/edit/fleet.cattle.io.clustergroup', S_edit_fleet_cattle_io_clustergroup],
  ['@shell/edit/fleet.cattle.io.gitrepo', S_edit_fleet_cattle_io_gitrepo],
  ['@shell/edit/fleet.cattle.io.helmop', S_edit_fleet_cattle_io_helmop],
  ['@shell/edit/group.principal', S_edit_group_principal],
  ['@shell/edit/helm.cattle.io.projecthelmchart', S_edit_helm_cattle_io_projecthelmchart],
  ['@shell/edit/k8s.cni.cncf.io.networkattachmentdefinition', S_edit_k8s_cni_cncf_io_networkattachmentdefinition],
  ['@shell/edit/kontainerDriver', S_edit_kontainerDriver],
  ['@shell/edit/logging-flow/Match', S_edit_logging_flow_Match],
  ['@shell/edit/logging-flow', S_edit_logging_flow],
  ['@shell/edit/logging.banzaicloud.io.clusterflow', S_edit_logging_banzaicloud_io_clusterflow],
  ['@shell/edit/logging.banzaicloud.io.clusteroutput', S_edit_logging_banzaicloud_io_clusteroutput],
  ['@shell/edit/logging.banzaicloud.io.flow', S_edit_logging_banzaicloud_io_flow],
  ['@shell/edit/logging.banzaicloud.io.output', S_edit_logging_banzaicloud_io_output],
  ['@shell/edit/logging.banzaicloud.io.output/providers/awsElasticsearch', S_edit_logging_banzaicloud_io_output_providers_awsElasticsearch],
  ['@shell/edit/logging.banzaicloud.io.output/providers/azurestorage', S_edit_logging_banzaicloud_io_output_providers_azurestorage],
  ['@shell/edit/logging.banzaicloud.io.output/providers/cloudwatch', S_edit_logging_banzaicloud_io_output_providers_cloudwatch],
  ['@shell/edit/logging.banzaicloud.io.output/providers/datadog', S_edit_logging_banzaicloud_io_output_providers_datadog],
  ['@shell/edit/logging.banzaicloud.io.output/providers/elasticsearch', S_edit_logging_banzaicloud_io_output_providers_elasticsearch],
  ['@shell/edit/logging.banzaicloud.io.output/providers/file', S_edit_logging_banzaicloud_io_output_providers_file],
  ['@shell/edit/logging.banzaicloud.io.output/providers/forward', S_edit_logging_banzaicloud_io_output_providers_forward],
  ['@shell/edit/logging.banzaicloud.io.output/providers/gcs', S_edit_logging_banzaicloud_io_output_providers_gcs],
  ['@shell/edit/logging.banzaicloud.io.output/providers/gelf', S_edit_logging_banzaicloud_io_output_providers_gelf],
  ['@shell/edit/logging.banzaicloud.io.output/providers/kafka', S_edit_logging_banzaicloud_io_output_providers_kafka],
  ['@shell/edit/logging.banzaicloud.io.output/providers/kinesisStream', S_edit_logging_banzaicloud_io_output_providers_kinesisStream],
  ['@shell/edit/logging.banzaicloud.io.output/providers/logdna', S_edit_logging_banzaicloud_io_output_providers_logdna],
  ['@shell/edit/logging.banzaicloud.io.output/providers/logz', S_edit_logging_banzaicloud_io_output_providers_logz],
  ['@shell/edit/logging.banzaicloud.io.output/providers/loki', S_edit_logging_banzaicloud_io_output_providers_loki],
  ['@shell/edit/logging.banzaicloud.io.output/providers/newrelic', S_edit_logging_banzaicloud_io_output_providers_newrelic],
  ['@shell/edit/logging.banzaicloud.io.output/providers/opensearch', S_edit_logging_banzaicloud_io_output_providers_opensearch],
  ['@shell/edit/logging.banzaicloud.io.output/providers/redis', S_edit_logging_banzaicloud_io_output_providers_redis],
  ['@shell/edit/logging.banzaicloud.io.output/providers/s3', S_edit_logging_banzaicloud_io_output_providers_s3],
  ['@shell/edit/logging.banzaicloud.io.output/providers/splunkHec', S_edit_logging_banzaicloud_io_output_providers_splunkHec],
  ['@shell/edit/logging.banzaicloud.io.output/providers/sumologic', S_edit_logging_banzaicloud_io_output_providers_sumologic],
  ['@shell/edit/logging.banzaicloud.io.output/providers/syslog', S_edit_logging_banzaicloud_io_output_providers_syslog],
  ['@shell/edit/logging.banzaicloud.io.output/providers/utils', S_edit_logging_banzaicloud_io_output_providers_utils],
  ['@shell/edit/management.cattle.io.clusterroletemplatebinding', S_edit_management_cattle_io_clusterroletemplatebinding],
  ['@shell/edit/management.cattle.io.fleetworkspace', S_edit_management_cattle_io_fleetworkspace],
  ['@shell/edit/management.cattle.io.globalrole', S_edit_management_cattle_io_globalrole],
  ['@shell/edit/management.cattle.io.node', S_edit_management_cattle_io_node],
  ['@shell/edit/management.cattle.io.oidcclient', S_edit_management_cattle_io_oidcclient],
  ['@shell/edit/management.cattle.io.podsecurityadmissionconfigurationtemplate', S_edit_management_cattle_io_podsecurityadmissionconfigurationtemplate],
  ['@shell/edit/management.cattle.io.project', S_edit_management_cattle_io_project],
  ['@shell/edit/management.cattle.io.projectroletemplatebinding', S_edit_management_cattle_io_projectroletemplatebinding],
  ['@shell/edit/management.cattle.io.roletemplate', S_edit_management_cattle_io_roletemplate],
  ['@shell/edit/management.cattle.io.setting/delete-machine-on-failure-after', S_edit_management_cattle_io_setting_delete_machine_on_failure_after],
  ['@shell/edit/management.cattle.io.setting', S_edit_management_cattle_io_setting],
  ['@shell/edit/management.cattle.io.setting/system-default-registry-pull-secrets', S_edit_management_cattle_io_setting_system_default_registry_pull_secrets],
  ['@shell/edit/management.cattle.io.user', S_edit_management_cattle_io_user],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/auth', S_edit_monitoring_coreos_com_alertmanagerconfig_auth],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig', S_edit_monitoring_coreos_com_alertmanagerconfig],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig', S_edit_monitoring_coreos_com_alertmanagerconfig_receiverConfig],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/routeConfig', S_edit_monitoring_coreos_com_alertmanagerconfig_routeConfig],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/tls', S_edit_monitoring_coreos_com_alertmanagerconfig_tls],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/email', S_edit_monitoring_coreos_com_alertmanagerconfig_types_email],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie', S_edit_monitoring_coreos_com_alertmanagerconfig_types_opsgenie],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty', S_edit_monitoring_coreos_com_alertmanagerconfig_types_pagerduty],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack', S_edit_monitoring_coreos_com_alertmanagerconfig_types_slack],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/webhook', S_edit_monitoring_coreos_com_alertmanagerconfig_types_webhook],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/AlertingRule', S_edit_monitoring_coreos_com_prometheusrule_AlertingRule],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/GroupRules', S_edit_monitoring_coreos_com_prometheusrule_GroupRules],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/RecordingRule', S_edit_monitoring_coreos_com_prometheusrule_RecordingRule],
  ['@shell/edit/monitoring.coreos.com.prometheusrule', S_edit_monitoring_coreos_com_prometheusrule],
  ['@shell/edit/monitoring.coreos.com.receiver/auth', S_edit_monitoring_coreos_com_receiver_auth],
  ['@shell/edit/monitoring.coreos.com.receiver', S_edit_monitoring_coreos_com_receiver],
  ['@shell/edit/monitoring.coreos.com.receiver/tls', S_edit_monitoring_coreos_com_receiver_tls],
  ['@shell/edit/monitoring.coreos.com.receiver/types/email', S_edit_monitoring_coreos_com_receiver_types_email],
  ['@shell/edit/monitoring.coreos.com.receiver/types/opsgenie', S_edit_monitoring_coreos_com_receiver_types_opsgenie],
  ['@shell/edit/monitoring.coreos.com.receiver/types/pagerduty', S_edit_monitoring_coreos_com_receiver_types_pagerduty],
  ['@shell/edit/monitoring.coreos.com.receiver/types/slack', S_edit_monitoring_coreos_com_receiver_types_slack],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook.add', S_edit_monitoring_coreos_com_receiver_types_webhook_add],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook.banner', S_edit_monitoring_coreos_com_receiver_types_webhook_banner],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook', S_edit_monitoring_coreos_com_receiver_types_webhook],
  ['@shell/edit/monitoring.coreos.com.route', S_edit_monitoring_coreos_com_route],
  ['@shell/edit/namespace', S_edit_namespace],
  ['@shell/edit/networking.istio.io.destinationrule/LoadBalancer', S_edit_networking_istio_io_destinationrule_LoadBalancer],
  ['@shell/edit/networking.istio.io.destinationrule', S_edit_networking_istio_io_destinationrule],
  ['@shell/edit/networking.k8s.io.ingress/Certificate', S_edit_networking_k8s_io_ingress_Certificate],
  ['@shell/edit/networking.k8s.io.ingress/Certificates', S_edit_networking_k8s_io_ingress_Certificates],
  ['@shell/edit/networking.k8s.io.ingress/DefaultBackend', S_edit_networking_k8s_io_ingress_DefaultBackend],
  ['@shell/edit/networking.k8s.io.ingress/IngressClass', S_edit_networking_k8s_io_ingress_IngressClass],
  ['@shell/edit/networking.k8s.io.ingress/Rule', S_edit_networking_k8s_io_ingress_Rule],
  ['@shell/edit/networking.k8s.io.ingress/RulePath', S_edit_networking_k8s_io_ingress_RulePath],
  ['@shell/edit/networking.k8s.io.ingress/Rules', S_edit_networking_k8s_io_ingress_Rules],
  ['@shell/edit/networking.k8s.io.ingress', S_edit_networking_k8s_io_ingress],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRule', S_edit_networking_k8s_io_networkpolicy_PolicyRule],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRulePort', S_edit_networking_k8s_io_networkpolicy_PolicyRulePort],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget', S_edit_networking_k8s_io_networkpolicy_PolicyRuleTarget],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRules', S_edit_networking_k8s_io_networkpolicy_PolicyRules],
  ['@shell/edit/networking.k8s.io.networkpolicy', S_edit_networking_k8s_io_networkpolicy],
  ['@shell/edit/node', S_edit_node],
  ['@shell/edit/nodeDriver', S_edit_nodeDriver],
  ['@shell/edit/persistentvolume', S_edit_persistentvolume],
  ['@shell/edit/persistentvolume/plugins/awsElasticBlockStore', S_edit_persistentvolume_plugins_awsElasticBlockStore],
  ['@shell/edit/persistentvolume/plugins/azureDisk', S_edit_persistentvolume_plugins_azureDisk],
  ['@shell/edit/persistentvolume/plugins/azureFile', S_edit_persistentvolume_plugins_azureFile],
  ['@shell/edit/persistentvolume/plugins/cephfs', S_edit_persistentvolume_plugins_cephfs],
  ['@shell/edit/persistentvolume/plugins/cinder', S_edit_persistentvolume_plugins_cinder],
  ['@shell/edit/persistentvolume/plugins/csi', S_edit_persistentvolume_plugins_csi],
  ['@shell/edit/persistentvolume/plugins/fc', S_edit_persistentvolume_plugins_fc],
  ['@shell/edit/persistentvolume/plugins/flexVolume', S_edit_persistentvolume_plugins_flexVolume],
  ['@shell/edit/persistentvolume/plugins/flocker', S_edit_persistentvolume_plugins_flocker],
  ['@shell/edit/persistentvolume/plugins/gcePersistentDisk', S_edit_persistentvolume_plugins_gcePersistentDisk],
  ['@shell/edit/persistentvolume/plugins/glusterfs', S_edit_persistentvolume_plugins_glusterfs],
  ['@shell/edit/persistentvolume/plugins/hostPath', S_edit_persistentvolume_plugins_hostPath],
  ['@shell/edit/persistentvolume/plugins/iscsi', S_edit_persistentvolume_plugins_iscsi],
  ['@shell/edit/persistentvolume/plugins/local', S_edit_persistentvolume_plugins_local],
  ['@shell/edit/persistentvolume/plugins/longhorn', S_edit_persistentvolume_plugins_longhorn],
  ['@shell/edit/persistentvolume/plugins/nfs', S_edit_persistentvolume_plugins_nfs],
  ['@shell/edit/persistentvolume/plugins/photonPersistentDisk', S_edit_persistentvolume_plugins_photonPersistentDisk],
  ['@shell/edit/persistentvolume/plugins/portworxVolume', S_edit_persistentvolume_plugins_portworxVolume],
  ['@shell/edit/persistentvolume/plugins/quobyte', S_edit_persistentvolume_plugins_quobyte],
  ['@shell/edit/persistentvolume/plugins/rbd', S_edit_persistentvolume_plugins_rbd],
  ['@shell/edit/persistentvolume/plugins/scaleIO', S_edit_persistentvolume_plugins_scaleIO],
  ['@shell/edit/persistentvolume/plugins/storageos', S_edit_persistentvolume_plugins_storageos],
  ['@shell/edit/persistentvolume/plugins/vsphereVolume', S_edit_persistentvolume_plugins_vsphereVolume],
  ['@shell/edit/persistentvolumeclaim', S_edit_persistentvolumeclaim],
  ['@shell/edit/pod', S_edit_pod],
  ['@shell/edit/policy.poddisruptionbudget', S_edit_policy_poddisruptionbudget],
  ['@shell/edit/projectsecret', S_edit_projectsecret],
  ['@shell/edit/provisioning.cattle.io.cluster/AgentEnv', S_edit_provisioning_cattle_io_cluster_AgentEnv],
  ['@shell/edit/provisioning.cattle.io.cluster/CustomCommand', S_edit_provisioning_cattle_io_cluster_CustomCommand],
  ['@shell/edit/provisioning.cattle.io.cluster/Labels', S_edit_provisioning_cattle_io_cluster_Labels],
  ['@shell/edit/provisioning.cattle.io.cluster/SelectCredential', S_edit_provisioning_cattle_io_cluster_SelectCredential],
  ['@shell/edit/provisioning.cattle.io.cluster', S_edit_provisioning_cattle_io_cluster],
  ['@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards', S_edit_provisioning_cattle_io_cluster_ingress_IngressCards],
  ['@shell/edit/provisioning.cattle.io.cluster/ingress/IngressConfiguration', S_edit_provisioning_cattle_io_cluster_ingress_IngressConfiguration],
  ['@shell/edit/provisioning.cattle.io.cluster/rke2', S_edit_provisioning_cattle_io_cluster_rke2],
  ['@shell/edit/provisioning.cattle.io.cluster/shared', S_edit_provisioning_cattle_io_cluster_shared],
  ['@shell/edit/provisioning.cattle.io.cluster/subtype-detection', S_edit_provisioning_cattle_io_cluster_subtype_detection],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest', S_edit_provisioning_cattle_io_cluster_tabs_AddOnAdditionalManifest],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig', S_edit_provisioning_cattle_io_cluster_tabs_AddOnConfig],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced', S_edit_provisioning_cattle_io_cluster_tabs_Advanced],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration', S_edit_provisioning_cattle_io_cluster_tabs_AgentConfiguration],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/Basics', S_edit_provisioning_cattle_io_cluster_tabs_Basics],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig', S_edit_provisioning_cattle_io_cluster_tabs_DirectoryConfig],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/Ingress', S_edit_provisioning_cattle_io_cluster_tabs_Ingress],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool', S_edit_provisioning_cattle_io_cluster_tabs_MachinePool],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles', S_edit_provisioning_cattle_io_cluster_tabs_MemberRoles],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config', S_edit_provisioning_cattle_io_cluster_tabs_etcd_S3Config],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/etcd', S_edit_provisioning_cattle_io_cluster_tabs_etcd],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE', S_edit_provisioning_cattle_io_cluster_tabs_networking_ACE],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/networking', S_edit_provisioning_cattle_io_cluster_tabs_networking],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs', S_edit_provisioning_cattle_io_cluster_tabs_registries_RegistryConfigs],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors', S_edit_provisioning_cattle_io_cluster_tabs_registries_RegistryMirrors],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries', S_edit_provisioning_cattle_io_cluster_tabs_registries],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions', S_edit_provisioning_cattle_io_cluster_tabs_upgrade_DrainOptions],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade', S_edit_provisioning_cattle_io_cluster_tabs_upgrade],
  ['@shell/edit/rbac.authorization.k8s.io.clusterrole', S_edit_rbac_authorization_k8s_io_clusterrole],
  ['@shell/edit/rbac.authorization.k8s.io.role', S_edit_rbac_authorization_k8s_io_role],
  ['@shell/edit/resources.cattle.io.backup', S_edit_resources_cattle_io_backup],
  ['@shell/edit/resources.cattle.io.restore', S_edit_resources_cattle_io_restore],
  ['@shell/edit/secret/basic', S_edit_secret_basic],
  ['@shell/edit/secret/generic', S_edit_secret_generic],
  ['@shell/edit/secret', S_edit_secret],
  ['@shell/edit/secret/registry', S_edit_secret_registry],
  ['@shell/edit/secret/ssh', S_edit_secret_ssh],
  ['@shell/edit/secret/tls', S_edit_secret_tls],
  ['@shell/edit/service', S_edit_service],
  ['@shell/edit/serviceaccount', S_edit_serviceaccount],
  ['@shell/edit/storage.k8s.io.storageclass', S_edit_storage_k8s_io_storageclass],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/custom', S_edit_storage_k8s_io_storageclass_provisioners_custom],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/driver.harvesterhci.io', S_edit_storage_k8s_io_storageclass_provisioners_driver_harvesterhci_io],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/driver.longhorn.io', S_edit_storage_k8s_io_storageclass_provisioners_driver_longhorn_io],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/aws-ebs', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_aws_ebs],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-disk', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_azure_disk],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-file', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_azure_file],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/cinder', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_cinder],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/gce-pd', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_gce_pd],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/glusterfs', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_glusterfs],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/no-provisioner', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_no_provisioner],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/portworx-volume', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_portworx_volume],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/quobyte', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_quobyte],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/rbd', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_rbd],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/scaleio', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_scaleio],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/storageos', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_storageos],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/vsphere-volume', S_edit_storage_k8s_io_storageclass_provisioners_kubernetes_io_vsphere_volume],
  ['@shell/edit/token', S_edit_token],
  ['@shell/edit/ui.cattle.io.navlink', S_edit_ui_cattle_io_navlink],
  ['@shell/edit/workload/Job', S_edit_workload_Job],
  ['@shell/edit/workload/Upgrading', S_edit_workload_Upgrading],
  ['@shell/edit/workload/VolumeClaimTemplate', S_edit_workload_VolumeClaimTemplate],
  ['@shell/edit/workload', S_edit_workload],
  ['@shell/edit/workload/mixins/workload', S_edit_workload_mixins_workload],
  ['@shell/edit/workload/storage/ContainerMountPaths', S_edit_workload_storage_ContainerMountPaths],
  ['@shell/edit/workload/storage/Mount', S_edit_workload_storage_Mount],
  ['@shell/edit/workload/storage/awsElasticBlockStore', S_edit_workload_storage_awsElasticBlockStore],
  ['@shell/edit/workload/storage/azureDisk', S_edit_workload_storage_azureDisk],
  ['@shell/edit/workload/storage/azureFile', S_edit_workload_storage_azureFile],
  ['@shell/edit/workload/storage/csi/driver.longhorn.io', S_edit_workload_storage_csi_driver_longhorn_io],
  ['@shell/edit/workload/storage/csi', S_edit_workload_storage_csi],
  ['@shell/edit/workload/storage/emptyDir', S_edit_workload_storage_emptyDir],
  ['@shell/edit/workload/storage/ephemeralVolume', S_edit_workload_storage_ephemeralVolume],
  ['@shell/edit/workload/storage/gcePersistentDisk', S_edit_workload_storage_gcePersistentDisk],
  ['@shell/edit/workload/storage/hostPath', S_edit_workload_storage_hostPath],
  ['@shell/edit/workload/storage', S_edit_workload_storage],
  ['@shell/edit/workload/storage/nfs', S_edit_workload_storage_nfs],
  ['@shell/edit/workload/storage/persistentVolumeClaim', S_edit_workload_storage_persistentVolumeClaim],
  ['@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim', S_edit_workload_storage_persistentVolumeClaim_persistentvolumeclaim],
  ['@shell/edit/workload/storage/secret', S_edit_workload_storage_secret],
  ['@shell/edit/workload/storage/vsphereVolume', S_edit_workload_storage_vsphereVolume],
  ['@shell/list/auditlog.cattle.io.auditpolicy', S_list_auditlog_cattle_io_auditpolicy],
  ['@shell/list/catalog.cattle.io.app', S_list_catalog_cattle_io_app],
  ['@shell/list/catalog.cattle.io.clusterrepo', S_list_catalog_cattle_io_clusterrepo],
  ['@shell/list/compliance.cattle.io.clusterscan', S_list_compliance_cattle_io_clusterscan],
  ['@shell/list/ext.cattle.io.kubeconfig', S_list_ext_cattle_io_kubeconfig],
  ['@shell/list/fleet.cattle.io.bundle', S_list_fleet_cattle_io_bundle],
  ['@shell/list/fleet.cattle.io.cluster', S_list_fleet_cattle_io_cluster],
  ['@shell/list/fleet.cattle.io.clustergroup', S_list_fleet_cattle_io_clustergroup],
  ['@shell/list/fleet.cattle.io.clusterregistrationtoken', S_list_fleet_cattle_io_clusterregistrationtoken],
  ['@shell/list/fleet.cattle.io.gitrepo', S_list_fleet_cattle_io_gitrepo],
  ['@shell/list/fleet.cattle.io.helmop', S_list_fleet_cattle_io_helmop],
  ['@shell/list/group.principal', S_list_group_principal],
  ['@shell/list/harvesterhci.io.management.cluster', S_list_harvesterhci_io_management_cluster],
  ['@shell/list/helm.cattle.io.projecthelmchart', S_list_helm_cattle_io_projecthelmchart],
  ['@shell/list/logging.banzaicloud.io.clusterflow', S_list_logging_banzaicloud_io_clusterflow],
  ['@shell/list/logging.banzaicloud.io.flow', S_list_logging_banzaicloud_io_flow],
  ['@shell/list/management.cattle.io.cluster', S_list_management_cattle_io_cluster],
  ['@shell/list/management.cattle.io.feature', S_list_management_cattle_io_feature],
  ['@shell/list/management.cattle.io.fleetworkspace', S_list_management_cattle_io_fleetworkspace],
  ['@shell/list/management.cattle.io.oidcclient', S_list_management_cattle_io_oidcclient],
  ['@shell/list/management.cattle.io.podsecurityadmissionconfigurationtemplate', S_list_management_cattle_io_podsecurityadmissionconfigurationtemplate],
  ['@shell/list/management.cattle.io.setting', S_list_management_cattle_io_setting],
  ['@shell/list/management.cattle.io.user', S_list_management_cattle_io_user],
  ['@shell/list/monitoring.coreos.com.alertmanagerconfig', S_list_monitoring_coreos_com_alertmanagerconfig],
  ['@shell/list/namespace', S_list_namespace],
  ['@shell/list/networking.k8s.io.ingress', S_list_networking_k8s_io_ingress],
  ['@shell/list/node', S_list_node],
  ['@shell/list/persistentvolume', S_list_persistentvolume],
  ['@shell/list/persistentvolumeclaim', S_list_persistentvolumeclaim],
  ['@shell/list/projectsecret', S_list_projectsecret],
  ['@shell/list/provisioning.cattle.io.cluster', S_list_provisioning_cattle_io_cluster],
  ['@shell/list/rbac.authorization.k8s.io.clusterrolebinding', S_list_rbac_authorization_k8s_io_clusterrolebinding],
  ['@shell/list/secret', S_list_secret],
  ['@shell/list/service', S_list_service],
  ['@shell/list/ui.cattle.io.navlink', S_list_ui_cattle_io_navlink],
  ['@shell/list/utils/management.cattle.io.cluster.utils', S_list_utils_management_cattle_io_cluster_utils],
  ['@shell/list/workload', S_list_workload],
  ['@shell/machine-config/amazonec2', S_machine_config_amazonec2],
  ['@shell/machine-config/azure', S_machine_config_azure],
  ['@shell/machine-config/components/EC2Networking', S_machine_config_components_EC2Networking],
  ['@shell/machine-config/components/GCEImage', S_machine_config_components_GCEImage],
  ['@shell/machine-config/digitalocean', S_machine_config_digitalocean],
  ['@shell/machine-config/generic', S_machine_config_generic],
  ['@shell/machine-config/google', S_machine_config_google],
  ['@shell/machine-config/linode', S_machine_config_linode],
  ['@shell/machine-config/pnap', S_machine_config_pnap],
  ['@shell/machine-config/vmwarevsphere-config', S_machine_config_vmwarevsphere_config],
  ['@shell/machine-config/vmwarevsphere', S_machine_config_vmwarevsphere],
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
  ['@shell/models/apiextensions.k8s.io.customresourcedefinition', S_models_apiextensions_k8s_io_customresourcedefinition],
  ['@shell/models/app', S_models_app],
  ['@shell/models/apps.controllerrevision', S_models_apps_controllerrevision],
  ['@shell/models/apps.daemonset', S_models_apps_daemonset],
  ['@shell/models/apps.deployment', S_models_apps_deployment],
  ['@shell/models/apps.replicaset', S_models_apps_replicaset],
  ['@shell/models/apps.statefulset', S_models_apps_statefulset],
  ['@shell/models/auditlog.cattle.io.auditpolicy', S_models_auditlog_cattle_io_auditpolicy],
  ['@shell/models/autoscaling.horizontalpodautoscaler', S_models_autoscaling_horizontalpodautoscaler],
  ['@shell/models/base-cluster.x-k8s.io', S_models_base_cluster_x_k8s_io],
  ['@shell/models/batch.cronjob', S_models_batch_cronjob],
  ['@shell/models/batch.job', S_models_batch_job],
  ['@shell/models/catalog.cattle.io.app', S_models_catalog_cattle_io_app],
  ['@shell/models/catalog.cattle.io.clusterrepo', S_models_catalog_cattle_io_clusterrepo],
  ['@shell/models/catalog.cattle.io.operation', S_models_catalog_cattle_io_operation],
  ['@shell/models/catalog.cattle.io.repo', S_models_catalog_cattle_io_repo],
  ['@shell/models/catalog.cattle.io.uiplugin', S_models_catalog_cattle_io_uiplugin],
  ['@shell/models/chart', S_models_chart],
  ['@shell/models/chartinstallaction', S_models_chartinstallaction],
  ['@shell/models/chartupgradeaction', S_models_chartupgradeaction],
  ['@shell/models/cloudcredential', S_models_cloudcredential],
  ['@shell/models/cluster', S_models_cluster],
  ['@shell/models/cluster.x-k8s.io.machine', S_models_cluster_x_k8s_io_machine],
  ['@shell/models/cluster.x-k8s.io.machinedeployment', S_models_cluster_x_k8s_io_machinedeployment],
  ['@shell/models/cluster.x-k8s.io.machineset', S_models_cluster_x_k8s_io_machineset],
  ['@shell/models/cluster/node', S_models_cluster_node],
  ['@shell/models/cluster/schema', S_models_cluster_schema],
  ['@shell/models/clusterroletemplatebinding', S_models_clusterroletemplatebinding],
  ['@shell/models/compliance.cattle.io.clusterscan', S_models_compliance_cattle_io_clusterscan],
  ['@shell/models/compliance.cattle.io.clusterscanbenchmark', S_models_compliance_cattle_io_clusterscanbenchmark],
  ['@shell/models/compliance.cattle.io.clusterscanprofile', S_models_compliance_cattle_io_clusterscanprofile],
  ['@shell/models/compliance.cattle.io.clusterscanreport', S_models_compliance_cattle_io_clusterscanreport],
  ['@shell/models/configmap', S_models_configmap],
  ['@shell/models/constraints.gatekeeper.sh.constraint', S_models_constraints_gatekeeper_sh_constraint],
  ['@shell/models/driver', S_models_driver],
  ['@shell/models/event', S_models_event],
  ['@shell/models/ext.cattle.io.groupmembershiprefreshrequest', S_models_ext_cattle_io_groupmembershiprefreshrequest],
  ['@shell/models/ext.cattle.io.kubeconfig', S_models_ext_cattle_io_kubeconfig],
  ['@shell/models/ext.cattle.io.passwordchangerequest', S_models_ext_cattle_io_passwordchangerequest],
  ['@shell/models/ext.cattle.io.selfuser', S_models_ext_cattle_io_selfuser],
  ['@shell/models/fleet-application', S_models_fleet_application],
  ['@shell/models/fleet.cattle.io.bundle', S_models_fleet_cattle_io_bundle],
  ['@shell/models/fleet.cattle.io.cluster', S_models_fleet_cattle_io_cluster],
  ['@shell/models/fleet.cattle.io.clustergroup', S_models_fleet_cattle_io_clustergroup],
  ['@shell/models/fleet.cattle.io.clusterregistrationtoken', S_models_fleet_cattle_io_clusterregistrationtoken],
  ['@shell/models/fleet.cattle.io.gitrepo', S_models_fleet_cattle_io_gitrepo],
  ['@shell/models/fleet.cattle.io.helmop', S_models_fleet_cattle_io_helmop],
  ['@shell/models/group.principal', S_models_group_principal],
  ['@shell/models/helm.cattle.io.projecthelmchart', S_models_helm_cattle_io_projecthelmchart],
  ['@shell/models/k8s.cni.cncf.io.networkattachmentdefinition', S_models_k8s_cni_cncf_io_networkattachmentdefinition],
  ['@shell/models/kontainerdriver', S_models_kontainerdriver],
  ['@shell/models/logging.banzaicloud.io.clusterflow', S_models_logging_banzaicloud_io_clusterflow],
  ['@shell/models/logging.banzaicloud.io.clusteroutput', S_models_logging_banzaicloud_io_clusteroutput],
  ['@shell/models/logging.banzaicloud.io.flow', S_models_logging_banzaicloud_io_flow],
  ['@shell/models/logging.banzaicloud.io.output', S_models_logging_banzaicloud_io_output],
  ['@shell/models/management.cattle.io.authconfig', S_models_management_cattle_io_authconfig],
  ['@shell/models/management.cattle.io.cluster', S_models_management_cattle_io_cluster],
  ['@shell/models/management.cattle.io.clusterroletemplatebinding', S_models_management_cattle_io_clusterroletemplatebinding],
  ['@shell/models/management.cattle.io.feature', S_models_management_cattle_io_feature],
  ['@shell/models/management.cattle.io.fleetworkspace', S_models_management_cattle_io_fleetworkspace],
  ['@shell/models/management.cattle.io.gitreporestriction', S_models_management_cattle_io_gitreporestriction],
  ['@shell/models/management.cattle.io.globalrole', S_models_management_cattle_io_globalrole],
  ['@shell/models/management.cattle.io.globalrolebinding', S_models_management_cattle_io_globalrolebinding],
  ['@shell/models/management.cattle.io.kontainerdriver', S_models_management_cattle_io_kontainerdriver],
  ['@shell/models/management.cattle.io.node', S_models_management_cattle_io_node],
  ['@shell/models/management.cattle.io.nodepool', S_models_management_cattle_io_nodepool],
  ['@shell/models/management.cattle.io.nodetemplate', S_models_management_cattle_io_nodetemplate],
  ['@shell/models/management.cattle.io.oidcclient', S_models_management_cattle_io_oidcclient],
  ['@shell/models/management.cattle.io.podsecurityadmissionconfigurationtemplate', S_models_management_cattle_io_podsecurityadmissionconfigurationtemplate],
  ['@shell/models/management.cattle.io.project', S_models_management_cattle_io_project],
  ['@shell/models/management.cattle.io.projectroletemplatebinding', S_models_management_cattle_io_projectroletemplatebinding],
  ['@shell/models/management.cattle.io.registration', S_models_management_cattle_io_registration],
  ['@shell/models/management.cattle.io.roletemplate', S_models_management_cattle_io_roletemplate],
  ['@shell/models/management.cattle.io.setting', S_models_management_cattle_io_setting],
  ['@shell/models/management.cattle.io.user', S_models_management_cattle_io_user],
  ['@shell/models/management/schema', S_models_management_schema],
  ['@shell/models/metrics.k8s.io.nodemetrics', S_models_metrics_k8s_io_nodemetrics],
  ['@shell/models/monitoring.coreos.com.alertmanagerconfig', S_models_monitoring_coreos_com_alertmanagerconfig],
  ['@shell/models/monitoring.coreos.com.podmonitor', S_models_monitoring_coreos_com_podmonitor],
  ['@shell/models/monitoring.coreos.com.prometheusrule', S_models_monitoring_coreos_com_prometheusrule],
  ['@shell/models/monitoring.coreos.com.receiver', S_models_monitoring_coreos_com_receiver],
  ['@shell/models/monitoring.coreos.com.servicemonitor', S_models_monitoring_coreos_com_servicemonitor],
  ['@shell/models/networking.istio.io.destinationrule', S_models_networking_istio_io_destinationrule],
  ['@shell/models/networking.k8s.io.ingress', S_models_networking_k8s_io_ingress],
  ['@shell/models/nodedriver', S_models_nodedriver],
  ['@shell/models/persistentvolume', S_models_persistentvolume],
  ['@shell/models/persistentvolumeclaim', S_models_persistentvolumeclaim],
  ['@shell/models/pod', S_models_pod],
  ['@shell/models/principal', S_models_principal],
  ['@shell/models/projectroletemplatebinding', S_models_projectroletemplatebinding],
  ['@shell/models/provisioning.cattle.io.cluster', S_models_provisioning_cattle_io_cluster],
  ['@shell/models/rbac.authorization.k8s.io.clusterrole', S_models_rbac_authorization_k8s_io_clusterrole],
  ['@shell/models/rbac.authorization.k8s.io.clusterrolebinding', S_models_rbac_authorization_k8s_io_clusterrolebinding],
  ['@shell/models/rbac.authorization.k8s.io.role', S_models_rbac_authorization_k8s_io_role],
  ['@shell/models/rbac.authorization.k8s.io.rolebinding', S_models_rbac_authorization_k8s_io_rolebinding],
  ['@shell/models/replicationcontroller', S_models_replicationcontroller],
  ['@shell/models/resources.cattle.io.backup', S_models_resources_cattle_io_backup],
  ['@shell/models/resources.cattle.io.restore', S_models_resources_cattle_io_restore],
  ['@shell/models/rke-machine-config.cattle.io.harvesterconfig', S_models_rke_machine_config_cattle_io_harvesterconfig],
  ['@shell/models/rke-machine.cattle.io.amazonec2machinetemplate', S_models_rke_machine_cattle_io_amazonec2machinetemplate],
  ['@shell/models/rke-machine.cattle.io.azuremachinetemplate', S_models_rke_machine_cattle_io_azuremachinetemplate],
  ['@shell/models/rke-machine.cattle.io.digitaloceanmachinetemplate', S_models_rke_machine_cattle_io_digitaloceanmachinetemplate],
  ['@shell/models/rke-machine.cattle.io.linodemachinetemplate', S_models_rke_machine_cattle_io_linodemachinetemplate],
  ['@shell/models/rke-machine.cattle.io.machinetemplate', S_models_rke_machine_cattle_io_machinetemplate],
  ['@shell/models/rke-machine.cattle.io.pnapmachinetemplate', S_models_rke_machine_cattle_io_pnapmachinetemplate],
  ['@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate', S_models_rke_machine_cattle_io_vmwarevspheremachinetemplate],
  ['@shell/models/rke.cattle.io.etcdsnapshot', S_models_rke_cattle_io_etcdsnapshot],
  ['@shell/models/secret', S_models_secret],
  ['@shell/models/service', S_models_service],
  ['@shell/models/steve-schema', S_models_steve_schema],
  ['@shell/models/storage.k8s.io.storageclass', S_models_storage_k8s_io_storageclass],
  ['@shell/models/templates.gatekeeper.sh.constrainttemplate', S_models_templates_gatekeeper_sh_constrainttemplate],
  ['@shell/models/token', S_models_token],
  ['@shell/models/ui.cattle.io.navlink', S_models_ui_cattle_io_navlink],
  ['@shell/models/workload', S_models_workload],
  ['@shell/models/workload.service', S_models_workload_service],
  ['@shell/promptRemove/management.cattle.io.fleetworkspace', S_promptRemove_management_cattle_io_fleetworkspace],
  ['@shell/promptRemove/management.cattle.io.globalrole', S_promptRemove_management_cattle_io_globalrole],
  ['@shell/promptRemove/management.cattle.io.project', S_promptRemove_management_cattle_io_project],
  ['@shell/promptRemove/management.cattle.io.roletemplate', S_promptRemove_management_cattle_io_roletemplate],
  ['@shell/promptRemove/mixin/roleDeletionCheck', S_promptRemove_mixin_roleDeletionCheck],
  ['@shell/promptRemove/pod', S_promptRemove_pod],
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
