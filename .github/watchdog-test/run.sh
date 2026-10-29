#!/usr/bin/env bash
# Runs scripts/e2e-stall-watchdog against the fake cypress for one scenario and checks the outcome.
# expect_config: the retry's --config, compact JSON, or "-" when there is no retry
mode=$1 expect_rc=$2 expect_calls=$3 expect_config=$4
export FAKE_MODE=$mode FAKE_STATE=$(mktemp) E2E_STALL_MINUTES=1 PATH="$PWD/.github/watchdog-test/bin:$PATH"
rm -f "$FAKE_STATE"
./scripts/e2e-stall-watchdog 'cypress run --expose grepTags="@x" --browser chrome' > out.log 2>&1
rc=$?
cat out.log
calls=$(cat "$FAKE_STATE")
echo "== $mode: rc=$rc calls=$calls"; cat "$FAKE_STATE.args"
ok=true
[ "$rc" = "$expect_rc" ] || { echo "FAIL rc expected $expect_rc"; ok=false; }
[ "$calls" = "$expect_calls" ] || { echo "FAIL calls expected $expect_calls"; ok=false; }
if grep -E '^(BAD_JSON|BAD_CONFIG_COUNT)' "$FAKE_STATE.args"; then echo "FAIL retry --config"; ok=false; fi
if [ "$expect_config" != - ]; then
  got=$(cat "$FAKE_STATE.config" 2>/dev/null)
  [ "$got" = "$expect_config" ] || { echo "FAIL retry config: got $got expected $expect_config"; ok=false; }
fi
if [ "$calls" -gt 1 ]; then
  grep -q '^::warning title=Cypress stall::' out.log || { echo "FAIL no stall annotation"; ok=false; }
  # the diagnostics list the cypress process, whose args contain grepTags
  sed -n '/::group::\[watchdog\] Diagnostics/,/::endgroup::/p' out.log | grep -q 'watchdog-test/bin/cypress run --expose grepTags=@x' \
    || { echo "FAIL cypress process missing from the diagnostics"; ok=false; }
else
  grep -q 'Cypress stall' out.log && { echo "FAIL annotation without a stall"; ok=false; }
fi
if pgrep -f 'remote-debugging-port=59222|sleep 9999' >/dev/null; then echo "FAIL leftover processes"; pgrep -af 'remote-debugging-port=59222|sleep 9999'; ok=false; fi
$ok && echo "PASS $mode"
