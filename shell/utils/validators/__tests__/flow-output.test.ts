import { flowOutput } from '@shell/utils/validators/flow-output';

const mockT = (key: string, args?: Record<string, unknown>): string => {
  if (args && Object.keys(args).length > 0) {
    return `${ key }:${ JSON.stringify(args) }`;
  }

  return key;
};

const makeGetters = () => ({ 'i18n/t': mockT });

describe('flowOutput', () => {
  describe('without verifyLocal', () => {
    it('adds no error when globalOutputRefs is non-empty', () => {
      const errors: string[] = [];

      flowOutput({ globalOutputRefs: ['output1'] }, makeGetters(), errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds global error when globalOutputRefs is empty', () => {
      const errors: string[] = [];

      flowOutput({ globalOutputRefs: [] }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });

    it('adds global error when globalOutputRefs is absent', () => {
      const errors: string[] = [];

      flowOutput({}, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });

    it('adds global error even if localOutputRefs is non-empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: [] }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });
  });

  describe('with verifyLocal', () => {
    it('adds no error when both localOutputRefs and globalOutputRefs are non-empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: ['global1'] }, makeGetters(), errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when only localOutputRefs is non-empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: [] }, makeGetters(), errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when only globalOutputRefs is non-empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: [], globalOutputRefs: ['global1'] }, makeGetters(), errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds both error when both refs are empty', () => {
      const errors: string[] = [];

      flowOutput({ localOutputRefs: [], globalOutputRefs: [] }, makeGetters(), errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });

    it('adds both error when both refs are absent', () => {
      const errors: string[] = [];

      flowOutput({}, makeGetters(), errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });
  });

  describe('error accumulation', () => {
    it('appends to existing errors', () => {
      const errors = ['pre-existing'];

      flowOutput({ globalOutputRefs: [] }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['pre-existing', 'validation.flowOutput.global']);
    });
  });
});
