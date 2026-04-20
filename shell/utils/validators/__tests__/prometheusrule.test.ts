import { ruleGroups, groupsAreValid } from '@shell/utils/validators/prometheusrule';

const mockT = (key: string, args?: Record<string, unknown>): string => {
  if (args && Object.keys(args).length > 0) {
    return `${ key }:${ JSON.stringify(args) }`;
  }

  return key;
};

const makeGetters = () => ({ 'i18n/t': mockT });

describe('ruleGroups', () => {
  it('adds no error when groups is non-empty', () => {
    const errors: string[] = [];

    ruleGroups({ groups: [{ name: 'group1', rules: [] }] }, makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('adds error when groups is empty array', () => {
    const errors: string[] = [];

    ruleGroups({ groups: [] }, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
  });

  it('adds error when groups is absent', () => {
    const errors: string[] = [];

    ruleGroups({}, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
  });

  it('adds error when spec is null', () => {
    const errors: string[] = [];

    ruleGroups(null, makeGetters(), errors, []);
    expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
  });

  it('returns errors array', () => {
    const errors: string[] = [];
    const result = ruleGroups({ groups: [] }, makeGetters(), errors, []);

    expect(result).toBe(errors);
  });
});

describe('groupsAreValid', () => {
  it('adds no error for a valid alert rule', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{
        name:  'group1',
        rules: [{
          alert: 'HighCPU', expr: 'up > 0.9', labels: { severity: 'warning' }
        }]
      }],
      makeGetters(), errors, []
    );
    expect(errors).toStrictEqual([]);
  });

  it('adds no error for a valid recording rule', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [{ record: 'job:up:sum', expr: 'sum(up) by (job)' }] }],
      makeGetters(), errors, []
    );
    expect(errors).toStrictEqual([]);
  });

  it('adds error when group name is empty', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: '', rules: [{ record: 'r', expr: 'e' }] }],
      makeGetters(), errors, []
    );
    expect(errors).toContain('validation.prometheusRule.groups.valid.name:{"index":1}');
  });

  it('adds error when group has no rules', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [] }],
      makeGetters(), errors, []
    );
    expect(errors).toContain('validation.prometheusRule.groups.valid.singleEntry:{"index":1}');
  });

  it('adds error when alert rule has empty alert name', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{
        name:  'group1',
        rules: [{
          alert: '', expr: 'up > 0', labels: { severity: 'info' }
        }]
      }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.alertName:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('adds error when recording rule has empty record name', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [{ record: '', expr: 'sum(up)' }] }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.recordName:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('adds error when rule has no expr', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [{ alert: 'Test', labels: { severity: 'info' } }] }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.expr:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('adds error when alert rule expr is empty string', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{
        name:  'group1',
        rules: [{
          alert: 'Test', expr: '', labels: { severity: 'info' }
        }]
      }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.expr:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('adds error when alert rule has no labels', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [{ alert: 'Test', expr: 'up > 0' }] }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.labels:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('adds error when alert rule labels is empty object', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{
        name:  'group1',
        rules: [{
          alert: 'Test', expr: 'up > 0', labels: {}
        }]
      }],
      makeGetters(), errors, []
    );
    expect(errors).toContain(
      'validation.prometheusRule.groups.valid.rule.labels:{"groupIndex":1,"ruleIndex":1}'
    );
  });

  it('does NOT add labels error for recording rules', () => {
    const errors: string[] = [];

    groupsAreValid(
      [{ name: 'group1', rules: [{ record: 'job:up', expr: 'sum(up)' }] }],
      makeGetters(), errors, []
    );
    expect(errors.some((e) => e.includes('labels'))).toBe(false);
  });

  it('handles empty groups array', () => {
    const errors: string[] = [];

    groupsAreValid([], makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('handles undefined groups (default parameter)', () => {
    const errors: string[] = [];

    groupsAreValid(undefined, makeGetters(), errors, []);
    expect(errors).toStrictEqual([]);
  });

  it('accumulates errors across multiple groups', () => {
    const errors: string[] = [];

    groupsAreValid(
      [
        { name: '', rules: [] },
        {
          name:  'valid',
          rules: [{
            alert: '', expr: 'up', labels: {}
          }]
        },
      ],
      makeGetters(), errors, []
    );
    expect(errors.length).toBeGreaterThan(2);
  });

  it('returns errors array', () => {
    const errors: string[] = [];
    const result = groupsAreValid([], makeGetters(), errors, []);

    expect(result).toBe(errors);
  });
});
