import { ruleGroups, groupsAreValid } from '@shell/utils/validators/prometheusrule';
import { createErrors, createMockGetters } from './helpers';

describe('validators/prometheusrule', () => {
  describe('ruleGroups', () => {
    it('should push an error when groups is absent', () => {
      const errors = createErrors();

      ruleGroups({}, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
    });

    it('should push an error when groups is an empty array', () => {
      const errors = createErrors();

      ruleGroups({ groups: [] }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual(['validation.prometheusRule.groups.required']);
    });

    it('should not push an error when groups is non-empty', () => {
      const errors = createErrors();

      ruleGroups({ groups: [{ name: 'group1', rules: [] }] }, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });
  });

  describe('groupsAreValid', () => {
    it('should return empty errors for a valid alert rule group', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [
            {
              alert:  'HighErrorRate',
              expr:   'rate(errors_total[5m]) > 0.1',
              labels: { severity: 'critical' },
            },
          ],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should return empty errors for a valid recording rule', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'recording-group',
          rules: [
            {
              record: 'job:http_requests:rate5m',
              expr:   'rate(http_requests_total[5m])',
            },
          ],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should push an error when a group name is empty', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  '',
          rules: [{
            expr: 'up == 0', alert: 'InstanceDown', labels: { severity: 'warning' }
          }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain('validation.prometheusRule.groups.valid.name:{"index":1}');
    });

    it('should push an error when a group has no rules', () => {
      const errors = createErrors();
      const groups = [{ name: 'empty-group', rules: [] }];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.singleEntry:{"index":1}'
      );
    });

    it('should push an error when a group has no rules field', () => {
      const errors = createErrors();
      const groups = [{ name: 'empty-group' }] as any[];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.singleEntry:{"index":1}'
      );
    });

    it('should push an error for alert rule with empty alert name', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{
            alert: '', expr: 'up == 0', labels: { severity: 'warning' }
          }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.alertName:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should push an error for recording rule with empty record name', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{ record: '', expr: 'rate(errors_total[5m])' }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.recordName:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should push an error when expr is empty', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{
            alert: 'TestAlert', expr: '', labels: { severity: 'info' }
          }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.expr:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should push an error when expr is absent', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{ alert: 'TestAlert', labels: { severity: 'info' } }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.expr:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should push an error for alert rule with empty labels', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{
            alert: 'TestAlert', expr: 'up == 0', labels: {}
          }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.labels:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should push an error for alert rule with missing labels', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'test-group',
          rules: [{ alert: 'TestAlert', expr: 'up == 0' }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.labels:{"groupIndex":1,"ruleIndex":1}'
      );
    });

    it('should not push a labels error for recording rules', () => {
      const errors = createErrors();
      const groups = [
        {
          name:  'recording-group',
          rules: [{ record: 'job:rate5m', expr: 'rate(total[5m])' }],
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should accumulate errors across multiple groups and rules', () => {
      const errors = createErrors();
      const groups = [
        { name: '', rules: [] },
        {
          name:  'group2',
          rules: [{
            alert: '', expr: '', labels: {}
          }]
        },
      ];

      groupsAreValid(groups, createMockGetters(), errors, undefined);
      expect(errors).toContain('validation.prometheusRule.groups.valid.name:{"index":1}');
      expect(errors).toContain('validation.prometheusRule.groups.valid.singleEntry:{"index":1}');
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.alertName:{"groupIndex":2,"ruleIndex":1}'
      );
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.expr:{"groupIndex":2,"ruleIndex":1}'
      );
      expect(errors).toContain(
        'validation.prometheusRule.groups.valid.rule.labels:{"groupIndex":2,"ruleIndex":1}'
      );
    });

    it('should return errors array', () => {
      const errors = createErrors();

      const result = groupsAreValid([], createMockGetters(), errors, undefined);

      expect(result).toStrictEqual(errors);
    });

    it('should handle empty groups array', () => {
      const errors = createErrors();

      groupsAreValid([], createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });

    it('should handle undefined groups (default parameter)', () => {
      const errors = createErrors();

      groupsAreValid(undefined as any, createMockGetters(), errors, undefined);
      expect(errors).toStrictEqual([]);
    });
  });
});
