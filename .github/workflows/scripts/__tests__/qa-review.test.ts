/* eslint-disable @typescript-eslint/no-var-requires */
// Unit tests for the pure helpers in qa-review.js (selection and decision table).
// The module is plain CommonJS, so it is pulled in with require() (same pattern
// as weekly-stale-issue-manager.test.ts).
const qa = require('../qa-review');

const { LABEL, STATUS } = qa;

const human = (id: number, body = 'looks good') => ({
  id, body, author: { login: 'someone', __typename: 'User' }
});
const review = (id: number, state: object) => ({
  id, body: `analysis\n\n${ qa.formatMarker(state) }`, author: { login: 'github-actions', __typename: 'Bot' }
});
const mergedPr = (number: number, mergeSha: string) => ({
  number, merged: true, mergeSha
});

const baseIssue = (overrides = {}) => ({
  number:   100,
  title:    'Some bug',
  author:   'dev',
  labels:   ['kind/bug', 'QA/dev-automation'],
  status:   STATUS.QA_REVIEW,
  statusAt: '2026-10-01T00:00:00Z',
  comments: [human(1)],
  prs:      [mergedPr(10, 'aaa')],
  ...overrides,
});

describe('exclusionReason', () => {
  it.each([
    ['skip label', { labels: [LABEL.SKIP] }, `excluded label: ${ LABEL.SKIP }`],
    ['QA/None alone', { labels: ['QA/None'] }, 'excluded label: QA/None'],
    ['backport title', { title: '[backport v2.14.1] Some bug' }, 'backport issue'],
    ['project bot author', { author: 'rancher-ui-project-bot' }, 'bot-authored issue'],
    ['handed over to QA', { labels: [LABEL.HUMAN_REVIEW] }, `waiting on QA (${ LABEL.HUMAN_REVIEW })`],
  ])('excludes: %s', (_label, overrides, expected) => {
    expect(qa.exclusionReason(baseIssue(overrides))).toStrictEqual(expected);
  });

  it('keeps QA/None when QA/dev-automation is also present', () => {
    expect(qa.exclusionReason(baseIssue({ labels: ['QA/None', 'QA/dev-automation'] }))).toBeNull();
  });
});

describe('marker', () => {
  it('round-trips through a comment body', () => {
    const state = {
      status_at: '2026-10-01T00:00:00Z', prs: ['10@aaa'], last_comment: 1, round: 2
    };

    expect(qa.parseMarker(`text\n${ qa.formatMarker(state) }\n`)).toStrictEqual({ v: 1, ...state });
  });

  it('returns null without a marker or with broken JSON', () => {
    expect(qa.parseMarker('plain comment')).toBeNull();
    expect(qa.parseMarker('<!-- qa-review-state {broken} -->')).toBeNull();
  });
});

describe('fingerprint', () => {
  it('ignores bot comments and unmerged PRs, and sorts PRs', () => {
    const issue = baseIssue({
      comments: [human(1), human(2), review(3, {})],
      prs:      [mergedPr(20, 'bbb'), { number: 15, merged: false }, mergedPr(10, 'aaa')],
    });

    expect(qa.fingerprint(issue)).toStrictEqual({
      status_at: '2026-10-01T00:00:00Z', prs: ['10@aaa', '20@bbb'], last_comment: 2
    });
  });
});

describe('classify', () => {
  const reviewedState = {
    status_at: '2026-10-01T00:00:00Z', prs: ['10@aaa'], last_comment: 1, round: 1
  };
  const reviewed = (overrides = {}) => baseIssue({
    labels:   [LABEL.REVIEWED],
    comments: [human(1), review(2, reviewedState)],
    ...overrides,
  });

  it('reviews an issue in QA Review that was never reviewed', () => {
    expect(qa.classify(baseIssue()).mode).toStrictEqual('review');
  });

  it('skips a reviewed issue that has not changed, however many runs were missed', () => {
    expect(qa.classify(reviewed())).toStrictEqual({ mode: null, reason: 'unchanged since last review' });
  });

  it.each([
    ['moved back to QA Review', { statusAt: '2026-10-20T00:00:00Z' }],
    ['new merged PRs', { prs: [mergedPr(10, 'aaa'), mergedPr(11, 'ccc')] }],
    ['new comments', { comments: [human(1), review(2, reviewedState), human(5)] }],
  ])('re-reviews when %s', (reason, overrides) => {
    expect(qa.classify(reviewed(overrides))).toStrictEqual({ mode: 're-review', reason });
  });

  it('does a fresh review when bot/qa-reviewed was removed by hand', () => {
    expect(qa.classify(reviewed({ labels: [] })).mode).toStrictEqual('review');
  });

  it('checks manual-test evidence only when a new comment arrived', () => {
    const waiting = reviewed({ status: STATUS.TO_TEST, labels: [LABEL.REVIEWED, LABEL.NEEDS_MANUAL] });

    expect(qa.classify(waiting).mode).toBeNull();
    expect(qa.classify({ ...waiting, comments: [...waiting.comments, human(9, 'validated in v2.14')] }).mode).toStrictEqual('manual-check');
  });

  it('ignores To Test issues that are not waiting on manual tests', () => {
    expect(qa.classify(baseIssue({ status: STATUS.TO_TEST })).mode).toBeNull();
  });
});

