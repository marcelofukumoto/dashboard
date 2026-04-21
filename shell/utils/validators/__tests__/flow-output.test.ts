import { flowOutput } from '@shell/utils/validators/flow-output';
import { createMockGetters, createErrors } from './helpers';

describe('flowOutput', () => {
  const getters = createMockGetters();

  describe('when verifyLocal is not set', () => {
    it('adds error when globalOutputRefs is empty', () => {
      const errors = createErrors();

      flowOutput({ globalOutputRefs: [] }, getters, errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });

    it('adds no error when globalOutputRefs is non-empty', () => {
      const errors = createErrors();

      flowOutput({ globalOutputRefs: ['output1'] }, getters, errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when globalOutputRefs is undefined', () => {
      const errors = createErrors();

      flowOutput({}, getters, errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });

    it('ignores localOutputRefs when verifyLocal is not set', () => {
      const errors = createErrors();

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: [] }, getters, errors, []);
      expect(errors).toStrictEqual(['validation.flowOutput.global']);
    });
  });

  describe('when verifyLocal is set', () => {
    it('adds error when both localOutputRefs and globalOutputRefs are empty', () => {
      const errors = createErrors();

      flowOutput({ localOutputRefs: [], globalOutputRefs: [] }, getters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });

    it('adds no error when localOutputRefs is non-empty and globalOutputRefs is empty', () => {
      const errors = createErrors();

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: [] }, getters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when globalOutputRefs is non-empty and localOutputRefs is empty', () => {
      const errors = createErrors();

      flowOutput({ localOutputRefs: [], globalOutputRefs: ['global1'] }, getters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when both refs are non-empty', () => {
      const errors = createErrors();

      flowOutput({ localOutputRefs: ['local1'], globalOutputRefs: ['global1'] }, getters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when localOutputRefs is undefined and globalOutputRefs is empty', () => {
      const errors = createErrors();

      flowOutput({ globalOutputRefs: [] }, getters, errors, ['verifyLocal']);
      expect(errors).toStrictEqual(['validation.flowOutput.both']);
    });
  });
});
