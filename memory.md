# Test Improver Memory - 2026-04-15

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

## Backlog (prioritized by value)
1. `shell/utils/validators/` - remaining untested: container-images.js, flow-output.js, formRules/ (partial), index.js, logging-outputs.js, machine-pool.ts, monitoring-route.js, pod-affinity.js, prometheusrule.js, service.js
2. `shell/components/CruResource.vue` - component test (complex, 1032 lines)
3. `shell/components/ResourceTable.vue` - component test (complex, 836 lines)

Previously done: `url.ts` (PR #72), `duration.js` (PR #72), `git.ts` (PR #113),
`async.ts` (PR #113), `aws.ts` (PR #123), `platform.js` (PR #132),
`units.js` (PR #154, 57 tests, 100% all coverage),
`cluster-name.js` + `role-template.js` (issue #169 created, no PR — safeoutputs failed)
`kubernetes-name.js` + `cron-schedule.js` (branch ready, no PR yet — safeoutputs unavailable)

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
- 2026-04-15 run2: Tasks 5,6,7 (safeoutputs unavailable). Next run: Tasks 3,4,7

## Work In Progress
- Branch `test-assist/validators-infra-2026` created locally with:
  - `shell/utils/validators/__tests__/helpers.ts` (shared mock utilities)
  - `shell/utils/validators/__tests__/kubernetes-name.test.ts` (21 tests, 100% cov)
  - `shell/utils/validators/__tests__/cron-schedule.test.ts` (18 tests, 100% cov)
  - 39 tests pass, lint clean
  - NEEDS: re-create branch and push via create_pull_request when safeoutputs available

## helpers.ts Summary (recreate if needed)
- `createMockGetters()` → `{ 'i18n/t': mockT }` where mockT returns `key` or `key:JSON(args)`
- `createErrors()` → `[]`
- `mockT(key, args?)` → string
- File: `shell/utils/validators/__tests__/helpers.ts`

## Monthly Summary Issues
- March 2026: #45 (closed 2026-04-10)
- April 2026: #114 (closed "not_planned" by maintainer 2026-04-13)
- April 2026 v2: #155 (closed "not_planned" by maintainer 2026-04-15)
- April 2026 v3: #170 (open, created 2026-04-15)

## Open Test Improver PRs
- PR #72: url.ts + duration.js tests (draft, open, awaiting review)
- PR #113: git.ts + async.ts tests (draft, open, awaiting review)
- PR #123: aws.ts tests (15 tests, 100% coverage, draft, open)
- PR #132: platform.js tests (18 tests, 100% stmts/funcs, draft, open)
- PR #154: units.js tests (57 tests, 100% all coverage, draft, open)

## Infrastructure Notes (Task 6)
- jest.setup.js: good global Vue/i18n/store mocks
- No shared factory helpers for K8s resource objects — each test file recreates patterns
- Validators: 12 files in shell/utils/validators/; cidr + setting + cluster-name + role-template tested
- helpers.ts in __tests__/ addresses the getters mock duplication gap

## Maintainer Priorities
- Monthly summary issues #114 and #155 both closed as "not_planned" on 2026-04-13 and 2026-04-15
  (no comments; may prefer fewer activity tracking issues — but instructions require Task 7)
- 5 open PRs, none reviewed — maintainer may be unresponsive

## Checked Off Items
None
