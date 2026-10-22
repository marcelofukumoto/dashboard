#!/usr/bin/env node

/**
 * Deterministic half of the daily QA review gh-aw workflow (daily-qa-review-test-coverage.md).
 *
 * The agent only judges coverage. Everything else lives here:
 *
 * - `queue`: picks the issues that need a look from the UI Project Board, based on where each issue is
 *   NOW (not on a time window), and skips any issue that has not changed since the last review. A
 *   missed run therefore loses nothing: the next run sees the same pending work.
 * - `apply`: turns each agent decision into labels, a comment and a board move through a fixed table.
 *
 * Review state is stored on the issue itself, in a hidden marker inside the bot's latest comment:
 *   <!-- qa-review-state {"v":1,"status_at":"...","prs":["123@sha"],"last_comment":456,"round":1} -->
 *
 * Env:
 * - GH_TOKEN: token with issues:write (GITHUB_TOKEN is enough)
 * - GH_PROJECT_TOKEN: token with organization projects read/write
 * - GITHUB_REPOSITORY: "owner/repo"
 * - QA_REVIEW_PROJECT: optional, "org/number" (default rancher/57)
 * - QA_REVIEW_MAX_ISSUES: optional, issues per run (default 15)
 * - QA_REVIEW_AUTO_CLOSE: "true" closes issues whose outcome is Done (default: leave them for QA)
 * - QA_REVIEW_QUEUE: path of the queue file (default /tmp/gh-aw/agent/qa-review-queue.json)
 * - GH_AW_AGENT_OUTPUT: (apply) path of the agent output file, set by gh-aw
 * - DRY_RUN or GH_AW_SAFE_OUTPUTS_STAGED: "true" logs instead of writing
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---------------------------------------------------------

const [PROJECT_ORG, PROJECT_NUMBER] = (process.env.QA_REVIEW_PROJECT || 'rancher/57').split('/');

const MAX_ISSUES = Number(process.env.QA_REVIEW_MAX_ISSUES) || 15;
const AUTO_CLOSE = process.env.QA_REVIEW_AUTO_CLOSE === 'true';
const QUEUE_FILE = process.env.QA_REVIEW_QUEUE || '/tmp/gh-aw/agent/qa-review-queue.json';
const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.GH_AW_SAFE_OUTPUTS_STAGED === 'true';

// After this many rounds of "needs more automation", a human takes over.
const MAX_SUGGESTION_ROUNDS = 3;

const STATUS = {
  QA_REVIEW: 'QA Review',
  TO_TEST:   'To Test',
  QA_WORKING: 'QA Working',
  REOPENED:  'Reopened',
  DONE:      'Done',
};

const LABEL = {
  REVIEWED:            'bot/qa-reviewed',
  SUFFICIENT:          'bot/test-automation-sufficient',
  NEEDS_MORE:          'bot/needs-more-test-automation',
  NOT_AUTOMATABLE:     'bot/not-automatable',
  NEEDS_MANUAL:        'bot/needs-manual-test',
  NO_MANUAL:           'bot/no-manual-test-needed',
  MANUAL_PENDING:      'bot/manual-test-pending',
  MANUAL_PASS:         'bot/manual-test-pass',
  MANUAL_FAIL:         'bot/manual-test-failed',
  MAJOR_CHANGE:        'bot/major-change-detected',
  HUMAN_REVIEW:        'bot/manual-qa-review-required',
  SKIP:                'bot/skip-qa-review',
};

const BOT_AUTHORS = ['rancher-ui-project-bot'];

const MARKER_RE = /<!-- qa-review-state (\{.*?\}) -->/;

// --- Selection (pure) ------------------------------------------------------

function labelSet(labels) {
  return new Set((labels || []).map((l) => l.toLowerCase()));
}

// Reason to leave the issue alone entirely, or null.
function exclusionReason(issue) {
  const labels = labelSet(issue.labels);

  if (labels.has(LABEL.SKIP)) {
    return `excluded label: ${ LABEL.SKIP }`;
  }

  if (labels.has('qa/none') && !labels.has('qa/dev-automation')) {
    return 'excluded label: QA/None';
  }

  if (/^\s*\[backport/i.test(issue.title || '')) {
    return 'backport issue';
  }

  if (BOT_AUTHORS.includes(issue.author)) {
    return 'bot-authored issue';
  }

  if (labels.has(LABEL.HUMAN_REVIEW)) {
    return `waiting on QA (${ LABEL.HUMAN_REVIEW })`;
  }

  return null;
}

function parseMarker(body) {
  const match = MARKER_RE.exec(body || '');

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

function formatMarker(state) {
  return `<!-- qa-review-state ${ JSON.stringify({ v: 1, ...state }) } -->`;
}

function isHumanComment(comment) {
  const author = comment.author;

  if (!author || author.__typename === 'Bot' || BOT_AUTHORS.includes(author.login)) {
    return false;
  }

  return !MARKER_RE.test(comment.body || '');
}

// What the issue looks like right now. Bot comments (ours included) never change it.
function fingerprint(issue) {
  const humans = (issue.comments || []).filter(isHumanComment);

  return {
    status_at:    issue.statusAt,
    prs:          (issue.prs || []).filter((pr) => pr.merged).map((pr) => `${ pr.number }@${ pr.mergeSha }`).sort(),
    last_comment: humans.length ? humans[humans.length - 1].id : null,
  };
}

function sameFingerprint(a, b) {
  return !!a && !!b &&
    a.status_at === b.status_at &&
    a.last_comment === b.last_comment &&
    JSON.stringify(a.prs || []) === JSON.stringify(b.prs || []);
}

// The latest comment carrying our marker, with the state parsed out of it.
function lastReview(comments) {
  for (let i = (comments || []).length - 1; i >= 0; i--) {
    const state = parseMarker(comments[i].body);

    if (state) {
      return { commentId: comments[i].id, state };
    }
  }

  return null;
}

/**
 * Decide what (if anything) the agent has to do for an issue.
 *
 * Returns { mode, reason } where mode is one of:
 * - 'review': first look at an issue in QA Review
 * - 're-review': an issue we reviewed before is back in QA Review with something new
 * - 'manual-check': an issue waiting on manual tests got a new comment to read
 * - null: nothing to do (reason says why)
 */
