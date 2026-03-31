# Test Improver Memory - 2026-03-31

## Commands (validated with YARN_IGNORE_ENGINES=true)
- Unit tests: `YARN_IGNORE_ENGINES=true yarn test:ci` (Jest+coverage)
- Single file: `YARN_IGNORE_ENGINES=true yarn test:ci <path>`
- Lint: `YARN_IGNORE_ENGINES=true yarn lint` (ESLint, 0 warnings)
- Build: `yarn build`
- Framework: Jest (ts-jest), jsdom; Cypress for E2E
- Note: Runner has Node 20; repo requires Node >=24; use YARN_IGNORE_ENGINES=true

## Test Conventions
- `toStrictEqual`, `toHaveBeenCalledWith`, `it.each`
- TypeScript, `shell/utils/__tests__/<name>.test.ts`
- Never overwrite existing test files

## Backlog (Tier 1 = pure fns, no tests)
1. ✅ `shell/utils/url.ts` - done (PR submitted 2026-03-31)
2. ✅ `shell/utils/duration.js` - done (PR submitted 2026-03-31)
3. `shell/utils/async.ts` - waitFor, wait
4. `shell/utils/git.ts` - github/gitlab normalizers
5. `shell/utils/aws.ts` - VPC/subnet helpers
6. `shell/components/CruResource.vue` - component test

## Round-Robin
- 2026-03-11: Tasks 1,2,7 done
- 2026-03-31: Tasks 3,4,7 done. Next run: Tasks 5,6,7 (or 3 again with async.ts)

## Monthly Summary issue: #45 (March 2026)

## Maintainer Priorities
None noted yet

## Checked Off Items
None

## Open Test Improver PRs
- Draft PR: "[Test Improver] test: add unit tests for url.ts and duration.js utilities" (branch: test-assist/url-duration-utils)
