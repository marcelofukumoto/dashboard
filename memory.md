# Test Improver Memory - 2026-04-13

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

## Backlog (prioritized by value)
1. `shell/utils/validators/` - 10 of 12 validators untested (cidr.js, setting.js done); each small+pure
2. `shell/components/CruResource.vue` - component test (complex, 1032 lines)
3. `shell/components/ResourceTable.vue` - component test (complex, 836 lines)

Previously done: `url.ts` (PR #72), `duration.js` (PR #72), `git.ts` (PR #113),
`async.ts` (PR #113), `aws.ts` (PR #123), `platform.js` (PR #132),
`units.js` (PR pending - branch test-assist/units-utils, 57 tests, 100% all coverage)

## Round-Robin
- 2026-03-11: Tasks 1,2,7
- 2026-03-31: Tasks 3,4,7
- 2026-04-09: Task 3 (git.ts - lost), Task 7 (safe-outputs unavailable)
- 2026-04-10 run1: Tasks 3,4,7
- 2026-04-10 run2: Tasks 3,7
- 2026-04-11: Tasks 3,7
- 2026-04-12: Tasks 5,6,7
- 2026-04-13: Tasks 3,4,7. Next run: Tasks 5,6,7

## Monthly Summary Issues
- March 2026: #45 (closed 2026-04-10)
- April 2026: #114 (closed "not_planned" by maintainer 2026-04-13)
- April 2026 new: created this run (pending number assignment)

## Open Test Improver PRs
- PR #72: url.ts + duration.js tests (draft, open, awaiting review)
- PR #113: git.ts + async.ts tests (draft, open, awaiting review)
- PR #123: aws.ts tests (15 tests, 100% coverage, draft, open)
- PR #132: platform.js tests (18 tests, 100% stmts/funcs, draft, open)
- PR pending: units.js tests (57 tests, 100% all coverage, draft, branch test-assist/units-utils)

## Infrastructure Notes (Task 6)
- jest.setup.js: good global Vue/i18n/store mocks
- No shared factory helpers for K8s resource objects — each test file recreates patterns
- Validators: 12 files in shell/utils/validators/, only cidr + setting tested

## Maintainer Priorities
- Monthly summary issue #114 closed as "not_planned" on 2026-04-13 by marcelofukumoto
  (no comments; may prefer fewer activity tracking issues)

## Checked Off Items
None