function classify(issue) {
  const excluded = exclusionReason(issue);

  if (excluded) {
    return { mode: null, reason: excluded };
  }

  const labels = labelSet(issue.labels);
  const previous = lastReview(issue.comments);
  const current = fingerprint(issue);

  if (issue.status === STATUS.QA_REVIEW) {
    // Removing bot/qa-reviewed by hand is the way to ask for a fresh review.
    if (!labels.has(LABEL.REVIEWED) || !previous) {
      return { mode: 'review', reason: 'not reviewed yet' };
    }

    if (sameFingerprint(current, previous.state)) {
      return { mode: null, reason: 'unchanged since last review' };
    }

    return { mode: 're-review', reason: changeReason(previous.state, current) };
  }

  if ([STATUS.TO_TEST, STATUS.QA_WORKING].includes(issue.status) && labels.has(LABEL.NEEDS_MANUAL)) {
    if (current.last_comment && current.last_comment !== previous?.state?.last_comment) {
      return { mode: 'manual-check', reason: 'new comment since last check' };
    }

    return { mode: null, reason: 'no new comment while waiting on manual tests' };
  }

  return { mode: null, reason: `not handled in status ${ issue.status }` };
}

function changeReason(before, now) {
  const reasons = [];

  if (before.status_at !== now.status_at) {
    reasons.push('moved back to QA Review');
  }
  if (JSON.stringify(before.prs || []) !== JSON.stringify(now.prs)) {
    reasons.push('new merged PRs');
  }
  if (before.last_comment !== now.last_comment) {
    reasons.push('new comments');
  }

  return reasons.join(', ');
}

// Oldest first, so nothing starves when the per-run cap is hit.
function planQueue(candidates, maxIssues) {
  const sorted = [...candidates].sort((a, b) => (a.statusAt || '').localeCompare(b.statusAt || '') || a.number - b.number);

  return { selected: sorted.slice(0, Math.max(0, maxIssues)), deferred: sorted.slice(Math.max(0, maxIssues)) };
}

// --- Decision table (pure) -------------------------------------------------

