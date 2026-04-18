import { cronSchedule, cronScheduleRule } from '../cron-schedule';
import { createMockGetters, createErrors } from './helpers';

describe('cronScheduleRule', () => {
  describe('validation', () => {
    it('returns a description for a valid cron expression', () => {
      expect(() => cronScheduleRule.validation('0 * * * *')).not.toThrow();
    });

    it('throws for an invalid cron expression', () => {
      expect(() => cronScheduleRule.validation('invalid')).toThrow('Error:');
    });

    it('throws for an empty string', () => {
      expect(() => cronScheduleRule.validation('')).toThrow('Error:');
    });

    it('throws for clearly malformed input (letters as field values)', () => {
      expect(() => cronScheduleRule.validation('a b c d e')).toThrow('Error:');
    });
  });

  describe('message', () => {
    it('has the correct i18n key', () => {
      expect(cronScheduleRule.message).toStrictEqual('validation.invalidCron');
    });
  });
});

describe('cronSchedule', () => {
  const getters = createMockGetters();

  describe('valid schedules', () => {
    it.each([
      ['every minute', '* * * * *'],
      ['every hour', '0 * * * *'],
      ['daily at midnight', '0 0 * * *'],
      ['weekly on Sunday', '0 0 * * 0'],
      ['monthly on 1st', '0 0 1 * *'],
      ['every 5 minutes', '*/5 * * * *'],
    ])('%s: %s', (_desc, schedule) => {
      const errors = createErrors();

      cronSchedule(schedule, getters, errors);
      expect(errors).toStrictEqual([]);
    });
  });

  describe('invalid schedules', () => {
    it('adds error for invalid expression', () => {
      const errors = createErrors();

      cronSchedule('invalid', getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });

    it('adds error for empty string', () => {
      const errors = createErrors();

      cronSchedule('', getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });

    it('adds error for completely wrong format', () => {
      const errors = createErrors();

      cronSchedule('not-a-cron', getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });

    it('adds error for out-of-range minute (60)', () => {
      const errors = createErrors();

      cronSchedule('60 * * * *', getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });

    it('adds error for out-of-range hour (24)', () => {
      const errors = createErrors();

      cronSchedule('0 24 * * *', getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });
  });

  describe('default schedule parameter', () => {
    it('handles missing schedule (defaults to empty string)', () => {
      const errors = createErrors();

      cronSchedule(undefined, getters, errors);
      expect(errors).toStrictEqual(['validation.invalidCron']);
    });
  });

  describe('error accumulation', () => {
    it('appends to existing errors array', () => {
      const errors = ['existing-error'];

      cronSchedule('invalid', getters, errors);
      expect(errors).toStrictEqual(['existing-error', 'validation.invalidCron']);
    });
  });
});