describe('planQueue', () => {
  it('takes the oldest first and defers the rest', () => {
    const items = [
      { number: 3, statusAt: '2026-10-03' },
      { number: 1, statusAt: '2026-10-01' },
      { number: 2, statusAt: '2026-10-02' },
    ];
    const { selected, deferred } = qa.planQueue(items, 2);

    expect(selected.map((i: any) => i.number)).toStrictEqual([1, 2]);
    expect(deferred.map((i: any) => i.number)).toStrictEqual([3]);
  });
});

describe('planDecision', () => {
  const entry = (overrides = {}) => ({
    mode: 'review', labels: [], round: 0, ...overrides
  });
  const decide = (a: boolean, s: boolean, m: boolean, extra = {}) => ({
    is_automatable: a, automation_sufficient: s, manual_test: m, ...extra
  });

  it.each([
    // [label, decision, expected coverage label, expected manual label, expected status]
    ['not automatable, manual', decide(false, false, true), LABEL.NOT_AUTOMATABLE, LABEL.NEEDS_MANUAL, STATUS.TO_TEST],
    ['sufficient, manual', decide(true, true, true), LABEL.SUFFICIENT, LABEL.NEEDS_MANUAL, STATUS.TO_TEST],
    ['sufficient, no manual', decide(true, true, false), LABEL.SUFFICIENT, LABEL.NO_MANUAL, null],
    ['needs more, manual', decide(true, false, true), LABEL.NEEDS_MORE, LABEL.NEEDS_MANUAL, STATUS.REOPENED],
    ['needs more, no manual', decide(true, false, false), LABEL.NEEDS_MORE, LABEL.NO_MANUAL, STATUS.REOPENED],
  ])('%s', (_label, decision, coverage, manual, status) => {
    const plan = qa.planDecision(entry(), decision);

    expect(plan.add).toStrictEqual([LABEL.REVIEWED, coverage, manual]);
    expect(plan.status).toStrictEqual(status);
    expect(plan.close).toStrictEqual(false);
  });

  it('accepts the string booleans that safe-output jobs receive', () => {
    expect(qa.planDecision(entry(), decide('true' as any, 'false' as any, 'false' as any)).add).toContain(LABEL.NEEDS_MORE);
  });

  it('ignores automation_sufficient when the issue is not automatable', () => {
    expect(qa.planDecision(entry(), decide(false, true, false)).add).toContain(LABEL.NOT_AUTOMATABLE);
  });

  it('only closes and moves to Done when auto-close is on', () => {
    const plan = qa.planDecision(entry(), decide(true, true, false), { autoClose: true });

    expect(plan.status).toStrictEqual(STATUS.DONE);
    expect(plan.close).toStrictEqual(true);
  });

  it('removes the labels of the other outcome in each group', () => {
    const plan = qa.planDecision(entry({ mode: 're-review', labels: [LABEL.NEEDS_MORE, LABEL.NO_MANUAL] }), decide(true, true, true));

    expect(plan.remove).toContain(LABEL.NEEDS_MORE);
    expect(plan.remove).toContain(LABEL.NO_MANUAL);
    expect(plan.remove).not.toContain(LABEL.SUFFICIENT);
  });

  it('counts suggestion rounds and hands over to QA at the limit', () => {
    const second = qa.planDecision(entry({ mode: 're-review', round: 1 }), decide(true, false, false));
    const last = qa.planDecision(entry({ mode: 're-review', round: qa.MAX_SUGGESTION_ROUNDS - 1 }), decide(true, false, false));

    expect(second.round).toStrictEqual(2);
    expect(second.add).not.toContain(LABEL.HUMAN_REVIEW);
    expect(last.add).toContain(LABEL.HUMAN_REVIEW);
    expect(last.status).toBeNull();
  });

  it('restarts the round count on a major change', () => {
    const plan = qa.planDecision(entry({ mode: 're-review', round: 2 }), decide(true, false, false, { major_change: true }));

    expect(plan.round).toStrictEqual(1);
    expect(plan.add).toContain(LABEL.MAJOR_CHANGE);
    expect(plan.add).not.toContain(LABEL.HUMAN_REVIEW);
  });

  it('ignores major_change on a first review', () => {
    expect(qa.planDecision(entry(), decide(true, true, true, { major_change: true })).add).not.toContain(LABEL.MAJOR_CHANGE);
  });

  describe('manual-check', () => {
    const waiting = entry({ mode: 'manual-check', labels: [LABEL.REVIEWED, LABEL.NEEDS_MANUAL] });

    it('pass: clears needs-manual-test and leaves the column to QA unless auto-close is on', () => {
      const plan = qa.planDecision(waiting, { manual_test_result: 'pass' });

      expect(plan.add).toStrictEqual([LABEL.MANUAL_PASS]);
      expect(plan.remove).toContain(LABEL.NEEDS_MANUAL);
      expect(plan.status).toBeNull();
      expect(qa.planDecision(waiting, { manual_test_result: 'pass' }, { autoClose: true }).status).toStrictEqual(STATUS.DONE);
    });

    it('fail: reopens', () => {
      const plan = qa.planDecision(waiting, { manual_test_result: 'fail' });

      expect(plan.add).toStrictEqual([LABEL.MANUAL_FAIL]);
      expect(plan.status).toStrictEqual(STATUS.REOPENED);
    });

    it('none: marks pending without a comment', () => {
      const plan = qa.planDecision(waiting, { manual_test_result: 'none' });

      expect(plan.add).toStrictEqual([LABEL.MANUAL_PENDING]);
      expect(plan.headline).toBeNull();
    });
  });
});

