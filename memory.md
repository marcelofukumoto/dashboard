# Test Improver Memory - 2026-04-09

## Commands (validated with YARN_IGNORE_ENGINES=true)
- Unit tests: `YARN_IGNORE_ENGINES=true yarn test:ci` (Jest+coverage)
- Single file: `YARN_IGNORE_ENGINES=true yarn test:ci <path>`
- Lint: `YARN_IGNORE_ENGINES=true yarn lint` (ESLint, 0 warnings)
- Build: `yarn build`
- Framework: Jest (ts-jest), jsdom; Cypress for E2E
- Note: Runner has Node 20; repo requires Node >=24; use YARN_IGNORE_ENGINES=true
- Note: node_modules/.bin/jest may be missing - run `yarn install` first

## Test Conventions
- `toStrictEqual`, `toHaveBeenCalledWith`, `it.each`
- TypeScript, `shell/utils/__tests__/<name>.test.ts`
- Never overwrite existing test files
- ESLint rule: `jest/lowercase-name` - describe blocks must start with lowercase

## Backlog (Tier 1 = pure fns, no tests)
1. ✅ `shell/utils/url.ts` - done (PR submitted 2026-03-31)
2. ✅ `shell/utils/duration.js` - done (PR submitted 2026-03-31)
3. ✅ `shell/utils/git.ts` - done (committed 2026-04-09, branch: test-assist/git-utils, 13 tests, 100% stmts/fns, 92.6% branches - PR push pending)
4. `shell/utils/async.ts` - waitFor, wait (uses timers - needs fake timers)
5. `shell/utils/aws.ts` - VPC/subnet helpers (simple, lower value)
6. `shell/components/CruResource.vue` - component test

## Round-Robin
- 2026-03-11: Tasks 1,2,7 done
- 2026-03-31: Tasks 3,4,7 done
- 2026-04-09: Task 3 (git.ts tests), Task 7. Next run: Tasks 5,6,7

## Monthly Summary Issues
- March 2026: #45 (should be closed - past month)
- April 2026: needs to be created (safe-output tools were unavailable this run)

## Open Test Improver PRs
- Pending push (safe-output tools unavailable this run): branch test-assist/git-utils
- Previous: branch test-assist/url-duration-utils (from 2026-03-31)

## Maintainer Priorities
None noted yet

## Checked Off Items
None
