import Deployment from '@shell/models/apps.deployment';
import { WORKLOAD_TYPES } from '@shell/config/types';

describe('class Deployment', () => {
  describe('replicaSetId', () => {
    it.each([{
      relationships: [],
      expected:      undefined,
    }, {
      relationships: [{
        rel:    'owner',
        toType: WORKLOAD_TYPES.REPLICA_SET,
        toId:   'rel-id'
      }],
      expected: 'rel-id',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-2',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'Another message without replicas count'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }])('replicaSetId', ({ relationships, expected }) => {
      const deploymentData = {
        id:       'any-id',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:      'any-name',
          namespace: 'any-namespace',
          uid:       'any-uid',
          relationships,
        },
      };

      const deployment = new Deployment(deploymentData);

      expect(deployment.replicaSetId).toStrictEqual(expected);
    });
  });

  describe('deployedTimestamp', () => {
    const creationTimestamp = '2020-01-01T00:00:00Z';

    it.each([{
      conditions: undefined,
      expected:   creationTimestamp,
    }, {
      conditions: [{ type: 'Available', lastUpdateTime: '2021-01-01T00:00:00Z' }],
      expected:   creationTimestamp,
    }, {
      conditions: [{ type: 'Available', lastUpdateTime: '2021-01-01T00:00:00Z' }, { type: 'Progressing', lastUpdateTime: '2021-06-15T12:00:00Z' }],
      expected:   '2021-06-15T12:00:00Z',
    }])('should return the last Progressing update, falling back to creation', ({ conditions, expected }) => {
      const deployment = new Deployment({
        id:       'any-id',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:      'any-name',
          namespace: 'any-namespace',
          uid:       'any-uid',
          creationTimestamp,
        },
        status: { conditions },
      });

      expect(deployment.deployedTimestamp).toStrictEqual(expected);
    });
  });
});
