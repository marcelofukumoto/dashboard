import { podAffinity } from '@shell/utils/validators/pod-affinity';
import { createErrors, createMockGetters } from './helpers';

describe('validators/pod-affinity', () => {
  describe('podAffinity', () => {
    it('should return without error when spec is null', () => {
      const errors = createErrors();

      podAffinity(null, createMockGetters(), errors);
      expect(errors).toStrictEqual([]);
    });

    it('should return without error when spec is undefined', () => {
      const errors = createErrors();

      podAffinity(undefined, createMockGetters(), errors);
      expect(errors).toStrictEqual([]);
    });

    it('should return without error when spec has no affinity fields', () => {
      const errors = createErrors();

      podAffinity({}, createMockGetters(), errors);
      expect(errors).toStrictEqual([]);
    });

    describe('podAffinity preferred terms', () => {
      it('should not push an error for a valid preferred affinity term', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: { matchExpressions: [{ operator: 'In', values: ['web'] }] },
                },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors).toStrictEqual([]);
      });

      it('should push an error when weight is out of range (> 100)', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          150,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });

      it('should push an error when weight is out of range (< 1)', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          0,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });

      it('should push an error when topologyKey is missing in preferred term', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          50,
                podAffinityTerm: {},
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });
    });

    describe('podAffinity required terms', () => {
      it('should not push an error for a valid required affinity term', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              {
                topologyKey:   'kubernetes.io/hostname',
                labelSelector: { matchExpressions: [{ operator: 'In', values: ['web'] }] },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors).toStrictEqual([]);
      });

      it('should push an error when topologyKey is missing in required term', () => {
        const errors = createErrors();
        const spec = { podAffinity: { requiredDuringSchedulingIgnoredDuringExecution: [{}] } };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });
    });

    describe('podAntiAffinity preferred terms', () => {
      it('should not push an error for a valid preferred anti-affinity term', () => {
        const errors = createErrors();
        const spec = {
          podAntiAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          75,
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors).toStrictEqual([]);
      });

      it('should push an error for invalid weight in preferred anti-affinity term', () => {
        const errors = createErrors();
        const spec = {
          podAntiAffinity: {
            preferredDuringSchedulingIgnoredDuringExecution: [
              {
                weight:          'not-a-number',
                podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.number.between'))).toBe(true);
      });
    });

    describe('podAntiAffinity required terms', () => {
      it('should not push an error for a valid required anti-affinity term', () => {
        const errors = createErrors();
        const spec = {
          podAntiAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              { topologyKey: 'kubernetes.io/zone' },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors).toStrictEqual([]);
      });

      it('should push an error when topologyKey is missing in required anti-affinity term', () => {
        const errors = createErrors();
        const spec = { podAntiAffinity: { requiredDuringSchedulingIgnoredDuringExecution: [{}] } };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.podAffinity.topologyKey'))).toBe(true);
      });
    });

    describe('labelSelector validation', () => {
      it('should push an error for invalid operator in matchExpression', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              {
                topologyKey:   'kubernetes.io/hostname',
                labelSelector: { matchExpressions: [{ operator: 'InvalidOp', values: ['web'] }] },
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors.some((e) => e.includes('validation.podAffinity.matchExpressions.operator'))).toBe(true);
      });

      it.each(['In', 'NotIn'])(
        'should push an error when operator is %s but values is empty',
        (operator) => {
          const errors = createErrors();
          const spec = {
            podAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: [
                {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: { matchExpressions: [{ operator, values: [] }] },
                },
              ],
            },
          };

          podAffinity(spec, createMockGetters(), errors);
          expect(
            errors.some((e) => e.includes('validation.podAffinity.matchExpressions.valuesMustBeDefined'))
          ).toBe(true);
        }
      );

      it.each(['Exists', 'DoesNotExist'])(
        'should push an error when operator is %s but values is non-empty',
        (operator) => {
          const errors = createErrors();
          const spec = {
            podAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: [
                {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: { matchExpressions: [{ operator, values: ['web'] }] },
                },
              ],
            },
          };

          podAffinity(spec, createMockGetters(), errors);
          expect(
            errors.some((e) => e.includes('validation.podAffinity.matchExpressions.valueMustBeEmpty'))
          ).toBe(true);
        }
      );

      it.each(['In', 'NotIn'])(
        'should not push an error when operator is %s with valid values',
        (operator) => {
          const errors = createErrors();
          const spec = {
            podAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: [
                {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: { matchExpressions: [{ operator, values: ['frontend'] }] },
                },
              ],
            },
          };

          podAffinity(spec, createMockGetters(), errors);
          expect(errors).toStrictEqual([]);
        }
      );

      it.each(['Exists', 'DoesNotExist'])(
        'should not push an error when operator is %s with empty values',
        (operator) => {
          const errors = createErrors();
          const spec = {
            podAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: [
                {
                  topologyKey:   'kubernetes.io/hostname',
                  labelSelector: { matchExpressions: [{ operator, values: [] }] },
                },
              ],
            },
          };

          podAffinity(spec, createMockGetters(), errors);
          expect(errors).toStrictEqual([]);
        }
      );

      it('should not validate matchExpressions when labelSelector is empty', () => {
        const errors = createErrors();
        const spec = {
          podAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [
              {
                topologyKey:   'kubernetes.io/hostname',
                labelSelector: {},
              },
            ],
          },
        };

        podAffinity(spec, createMockGetters(), errors);
        expect(errors).toStrictEqual([]);
      });
    });
  });
});
