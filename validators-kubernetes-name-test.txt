import { validateKubernetesName } from '../kubernetes-name';
import { createMockGetters, createErrors, mockT } from './helpers';

describe('validateKubernetesName', () => {
  const getters = createMockGetters();

  describe('valid names', () => {
    it.each([
      ['simple lowercase', 'myname'],
      ['alphanumeric', 'abc123'],
      ['single character', 'a'],
      ['hyphens in middle', 'my-name'],
      ['numbers only', '123'],
      ['max length (63)', 'a'.repeat(63)],
    ])('%s: %s', (_desc, label) => {
      const errors = createErrors();

      validateKubernetesName(label, 'Name', getters, {}, errors);
      expect(errors).toStrictEqual([]);
    });
  });

  describe('invalid characters', () => {
    it('accepts uppercase letters (validChars includes A-Z by default)', () => {
      const errors = createErrors();

      validateKubernetesName('MyName', 'Name', getters, {}, errors);
      expect(errors).toStrictEqual([]);
    });

    it('rejects underscores', () => {
      const errors = createErrors();

      validateKubernetesName('my_name', 'Name', getters, {}, errors);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects dots', () => {
      const errors = createErrors();

      validateKubernetesName('my.name', 'Name', getters, {}, errors);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects spaces', () => {
      const errors = createErrors();

      validateKubernetesName('my name', 'Name', getters, {}, errors);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('hyphen position', () => {
    it('rejects names starting with a hyphen', () => {
      const errors = createErrors();

      validateKubernetesName('-myname', 'Name', getters, {}, errors);
      expect(errors).toContain(mockT('validation.dns.label.startHyphen', { key: 'Name' }));
    });

    it('rejects names ending with a hyphen', () => {
      const errors = createErrors();

      validateKubernetesName('myname-', 'Name', getters, {}, errors);
      expect(errors).toContain(mockT('validation.dns.label.endHyphen', { key: 'Name' }));
    });

    it('rejects names starting and ending with a hyphen', () => {
      const errors = createErrors();

      validateKubernetesName('-myname-', 'Name', getters, {}, errors);
      expect(errors).toContain(mockT('validation.dns.label.startHyphen', { key: 'Name' }));
      expect(errors).toContain(mockT('validation.dns.label.endHyphen', { key: 'Name' }));
    });
  });

  describe('length constraints', () => {
    it('rejects empty string', () => {
      const errors = createErrors();

      validateKubernetesName('', 'Name', getters, {}, errors);
      expect(errors).toContain(mockT('validation.dns.label.emptyLabel', { key: 'Name', min: 1 }));
    });

    it('rejects names exceeding 63 characters', () => {
      const errors = createErrors();

      validateKubernetesName('a'.repeat(64), 'Name', getters, {}, errors);
      expect(errors).toContain(mockT('validation.dns.label.tooLongLabel', { key: 'Name', max: 63 }));
    });

    it('accepts custom maxLength', () => {
      const errors = createErrors();

      validateKubernetesName('a'.repeat(100), 'Name', getters, { maxLength: 200 }, errors);
      expect(errors).toStrictEqual([]);
    });

    it('rejects names over custom maxLength', () => {
      const errors = createErrors();

      validateKubernetesName('a'.repeat(10), 'Name', getters, { maxLength: 5 }, errors);
      expect(errors).toContain(mockT('validation.dns.label.tooLongLabel', { key: 'Name', max: 5 }));
    });

    it('accepts custom minLength', () => {
      const errors = createErrors();

      validateKubernetesName('abc', 'Name', getters, { minLength: 3 }, errors);
      expect(errors).toStrictEqual([]);
    });

    it('rejects names under custom minLength', () => {
      const errors = createErrors();

      validateKubernetesName('ab', 'Name', getters, { minLength: 3 }, errors);
      expect(errors).toContain(mockT('validation.dns.label.emptyLabel', { key: 'Name', min: 3 }));
    });
  });

  describe('errorKey option', () => {
    it('uses hostname errorKey when forHostname is true', () => {
      const errors = createErrors();

      validateKubernetesName('-myname', 'Name', getters, { forHostname: true }, errors);
      expect(errors).toContain(mockT('validation.dns.hostname.startHyphen', { key: 'Name' }));
    });

    it('uses custom errorKey', () => {
      const errors = createErrors();

      validateKubernetesName('-myname', 'Name', getters, { errorKey: 'custom' }, errors);
      expect(errors).toContain(mockT('validation.dns.custom.startHyphen', { key: 'Name' }));
    });
  });

  describe('default errors array', () => {
    it('initializes errors array if not provided', () => {
      const result = validateKubernetesName('', 'Name', getters, {});

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
