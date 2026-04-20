import { logdna } from '@shell/utils/validators/logging-outputs';

const mockT = (key: string, args?: Record<string, unknown>): string => {
  if (args && Object.keys(args).length > 0) {
    return `${ key }:${ JSON.stringify(args) }`;
  }

  return key;
};

const makeGetters = () => ({ 'i18n/t': mockT });

describe('logdna', () => {
  describe('early return on empty value', () => {
    it('adds no error when value is null', () => {
      const errors: string[] = [];

      logdna(null, makeGetters(), errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when value is undefined', () => {
      const errors: string[] = [];

      logdna(undefined, makeGetters(), errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds no error when value is empty object', () => {
      const errors: string[] = [];

      logdna({}, makeGetters(), errors, []);
      expect(errors).toStrictEqual([]);
    });
  });

  describe('api_key validation', () => {
    it('adds no error when api_key is present', () => {
      const errors: string[] = [];

      logdna({ api_key: 'my-secret-key' }, makeGetters(), errors, []);
      expect(errors).toStrictEqual([]);
    });

    it('adds error when api_key is empty string', () => {
      const errors: string[] = [];

      logdna({ api_key: '' }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('adds error when api_key is absent', () => {
      const errors: string[] = [];

      logdna({ host: 'logs.logdna.com' }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('adds error when api_key is null', () => {
      const errors: string[] = [];

      logdna({ api_key: null }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });
  });

  describe('error accumulation', () => {
    it('appends to existing errors', () => {
      const errors = ['pre-existing'];

      logdna({ api_key: '' }, makeGetters(), errors, []);
      expect(errors).toStrictEqual(['pre-existing', 'validation.output.logdna.apiKey']);
    });
  });
});
