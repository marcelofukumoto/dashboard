import { logdna } from '@shell/utils/validators/logging-outputs';
import { createErrors, createMockGetters } from './helpers';

describe('validators/logging-outputs', () => {
  describe('logdna', () => {
    it('should not push an error when value is empty', () => {
      const errors = createErrors();

      logdna({}, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should not push an error when value is null/undefined', () => {
      const errors = createErrors();

      logdna(null, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should not push an error when api_key is present', () => {
      const errors = createErrors();

      logdna({ api_key: 'my-api-key' }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should push an error when value is non-empty but api_key is absent', () => {
      const errors = createErrors();

      logdna({ host: 'logdna.example.com' }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('should push an error when api_key is an empty string', () => {
      const errors = createErrors();

      logdna({ api_key: '' }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });
  });
});
