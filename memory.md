# Test Improver Memory - 2026-04-11

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

## Backlog (Tier 1 = pure fns, no tests)
1. ✅ `shell/utils/url.ts` - done (PR #72, 2026-03-31)
2. ✅ `shell/utils/duration.js` - done (PR #72, 2026-03-31)
3. ✅ `shell/utils/git.ts` - done (PR #113, 2026-04-10)
4. ✅ `shell/utils/async.ts` - done (PR #113, 2026-04-10)
5. ✅ `shell/utils/aws.ts` - done (PR #123, 2026-04-10)
6. ✅ `shell/utils/platform.js` - done (PR pending, 2026-04-11, branch: test-assist/platform-utils)
7. `shell/components/CruResource.vue` - component test (complex)
8. `shell/components/ResourceTable.vue` - component test (complex)

## Round-Robin
- 2026-03-11: Tasks 1,2,7
- 2026-03-31: Tasks 3,4,7
- 2026-04-09: Task 3 (git.ts - lost), Task 7 (safe-outputs unavailable)
- 2026-04-10 run1: Tasks 3,4,7
- 2026-04-10 run2: Tasks 3,7
- 2026-04-11: Tasks 3,7. Next run: Tasks 5,6,7

## Monthly Summary Issues
- March 2026: #45 (closed 2026-04-10)
- April 2026: #114 (open)

## Open Test Improver PRs
- PR #72: url.ts + duration.js tests (draft, open, awaiting review)
- PR #113: git.ts + async.ts tests (draft, open, awaiting review)
- PR #123: aws.ts tests (15 tests, 100% coverage, draft, open)
- branch test-assist/platform-utils: platform.js tests (18 tests, 100% stmts/funcs, PR pending)

## Maintainer Priorities
None noted yet

## Checked Off Items
None