const HEADLINE = {
  notAutomatableManual:   'This issue is not currently a good candidate for automated coverage. A round of manual tests is required.',
  notAutomatableNoManual: 'This issue is not currently a good candidate for automated coverage. No manual tests required.',
  sufficientManual:       'Automated tests appear sufficient for this issue. A round of manual tests is still required.',
  sufficientNoManual:     'Automated tests appear sufficient for this issue. No manual tests required.',
  needsMoreManual:        'Automated tests are not yet sufficient for this issue, and a round of manual tests is required. Please address the suggestions below.',
  needsMoreNoManual:      'Automated tests are not yet sufficient for this issue. No manual tests required. Please address the suggestions below.',
  humanReview:            `Automated tests are still not sufficient after ${ MAX_SUGGESTION_ROUNDS } rounds of suggestions. Handing over to the QA team.`,
  majorChange:            'Major change or refactor detected since the last review, so this is a fresh review.',
  manualPass:             'Manual test reports show the expected behavior.',
  manualFail:             'Manual test reports show a failure.',
};

function bool(value) {
  return value === true || value === 'true';
}

/**
 * Map one agent decision to the exact changes to make. Pure: same input, same plan.
 *
 * entry: the queue entry (mode, labels, round)
 * decision: the agent's tool call
 *
 * Returns { add: [], remove: [], status: string|null, close: bool, headline: string|null, open: bool, round }
 * where headline null means "no comment, only refresh the stored state".
 */
function planDecision(entry, decision, { autoClose = false } = {}) {
  const labels = labelSet(entry.labels);
  const prevRound = entry.round || 0;

  if (entry.mode === 'manual-check') {
    const result = decision.manual_test_result || 'none';

    if (result === 'pass') {
      const done = !labels.has(LABEL.NEEDS_MORE);

      return {
        add:      [LABEL.MANUAL_PASS],
        remove:   [LABEL.NEEDS_MANUAL, LABEL.MANUAL_PENDING, LABEL.MANUAL_FAIL],
        status:   done && autoClose ? STATUS.DONE : null,
        close:    done && autoClose,
        headline: HEADLINE.manualPass,
        open:     false,
        round:    prevRound,
      };
    }

    if (result === 'fail') {
      return {
        add:      [LABEL.MANUAL_FAIL],
        remove:   [LABEL.MANUAL_PENDING, LABEL.MANUAL_PASS],
        status:   STATUS.REOPENED,
        close:    false,
        headline: HEADLINE.manualFail,
        open:     true,
        round:    prevRound,
      };
    }

    return {
      add: [LABEL.MANUAL_PENDING], remove: [], status: null, close: false, headline: null, open: false, round: prevRound
    };
  }

  const automatable = bool(decision.is_automatable);
  const sufficient = automatable && bool(decision.automation_sufficient);
  const manual = bool(decision.manual_test);
  const major = entry.mode === 're-review' && bool(decision.major_change);

  const coverage = !automatable ? LABEL.NOT_AUTOMATABLE : sufficient ? LABEL.SUFFICIENT : LABEL.NEEDS_MORE;
  const manualLabel = manual ? LABEL.NEEDS_MANUAL : LABEL.NO_MANUAL;

  // A major change starts the suggestion count again.
  const baseRound = major ? 0 : prevRound;
  const round = coverage === LABEL.NEEDS_MORE ? baseRound + 1 : baseRound;
  const handOver = coverage === LABEL.NEEDS_MORE && round >= MAX_SUGGESTION_ROUNDS;

  const add = [LABEL.REVIEWED, coverage, manualLabel];

  if (major) {
    add.push(LABEL.MAJOR_CHANGE);
  }
  if (handOver) {
    add.push(LABEL.HUMAN_REVIEW);
  }

  // Keep exactly one label per group, and clear results from an earlier cycle.
  const remove = [LABEL.SUFFICIENT, LABEL.NEEDS_MORE, LABEL.NOT_AUTOMATABLE, LABEL.NEEDS_MANUAL, LABEL.NO_MANUAL,
    LABEL.MANUAL_PENDING, LABEL.MANUAL_PASS, LABEL.MANUAL_FAIL, LABEL.MAJOR_CHANGE].filter((l) => !add.includes(l));

  let status;
  let close = false;

  if (handOver) {
    status = null; // stays in QA Review for the QA team
  } else if (coverage === LABEL.NEEDS_MORE) {
    status = STATUS.REOPENED;
  } else if (manual) {
    status = STATUS.TO_TEST;
  } else {
    status = autoClose ? STATUS.DONE : null;
    close = autoClose;
  }

  let headline;

  if (handOver) {
    headline = HEADLINE.humanReview;
  } else if (!automatable) {
    headline = manual ? HEADLINE.notAutomatableManual : HEADLINE.notAutomatableNoManual;
  } else if (sufficient) {
    headline = manual ? HEADLINE.sufficientManual : HEADLINE.sufficientNoManual;
  } else {
    headline = manual ? HEADLINE.needsMoreManual : HEADLINE.needsMoreNoManual;
  }

  if (major) {
    headline = `${ HEADLINE.majorChange } ${ headline }`;
  }

  return {
    add, remove, status, close, headline, open: coverage === LABEL.NEEDS_MORE || major, round
  };
}

