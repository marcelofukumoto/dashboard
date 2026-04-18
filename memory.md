# Test Improver Memory - 2026-04-18

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

## Backlog (prioritized by value)
1. `shell/utils/validators/` - remaining untested: flow-output.js, logging-outputs.js, machine-pool.ts, monitoring-route.js, pod-affinity.js, prometheusrule.js, service.js
2. `shell/components/CruResource.vue` - component test (complex, 1032 lines)
3. `shell/components/ResourceTable.vue` - component test (complex, 836 lines)

Previously done: `url.ts` (PR #72), `duration.js` (PR #72), `git.ts` (PR #113),
`async.ts` (PR #113), `aws.ts` (PR #123), `platform.js` (PR #132),
`units.js` (PR #154, 57 tests, 100% all coverage),
`kubernetes-name.js` + `cron-schedule.js` (PR #185, 40 tests, 100% coverage, 2026-04-18)

## helpers.ts Summary
- Location: `shell/utils/validators/__tests__/helpers.ts`
- `createMockGetters()` → `{ 'i18n/t': mockT }` where mockT returns `key` or `key:JSON(args)`
- `createErrors()` → `[]`
- `mockT(key, args?)` → string

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
- 2026-04-18: Tasks 3,7. Next run: Tasks 4,5,7

## Work In Progress
None - kubernetes-name + cron-schedule PR created as #185 (2026-04-18)

## Monthly Summary Issues
- March 2026: #45 (closed 2026-04-10)
- April 2026: #114 (closed "not_planned" by maintainer 2026-04-13)
- April 2026 v2: #155 (closed "not_planned" by maintainer 2026-04-15)
- April 2026 v3: #170 (open, updated 2026-04-18)

## Open Test Improver PRs
- PR #72: url.ts + duration.js tests (draft, open, awaiting review)
- PR #113: git.ts + async.ts tests (draft, open, awaiting review)
- PR #123: aws.ts tests (15 tests, 100% coverage, draft, open)
- PR #132: platform.js tests (18 tests, 100% stmts/funcs, draft, open)
- PR #154: units.js tests (57 tests, 100% all coverage, draft, open)
- PR #185: kubernetes-name.js (22 tests) + cron-schedule.js (18 tests) — 40 tests, 100% coverage (draft, created 2026-04-18)
  NOTE: actual title is "test(validators): add unit tests for kubernetes-name and cron-schedule" (without [Test Improver] prefix)
- Note: 2026-04-17 verified all 5 older PRs' tests still pass on current master

## Infrastructure Notes (Task 6)
- jest.setup.js: good global Vue/i18n/store mocks
- No shared factory helpers for K8s resource objects — each test file recreates patterns
- Validators: 12 files in shell/utils/validators/; cidr + setting + kubernetes-name + cron-schedule tested
- helpers.ts in __tests__/ addresses the getters mock duplication gap

## Maintainer Priorities
- Monthly summary issues #114 and #155 both closed as "not_planned" on 2026-04-13 and 2026-04-15
  (no comments; may prefer fewer activity tracking issues — but instructions require Task 7)
- 6 open PRs, none reviewed — maintainer may be unresponsive

## Checked Off Items
None
