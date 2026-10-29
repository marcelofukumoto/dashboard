#!/usr/bin/env bash
# Freezes the Chrome browser process once (SIGSTOP) so Cypress waits on it, like the real hangs.
# $1 = the user-test spec to freeze in: once the watchdog's log shows "Running: ... ($1 of N)".
# The setup spec runs alone as "(1 of 1)", so $1 >= 2 only matches the user tests.
until grep -sqE "\($1 of [0-9]+\)" "${TMPDIR:-/tmp}"/tmp.*/attempt-1.log; do sleep 1; done
sleep 3
for p in $(pgrep -f -- '--remote-debugging-port'); do
  if ! tr '\0' ' ' < /proc/$p/cmdline | grep -q -- '--type='; then
    kill -STOP "$p" && echo "$(date -u +%T) froze Chrome browser process $p: $(tr '\0' ' ' < /proc/$p/cmdline | cut -c1-120)"
  fi
done
