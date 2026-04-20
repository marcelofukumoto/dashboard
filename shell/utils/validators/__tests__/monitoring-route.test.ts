import { matching, interval } from '@shell/utils/validators/monitoring-route';

const mockT = (key: string, args?: Record<string, unknown>): string => {
  if (args && Object.keys(args).length > 0) {
    return `${ key }:${ JSON.stringify(args) }`;
  }

  return key;
};

const makeGetters = () => ({ 'i18n/t': mockT });

describe('matching', () => {
  it('adds no error when match is non-empty', () => {
    const errors: string[] = [];

    matching({ match: { severity: 'critical' } }, makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('adds no error when match_re is non-empty', () => {
    const errors: string[] = [];

    matching({ match_re: { alertname: '.*' } }, makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('adds no error when both match and match_re are present', () => {
    const errors: string[] = [];

    matching({ match: { severity: 'critical' }, match_re: { name: '.*' } }, makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('adds error when both match and match_re are absent', () => {
    const errors: string[] = [];

    matching({}, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.monitoring.route.match']);
  });

  it('adds error when both match and match_re are empty objects', () => {
    const errors: string[] = [];

    matching({ match: {}, match_re: {} }, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.monitoring.route.match']);
  });

  it('adds error when spec is null', () => {
    const errors: string[] = [];

    matching(null, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.monitoring.route.match']);
  });

  it('appends to existing errors', () => {
    const errors = ['pre-existing'];

    matching({}, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['pre-existing', 'validation.monitoring.route.match']);
  });
});

describe('interval', () => {
  it.each([
    ['seconds', '30s'],
    ['minutes', '5m'],
    ['hours', '2h'],
    ['single digit', '1s'],
    ['multi-digit', '120m'],
  ])('adds no error for valid interval: %s (%s)', (_label, value) => {
    const errors: string[] = [];

    interval(value, makeGetters(), errors, [], 'Repeat Interval');
    expect(errors).toStrictEqual([]);
  });

  it.each([
    ['empty string', ''],
    ['missing unit', '30'],
    ['invalid unit', '30d'],
    ['unit only', 's'],
    ['non-numeric', 'fivem'],
    ['with spaces', '5 m'],
    ['decimal', '1.5s'],
  ])('adds error for invalid interval: %s (%s)', (_label, value) => {
    const errors: string[] = [];

    interval(value, makeGetters(), errors, [], 'Repeat Interval');
    expect(errors).toStrictEqual([mockT('validation.monitoring.route.interval', { key: 'Repeat Interval' })]);
  });

  it('includes displayKey in error message', () => {
    const errors: string[] = [];

    interval('bad', makeGetters(), errors, [], 'Group Wait');
    expect(errors).toStrictEqual(['validation.monitoring.route.interval:{"key":"Group Wait"}']);
  });

  it('appends to existing errors', () => {
    const errors = ['pre-existing'];

    interval('bad', makeGetters(), errors, [], 'key');
    expect(errors).toHaveLength(2);
    expect(errors[0]).toStrictEqual('pre-existing');
  });
});
