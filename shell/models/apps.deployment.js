import { WORKLOAD_TYPES } from '@shell/config/types';
import Workload from './workload';

const IGNORED_ANNOTATIONS = [
  'kubectl.kubernetes.io/last-applied-configuration',
  'deployment.kubernetes.io/revision',
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
];

const replicasRegEx = /Replicas: (\d+)/;

export default class Deployment extends Workload {
  get replicaSetId() {
    const relationships = this.metadata?.relationships || [];

    // Find all relevant ReplicaSet relationships
    const replicaSetRelationships = relationships.filter((relationship) => relationship.rel === 'owner' && relationship.toType === WORKLOAD_TYPES.REPLICA_SET
    );

    // Filter the ReplicaSets based on replicas > 0
    const activeReplicaSet = replicaSetRelationships.find((relationship) => {
      const replicasMatch = relationship.message?.match(replicasRegEx);
      const replicas = replicasMatch ? parseInt(replicasMatch[1], 10) : 0;

      return replicas > 0;
    });

    // If no active ReplicaSet is found, fall back to the first one from the list
    const selectedReplicaSet = activeReplicaSet || replicaSetRelationships[0];

    return selectedReplicaSet?.toId?.replace(`${ this.namespace }/`, '');
  }

  get deployedTimestamp() {
    // The Progressing condition is only touched when a roll-out starts or completes (new image, redeploy,
    // rollback), not on a plain scale, so its last update is when the current revision was deployed
    const progressing = (this.status?.conditions || []).find((c) => c.type === 'Progressing');

    return progressing?.lastUpdateTime || this.creationTimestamp;
  }

  async rollBack(cluster, deployment, revision) {
    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: {
            creationTimestamp: null,
            labels:            Object.keys(revision.spec.template.metadata?.labels || {}).reduce((prev, key) => {
              if (key !== 'pod-template-hash') {
                prev[key] = revision.spec.template.metadata.labels[key];
              }

              return prev;
            }, {}),
            annotations: Object.keys(revision.spec.template.metadata?.annotations || {}).reduce((prev, key) => {
              if (!IGNORED_ANNOTATIONS.includes(key)) {
                prev[key] = revision.spec.template.metadata.annotations[key];
              }

              return prev;
            }, {}),
          },
          spec: revision.spec.template.spec
        }
      }, {
        op:    'replace',
        path:  '/metadata/annotations',
        value: { 'deployment.kubernetes.io/revision': revision.metadata.annotations['deployment.kubernetes.io/revision'] }
      }
    ];

    await this.rollBackWorkload(cluster, deployment, 'deployments', body);
  }
}