describe('validateDecision', () => {
  const full = {
    is_automatable: 'true', automation_sufficient: 'false', manual_test: 'false', analysis_markdown: 'body'
  };

  it('accepts a complete review decision', () => {
    expect(qa.validateDecision({ mode: 'review' }, full)).toBeNull();
  });

  it.each([
    ['is_automatable', { ...full, is_automatable: undefined }],
    ['manual_test', { ...full, manual_test: '' }],
    ['automation_sufficient', { ...full, automation_sufficient: undefined }],
    ['analysis_markdown', { ...full, analysis_markdown: '  ' }],
  ])('rejects a review decision without %s instead of defaulting to false', (field, decision) => {
    expect(qa.validateDecision({ mode: 're-review' }, decision)).toStrictEqual(`${ field } is missing`);
  });

  it('does not need automation_sufficient when the issue is not automatable', () => {
    expect(qa.validateDecision({ mode: 'review' }, { ...full, is_automatable: 'false', automation_sufficient: undefined })).toBeNull();
  });

  it('needs a known manual_test_result in manual-check', () => {
    expect(qa.validateDecision({ mode: 'manual-check' }, { manual_test_result: 'none' })).toBeNull();
    expect(qa.validateDecision({ mode: 'manual-check' }, {})).toStrictEqual('manual_test_result is missing');
  });
});

describe('matchDecisions', () => {
  const queue = [{ number: 1, mode: 'manual-check' }, { number: 2, mode: 'manual-check' }];

  it('drops decisions for issues outside the queue, invalid ones and duplicates', () => {
    const { matched, rejected } = qa.matchDecisions(queue, [
      { issue_number: '2' },
      { issue_number: '1', manual_test_result: 'pass', n: 'first' },
      { issue_number: '#1', manual_test_result: 'fail', n: 'second' },
      { issue_number: '99', manual_test_result: 'pass' },
    ]);

    expect(matched.map((m: any) => m.decision.n)).toStrictEqual(['first']);
    expect(rejected.map((r: any) => r.reason)).toStrictEqual([
      'manual_test_result is missing',
      'duplicate decision for the same issue',
      'issue is not in this run\'s queue',
    ]);
  });
});

describe('formatComment', () => {
  it('ends with a marker that parses back to the stored state', () => {
    const plan = qa.planDecision({ mode: 'review', labels: [], round: 0 }, {
      is_automatable: true, automation_sufficient: false, manual_test: false
    });
    const body = qa.formatComment(plan, { analysis_markdown: '- add a unit test' }, { round: plan.round });

    expect(body.startsWith('<details open>')).toStrictEqual(true);
    expect(body).toContain('- add a unit test');
    expect(qa.parseMarker(body)).toStrictEqual({ v: 1, round: 1 });
  });
});
