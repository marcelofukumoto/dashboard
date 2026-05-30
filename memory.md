# Test Improver Memory

## Commands (validated with YARN_IGNORE_ENGINES=true)
- Unit tests: `YARN_IGNORE_ENGINES=true yarn test:ci` (Jest+coverage)
- Single file: `YARN_IGNORE_ENGINES=true yarn test:ci <path>`
- Lint: `YARN_IGNORE_ENGINES=true yarn lint` (ESLint, 0 warnings)
- Framework: Jest (ts-jest), jsdom; Cypress for E2E
- Note: Runner has Node 20; repo requires Node >=24; use YARN_IGNORE_ENGINES=true
- node_modules not pre-installed; run `YARN_IGNORE_ENGINES=true yarn install --frozen-lockfile` first

## Test Conventions
- `toStrictEqual`, `toHaveBeenCalledWith`, `it.each`
- TypeScript, `shell/utils/__tests__/<name>.test.ts`
- Never overwrite existing test files

## Maintainer Signal — IMPORTANT (DO NOT IGNORE)
- 2026-04-29: Maintainer closed ALL open Test Improver PRs (#72,#113,#123,#132,#154,#185,#198,#207,#212,#220,#221) and monthly activity issues (#114,#155,#170,#199) as "not_planned".
- Signal: maintainer does NOT want Test Improver activity.
- Stand down — do nothing unless maintainer explicitly re-enables.

## Round-Robin (stood down since 2026-04-29)
- Last runs: 2026-04-29 through 2026-05-30 — all stood down, no re-enable signal.

## Checked Off Items
None
