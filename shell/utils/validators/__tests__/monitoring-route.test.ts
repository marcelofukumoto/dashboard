import { matching, interval } from '@shell/utils/validators/monitoring-route';
import { createErrors, createMockGetters } from './helpers';

describe('validators/monitoring-route', () => {
  describe('matching', () => {
    it('should push an error when both match and match_re are absent', () => {
      const errors = createErrors();

      matching({}, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('should push an error when both match and match_re are empty objects', () => {
      const errors = createErrors();

      matching({ match: {}, match_re: {} }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('should not push an error when match is non-empty', () => {
      const errors = createErrors();

      matching({ match: { severity: 'critical' } }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should not push an error when match_re is non-empty', () => {
      const errors = createErrors();

      matching({ match_re: { alertname: 'KubeNode.*' } }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should push an error when spec is null', () => {
      const errors = createErrors();

      matching(null, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });
  });

  describe('interval', () => {
    it.each([
      ['5m', 'repeats'],
      ['30s', 'repeat_interval'],
      ['2h', 'group_wait'],
      ['0h', 'group_interval'],
    ])('should not push an error for valid interval %s', (value, displayKey) => {
      const errors = createErrors();

      interval(value, createMockGetters(), errors, undefined, displayKey);
      expect(errors).toStrictEqual([]);
    });

    it.each([
      ['5', 'repeats'],
      ['30 s', 'repeat_interval'],
      ['2H', 'group_wait'],
      ['', 'group_interval'],
      ['1d', 'group_interval'],
      ['abc', 'group_interval'],
    ])('should push an error for invalid interval %s', (value, displayKey) => {
      const errors = createErrors();

      interval(value, createMockGetters(), errors, undefined, displayKey);
      expect(errors).toStrictEqual([
        `validation.monitoring.route.interval:${ JSON.stringify({ key: displayKey }) }`,
      ]);
    });
  });
});
