import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';

/**
 * Monaco migration (spike): central Monaco setup for the YAML editor.
 *
 * Workers (editor.worker + monaco-yaml yaml.worker) are bundled and wired via
 * MonacoWebpackPlugin in shell/vue.config.js, so MonacoEnvironment is injected at
 * build time — no import.meta worker plumbing is needed here.
 *
 * This module configures monaco-yaml with a Kubernetes JSON schema so the editor
 * gets real IntelliSense: field autocomplete, hover docs, and type validation for
 * the common apiVersion/kind/metadata structure. This is the capability the old
 * CodeMirror 5 editor never had (it only did js-yaml parse-error linting).
 *
 * TODO(monaco): resolve the per-resource CRD schema from the Steve API and set it
 * per model (fileMatch by kind) instead of one generic resource schema.
 */

// A generic Kubernetes resource schema. additionalProperties stays open at the top
// level so fields for arbitrary kinds aren't spuriously flagged; the value comes from
// required apiVersion/kind + typed, documented metadata.* for completion/hover.
const KUBERNETES_RESOURCE_SCHEMA = {
  $id:         'https://rancher/kubernetes-resource.json',
  title:       'Kubernetes resource',
  type:        'object',
  required:    ['apiVersion', 'kind'],
  properties:  {
    apiVersion: {
      type:        'string',
      description: 'APIVersion defines the versioned schema of this representation of an object. Example: "v1", "apps/v1", "batch/v1".'
    },
    kind: {
      type:        'string',
      description: 'Kind is a string value representing the REST resource this object represents. Example: "ConfigMap", "Deployment", "Service".'
    },
    metadata: {
      type:        'object',
      description: 'Standard object metadata.',
      properties:  {
        name:      { type: 'string', description: 'Name must be unique within a namespace. Required when creating resources.' },
        namespace: { type: 'string', description: 'Namespace defines the space within which each name must be unique.' },
        labels:    {
          type:                 'object',
          description:          'Map of string keys and values used to organize and categorize objects. Values must be strings.',
          additionalProperties: { type: 'string' }
        },
        annotations: {
          type:                 'object',
          description:          'Unstructured key/value map stored with a resource. Values must be strings.',
          additionalProperties: { type: 'string' }
        }
      },
      additionalProperties: true
    },
    spec:       { type: 'object', description: 'Spec defines the desired state of the object.' },
    data:       { type: 'object', description: 'ConfigMap/Secret string data map.' },
    stringData: { type: 'object', description: 'Secret stringData — write-only convenience for non-binary secret data.' }
  },
  additionalProperties: true
};

let configured = false;

/** Configure monaco-yaml once (schemas + validation/hover/completion). */
export function setupMonacoYaml() {
  if (configured) {
    return;
  }
  configured = true;

  configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    validate:            true,
    hover:               true,
    completion:          true,
    format:              true,
    schemas:             [{
      uri:       'https://rancher/kubernetes-resource.json',
      fileMatch: ['*.yaml', '*'],
      schema:    KUBERNETES_RESOURCE_SCHEMA
    }]
  });
}

// Unique in-memory model URIs so multiple editors on one page don't collide and so
// the .yaml suffix matches monaco-yaml's fileMatch.
let modelSeq = 0;
export function nextModelUri() {
  modelSeq += 1;

  return monaco.Uri.parse(`inmemory://model/cm-${ modelSeq }.yaml`);
}

export { monaco };
