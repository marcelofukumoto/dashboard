# Test Improver Memory - 2026-03-11

## Commands (from AGENTS.md, node_modules absent in runner)
- Unit tests: `yarn test:ci` (Jest+coverage)
- Single file: `yarn test:ci <path>`
- Lint: `yarn lint` (ESLint, 0 warnings)
- Build: `yarn build`
- Framework: Jest (ts-jest), jsdom; Cypress for E2E

## Test Conventions
- `toStrictEqual`, `toHaveBeenCalledWith`, `it.each`
- TypeScript, `shell/utils/__tests__/<name>.test.ts`
- Never overwrite existing test files

## Backlog (Tier 1 = pure fns, no tests)
1. `shell/utils/url.ts` - addParam, removeParam, parseLinkHeader, portMatch
2. `shell/utils/duration.js` - toMilliseconds, toSeconds
3. `shell/utils/async.ts` - waitFor, wait
4. `shell/utils/git.ts` - github/gitlab normalizers
5. `shell/utils/aws.ts` - VPC/subnet helpers
6. `shell/components/CruResource.vue` - component test

## Round-Robin
- 2026-03-11: Tasks 1,2,7 done. Next run: Tasks 3,4,7
- Monthly Summary issue: created 2026-03

## Maintainer Priorities
None noted yet

## Checked Off Items
None