function formatComment(plan, decision, state) {
  return [
    `<details${ plan.open ? ' open' : '' }>`,
    '<summary>',
    '',
    '### 🤖 QA review analysis',
    '',
    '</summary>',
    '',
    `**${ plan.headline }**`,
    '',
    (decision.analysis_markdown || '').trim(),
    '',
    '_This analysis was generated automatically from the repository\'s QA review decision model._',
    '</details>',
    '',
    formatMarker(state),
  ].join('\n');
}

// --- GitHub API ------------------------------------------------------------

async function githubFetch(token, method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : `https://api.github.com${ url }`, {
    method,
    headers: {
      'User-Agent':    'qa-review',
      'Authorization': `token ${ token }`,
      'Accept':        'application/vnd.github+json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`${ method } ${ url } -> HTTP ${ res.status }: ${ text }`);
  }

  return text ? JSON.parse(text) : {};
}

async function graphql(token, query, variables = {}) {
  const res = await githubFetch(token, 'POST', '/graphql', { query, variables });

  if (res.errors) {
    throw new Error(`GraphQL error: ${ JSON.stringify(res.errors) }`);
  }

  return res.data;
}

async function fetchProject(token) {
  const data = await graphql(token, `query($org: String!, $num: Int!) {
    organization(login: $org) {
      projectV2(number: $num) {
        id
        field(name: "Status") { ... on ProjectV2SingleSelectField { id options { id name } } }
      }
    }
  }`, { org: PROJECT_ORG, num: Number(PROJECT_NUMBER) });

  const project = data.organization?.projectV2;

  if (!project?.field) {
    throw new Error(`Project ${ PROJECT_ORG }/${ PROJECT_NUMBER } or its Status field was not found`);
  }

  return {
    id:            project.id,
    statusFieldId: project.field.id,
    options:       Object.fromEntries(project.field.options.map((o) => [o.name, o.id])),
  };
}

// Open issues of this repo sitting in one of `statuses` on the board. Paginated.
async function fetchBoardItems(token, owner, repo, statuses) {
  const filter = `is:issue is:open repo:${ owner }/${ repo } status:${ statuses.map((s) => `"${ s }"`).join(',') }`;
  const items = [];
  let after = null;

  for (;;) {
    const data = await graphql(token, `query($org: String!, $num: Int!, $filter: String!, $after: String) {
      organization(login: $org) {
        projectV2(number: $num) {
          items(first: 100, after: $after, query: $filter) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              status: fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name updatedAt } }
              content { ... on Issue { number title author { login } labels(first: 50) { nodes { name } } } }
            }
          }
        }
      }
    }`, {
      org: PROJECT_ORG, num: Number(PROJECT_NUMBER), filter, after
    });

    const page = data.organization.projectV2.items;

    for (const node of page.nodes) {
      if (node.content?.number && statuses.includes(node.status?.name)) {
        items.push({
          itemId:   node.id,
          number:   node.content.number,
          title:    node.content.title,
          author:   node.content.author?.login,
          labels:   node.content.labels.nodes.map((l) => l.name),
          status:   node.status.name,
          statusAt: node.status.updatedAt,
        });
      }
    }

    if (!page.pageInfo.hasNextPage) {
      return items;
    }

    after = page.pageInfo.endCursor;
  }
}

// Comments plus every PR linked to the issue (closing references and cross-references).
async function fetchIssueDetail(token, owner, repo, number) {
  const data = await graphql(token, `query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        comments(last: 100) { nodes { databaseId body createdAt author { login __typename } } }
        closedByPullRequestsReferences(first: 25, includeClosedPrs: true) {
          nodes { number title state merged mergedAt mergeCommit { oid } repository { nameWithOwner } }
        }
        timelineItems(last: 100, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            ... on CrossReferencedEvent { source { ... on PullRequest { number title state merged mergedAt mergeCommit { oid } repository { nameWithOwner } } } }
            ... on ConnectedEvent { subject { ... on PullRequest { number title state merged mergedAt mergeCommit { oid } repository { nameWithOwner } } } }
          }
        }
      }
    }
  }`, { owner, repo, number });

  const issue = data.repository?.issue;

  if (!issue) {
    throw new Error(`Unable to fetch detail for issue #${ number }`);
  }

  const prs = new Map();
  const linked = [
    ...issue.closedByPullRequestsReferences.nodes,
    ...issue.timelineItems.nodes.map((n) => n.source || n.subject),
  ];

  for (const pr of linked) {
    if (pr?.number && pr.repository?.nameWithOwner === `${ owner }/${ repo }`) {
      prs.set(pr.number, {
        number: pr.number, title: pr.title, state: pr.state, merged: pr.merged, mergedAt: pr.mergedAt, mergeSha: pr.mergeCommit?.oid || null
      });
    }
  }

  return {
    comments: issue.comments.nodes.map((c) => ({
      id: c.databaseId, body: c.body, createdAt: c.createdAt, author: c.author
    })),
    prs: [...prs.values()].sort((a, b) => a.number - b.number),
  };
}

const TEST_FILE_RE = /(\.(test|spec)\.[jt]sx?$)|(\/__tests__\/)|(^cypress\/)/;

async function fetchPrFiles(token, owner, repo, number) {
  const files = await githubFetch(token, 'GET', `/repos/${ owner }/${ repo }/pulls/${ number }/files?per_page=100`);

  return files.map((f) => ({
    path: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, test: TEST_FILE_RE.test(f.filename)
  }));
}

// --- queue -----------------------------------------------------------------

async function buildQueue(owner, repo) {
  const projectToken = requireEnv('GH_PROJECT_TOKEN');
  const token = requireEnv('GH_TOKEN');

  const items = await fetchBoardItems(projectToken, owner, repo, [STATUS.QA_REVIEW, STATUS.TO_TEST, STATUS.QA_WORKING]);

  console.log(`Board items in QA Review / To Test / QA Working: ${ items.length }`);

  const candidates = [];

  for (const item of items) {
    // Cheap checks first: most To Test items are not ours, and exclusions need no extra calls.
    const quick = exclusionReason(item);

    if (quick) {
      console.log(`[skip] #${ item.number } — ${ quick }`);
      continue;
    }
    if (item.status !== STATUS.QA_REVIEW && !labelSet(item.labels).has(LABEL.NEEDS_MANUAL)) {
      continue;
    }

    const issue = { ...item, ...(await fetchIssueDetail(token, owner, repo, item.number)) };
    const { mode, reason } = classify(issue);

    if (!mode) {
      console.log(`[skip] #${ item.number } — ${ reason }`);
      continue;
    }

    candidates.push({ issue, mode, reason });
  }

  const { selected, deferred } = planQueue(candidates.map((c) => ({ ...c, statusAt: c.issue.statusAt, number: c.issue.number })), MAX_ISSUES);

  for (const c of deferred) {
    console.log(`[deferred] #${ c.number } — over the ${ MAX_ISSUES }-issue cap, next run`);
  }

  const queue = [];

  for (const { issue, mode, reason } of selected) {
    const previous = lastReview(issue.comments);

    for (const pr of issue.prs) {
      if (pr.merged) {
        pr.files = await fetchPrFiles(token, owner, repo, pr.number);
      }
    }

    console.log(`[queued] #${ issue.number } — ${ mode }: ${ reason }`);

    queue.push({
      number:            issue.number,
      title:             issue.title,
      url:               `https://github.com/${ owner }/${ repo }/issues/${ issue.number }`,
      mode,
      reason,
      status:            issue.status,
      status_at:         issue.statusAt,
      item_id:           issue.itemId,
      labels:            issue.labels,
      round:             previous?.state?.round || 0,
      last_review_at:    previous ? issue.comments.find((c) => c.id === previous.commentId)?.createdAt : null,
      last_review_id:    previous?.commentId || null,
      fingerprint:       fingerprint(issue),
      prs:               issue.prs,
    });
  }

  return { queue, deferred: deferred.length };
}

// --- apply -----------------------------------------------------------------

function readDecisions(file) {
  const output = JSON.parse(fs.readFileSync(file, 'utf8'));

  return (output.items || []).filter((item) => item.type === 'apply_qa_decision');
}

// Reason a decision cannot be applied, or null. A missing answer must never default to false.
function validateDecision(entry, decision) {
  if (entry.mode === 'manual-check') {
    return ['none', 'pass', 'fail'].includes(decision.manual_test_result) ? null : 'manual_test_result is missing';
  }

  for (const field of ['is_automatable', 'manual_test']) {
    if (decision[field] === undefined || decision[field] === '') {
      return `${ field } is missing`;
    }
  }

  if (bool(decision.is_automatable) && (decision.automation_sufficient === undefined || decision.automation_sufficient === '')) {
    return 'automation_sufficient is missing';
  }

  if (!(decision.analysis_markdown || '').trim()) {
    return 'analysis_markdown is missing';
  }

  return null;
}

// One valid decision per queued issue: unknown issues, invalid decisions and duplicates are dropped.
function matchDecisions(queue, decisions) {
  const byNumber = new Map(queue.map((e) => [String(e.number), e]));
  const matched = new Map();
  const rejected = [];

  for (const decision of decisions) {
    const key = String(decision.issue_number).replace(/^#/, '');

    if (!byNumber.has(key)) {
      rejected.push({ decision, reason: 'issue is not in this run\'s queue' });
    } else if (matched.has(key)) {
      rejected.push({ decision, reason: 'duplicate decision for the same issue' });
    } else if (validateDecision(byNumber.get(key), decision)) {
      rejected.push({ decision, reason: validateDecision(byNumber.get(key), decision) });
    } else {
      matched.set(key, { entry: byNumber.get(key), decision });
    }
  }

  return { matched: [...matched.values()], rejected };
}

async function currentStatus(projectToken, itemId) {
  const data = await graphql(projectToken, `query($id: ID!) {
    node(id: $id) { ... on ProjectV2Item { fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } } } }
  }`, { id: itemId });

  return data.node?.fieldValueByName?.name || null;
}

async function applyOne(ctx, entry, decision) {
  const {
    owner, repo, token, projectToken, project
  } = ctx;
  const plan = planDecision(entry, decision, { autoClose: AUTO_CLOSE });
  const issuePath = `/repos/${ owner }/${ repo }/issues/${ entry.number }`;
  const log = (msg) => console.log(`#${ entry.number }: ${ msg }`);

  // The board may have moved on while the agent was thinking; never fight a human.
  const status = await currentStatus(projectToken, entry.item_id);

  if (status !== entry.status) {
    log(`moved from ${ entry.status } to ${ status } during the run, leaving it alone`);

    return 'skipped';
  }

  const state = { ...entry.fingerprint, round: plan.round };
  const labels = labelSet(entry.labels);
  const add = plan.add.filter((l) => !labels.has(l));
  const remove = plan.remove.filter((l) => labels.has(l));

  log(`${ entry.mode } -> add [${ add.join(', ') }] remove [${ remove.join(', ') }] ` +
    `status ${ plan.status || '(unchanged)' }${ plan.close ? ' + close' : '' } round ${ plan.round }`);

  if (DRY_RUN) {
    return 'dry-run';
  }

  if (plan.headline) {
    await githubFetch(token, 'POST', `${ issuePath }/comments`, { body: formatComment(plan, decision, state) });

    if (entry.last_review_id) {
      await hideComment(token, owner, repo, entry.last_review_id).catch((e) => log(`could not hide the previous review: ${ e.message }`));
    }
  } else if (entry.last_review_id) {
    // Nothing new to say; refresh the stored state so this comment is not re-read tomorrow.
    const previous = await githubFetch(token, 'GET', `/repos/${ owner }/${ repo }/issues/comments/${ entry.last_review_id }`);

    await githubFetch(token, 'PATCH', `/repos/${ owner }/${ repo }/issues/comments/${ entry.last_review_id }`, { body: previous.body.replace(MARKER_RE, formatMarker(state)) });
  }

  if (add.length) {
    await githubFetch(token, 'POST', `${ issuePath }/labels`, { labels: add });
  }
  for (const label of remove) {
    await githubFetch(token, 'DELETE', `${ issuePath }/labels/${ encodeURIComponent(label) }`);
  }

  if (plan.status && plan.status !== entry.status) {
    await moveItem(projectToken, project, entry.item_id, plan.status);
  }

  if (plan.close) {
    await githubFetch(token, 'PATCH', issuePath, { state: 'closed', state_reason: 'completed' });
  }

  return 'applied';
}

async function moveItem(projectToken, project, itemId, status) {
  const optionId = project.options[status];

  if (!optionId) {
    throw new Error(`Status "${ status }" is not an option on the project board`);
  }

  await graphql(projectToken, `mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
    updateProjectV2ItemFieldValue(input: { projectId: $project, itemId: $item, fieldId: $field, value: { singleSelectOptionId: $option } }) { projectV2Item { id } }
  }`, {
    project: project.id, item: itemId, field: project.statusFieldId, option: optionId
  });
}

async function hideComment(token, owner, repo, commentId) {
  const comment = await githubFetch(token, 'GET', `/repos/${ owner }/${ repo }/issues/comments/${ commentId }`);

  await graphql(token, `mutation($id: ID!) { minimizeComment(input: { subjectId: $id, classifier: OUTDATED }) { clientMutationId } }`, { id: comment.node_id });
}

// --- Main ------------------------------------------------------------------

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${ name } must be set`);
  }

  return process.env[name];
}

function summary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  }
}

async function main(command) {
  const repository = requireEnv('GITHUB_REPOSITORY');
  const [owner, repo] = repository.split('/');

  if (command === 'queue') {
    const { queue, deferred } = await buildQueue(owner, repo);

    fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${ queue.length }\n`);
    }

    console.log(`Queued ${ queue.length }, deferred ${ deferred }`);
    summary(`## QA review queue\n\n- Queued: ${ queue.length }\n- Deferred to next run: ${ deferred }\n\n` +
      queue.map((e) => `- #${ e.number } — ${ e.mode }: ${ e.reason }`).join('\n') + '\n');

    return;
  }

  if (command === 'apply') {
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const { matched, rejected } = matchDecisions(queue, readDecisions(requireEnv('GH_AW_AGENT_OUTPUT')));

    for (const { decision, reason } of rejected) {
      console.log(`[rejected] ${ decision.issue_number } — ${ reason }`);
    }

    const ctx = {
      owner, repo, token: requireEnv('GH_TOKEN'), projectToken: requireEnv('GH_PROJECT_TOKEN')
    };

    ctx.project = await fetchProject(ctx.projectToken);

    const counts = {
      applied: 0, 'dry-run': 0, skipped: 0, failed: 0
    };

    for (const { entry, decision } of matched) {
      try {
        counts[await applyOne(ctx, entry, decision)]++;
      } catch (e) {
        counts.failed++;
        console.error(`#${ entry.number }: failed, will be picked up again next run: ${ e.message }`);
      }
    }

    // Queued issues the agent never decided on keep their old state, so the next run retries them.
    const missing = queue.filter((e) => !matched.some((m) => m.entry.number === e.number));

    for (const e of missing) {
      console.log(`[no decision] #${ e.number } — retried next run`);
    }

    console.log(`Done${ DRY_RUN ? ' (dry-run)' : '' }. applied=${ counts.applied } skipped=${ counts.skipped } ` +
      `failed=${ counts.failed } rejected=${ rejected.length } no-decision=${ missing.length }`);
    summary(`## QA review apply${ DRY_RUN ? ' (dry-run)' : '' }\n\n` +
      `- Applied: ${ counts.applied + counts['dry-run'] }\n- Skipped (moved during run): ${ counts.skipped }\n` +
      `- Failed: ${ counts.failed }\n- Rejected: ${ rejected.length }\n- No decision: ${ missing.length }\n`);

    if (counts.failed) {
      process.exitCode = 1;
    }

    return;
  }

  throw new Error('Usage: qa-review.js queue|apply');
}

if (require.main === module) {
  main(process.argv[2]).catch((err) => {
    console.error(err.stack || err.message || err);
    process.exit(1);
  });
}

module.exports = {
  LABEL,
  STATUS,
  MAX_SUGGESTION_ROUNDS,
  exclusionReason,
  parseMarker,
  formatMarker,
  isHumanComment,
  fingerprint,
  sameFingerprint,
  lastReview,
  classify,
  planQueue,
  planDecision,
  formatComment,
  validateDecision,
  matchDecisions,
};
