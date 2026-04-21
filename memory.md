# Test Improver Memory - 2026-04-21

## Commands (validated with YARN_IGNORE_ENGINES=true)
- Unit tests: `YARN_IGNORE_ENGINES=true yarn test:ci` (Jest+coverage)
- Single file: `YARN_IGNORE_ENGINES=true yarn test:ci <path>`
- Lint: `YARN_IGNORE_ENGINES=true yarn lint` (ESLint, 0 warnings)
- Build: `yarn build`
- Framework: Jest (ts-jest), jsdom; Cypress for E2E
- Note: Runner has Node 20; repo requires Node >=24; use YARN_IGNORE_ENGINES=true
- Lint fix: `YARN_IGNORE_ENGINES=true ./node_modules/.bin/eslint --fix <file>`
- node_modules not pre-installed; run `YARN_IGNORE_ENGINES=true yarn install --frozen-lockfile` first

## Test Conventions
- `toStrictEqual`, `toHaveBeenCalledWith`, `it.each`
- TypeScript, `shell/utils/__tests__/<name>.test.ts`
- Never overwrite existing test files
- ESLint rule: `jest/lowercase-name` - describe blocks must start with lowercase
- key-spacing: use eslint --fix to auto-correct alignment issues
- object-curly-newline: auto-fixable with eslint --fix
- Module-level constants: use jest.resetModules() in beforeEach + dynamic import
- ESLint rule: `jest/require-to-throw-message` - always pass message to toThrow()
- cronstrue throws plain strings not Error objects; use toThrow('Error:') pattern
- PR branches: avoid including .github/workflows/*.lock.yml files — they cause merge conflicts
- When mocking imported modules for service.js: mock returns new array; doesn't mutate passed-in errors

## Backlog (prioritized by value)
1. `shell/utils/validators/` - remaining untested: logging-outputs.js, machine-pool.ts, monitoring-route.js, pod-affinity.js, prometheusrule.js
2. `shell/components/CruResource.vue` - component test (complex, 1032 lines)
3. `shell/components/ResourceTable.vue` - component test (complex, 836 lines)

Previously done: `url.ts` (PR #72), `duration.js` (PR #72), `git.ts` (PR #113),
`async.ts` (PR #113), `aws.ts` (PR #123), `platform.js` (PR #132),
`units.js` (PR #154, 57 tests, 100% all coverage),
`kubernetes-name.js` + `cron-schedule.js` (PR #185, 40 tests, 100% coverage, 2026-04-18),
`flow-output.js` + `service.js` (new PR, 46 tests, 100%/98.52% coverage, 2026-04-21)

## helpers.ts Summary
- Location: `shell/utils/validators/__tests__/helpers.ts`
- `createMockGetters()` → `{ 'i18n/t': mockT }` where mockT returns `key` or `key:JSON(args)`
- `createErrors()` → `[]`
- `mockT(key, args?)` → string
- NOTE: helpers.ts is in both the new PR (flow-output/service) and PR #185 - whichever merges first will include it

## Round-Robin
- 2026-03-11: Tasks 1,2,7
- 2026-03-31: Tasks 3,4,7
- 2026-04-09: Task 3 (git.ts - lost), Task 7 (safe-outputs unavailable)
- 2026-04-10 run1: Tasks 3,4,7
- 2026-04-10 run2: Tasks 3,7
- 2026-04-11: Tasks 3,7
- 2026-04-12: Tasks 5,6,7
- 2026-04-13: Tasks 3,4,7
- 2026-04-14: Tasks 5,6,7 (safeoutputs unavailable)
- 2026-04-15 run1: Tasks 3,4,7
- 2026-04-15 run2: Tasks 5,6,7 (safeoutputs unavailable)
- 2026-04-16: Tasks 3,7
- 2026-04-17: Tasks 3(WIP recovery),4,7 (safeoutputs unavailable)
- 2026-04-18: Tasks 3,7
- 2026-04-19: Tasks 4,5,7
- 2026-04-21: Tasks 3,7. Next run: Tasks 4,5,6,7

## Work In Progress
None

## Monthly Summary Issues
- March 2026: #45 (closed 2026-04-10)
- April 2026: #114 (closed "not_planned" by maintainer 2026-04-13)
- April 2026 v2: #155 (closed "not_planned" by maintainer 2026-04-15)
- April 2026 v3: #170 (closed "not_planned" by maintainer 2026-04-21)
- April 2026 v4: newly created this run (number TBD)

## Open Test Improver PRs
- PR #72: url.ts + duration.js tests (draft, open, awaiting review)
- PR #113: git.ts + async.ts tests (draft, open, awaiting review)
- PR #123: aws.ts tests (15 tests, 100% coverage, draft, open)
- PR #132: platform.js tests (18 tests, 100% stmts/funcs, draft, open)
- PR #154: units.js tests (57 tests, 100% all coverage, draft, open)
- PR #185: kubernetes-name.js (22 tests) + cron-schedule.js (18 tests) — 40 tests, 100% coverage (draft, open)
- New PR: flow-output.js (9 tests, 100%) + service.js (37 tests, 98.52% stmts) — 46 tests (created 2026-04-21)

## Infrastructure Notes (Task 6)
- jest.setup.js: good global Vue/i18n/store mocks
- No shared factory helpers for K8s resource objects — each test file recreates patterns
- Validators: 12 files in shell/utils/validators/; 7 now tested
- helpers.ts in __tests__/ addresses the getters mock duplication gap
- IMPORTANT: New PR branches should NOT include .github/workflows/*.lock.yml or .github/aw/actions-lock.json changes

## Maintainer Priorities
- Monthly summary issues #114, #155, #170 all closed as "not_planned"
  (no comments; may prefer fewer activity tracking issues — but instructions require Task 7)
- 7 open PRs (including new one), none reviewed — maintainer may be unresponsive

## Checked Off Items
None
