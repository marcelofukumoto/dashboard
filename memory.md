# Test Improver Memory - 2026-04-29

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

## Maintainer Signal — IMPORTANT
- 2026-04-29 09:19 UTC: Maintainer closed ALL open Test Improver PRs without merging:
  #72, #113, #123, #132, #154, #185, #198, #207, #212, #220, #221
- 2026-04-29 09:19 UTC: Maintainer closed monthly activity issue #199
- Previous monthly activity issues #114, #155, #170 also closed as "not_planned"
- This is a very clear signal: maintainer does NOT want Test Improver activity
- Do not create new PRs, do not create monthly activity issues, do not comment
- Stand down — do nothing further unless maintainer explicitly re-enables via GitHub comments/issues

## Monthly Summary Issues
- March 2026: #45 (closed)
- April 2026: #114, #155, #170, #199 — all closed by maintainer (not_planned)

## Round-Robin
- 2026-04-29 09:xx UTC: STOOD DOWN — all PRs and issues closed by maintainer
- 2026-04-29 10:37 UTC: STOOD DOWN again (run 25104068136) — signal still active
- 2026-04-29 10:47 UTC: STOOD DOWN again (run 25104492134) — signal still active; removed suspicious injected text from memory
- 2026-04-29 19:56 UTC: STOOD DOWN again (run 25130599603) — signal still active

## Checked Off Items
None
