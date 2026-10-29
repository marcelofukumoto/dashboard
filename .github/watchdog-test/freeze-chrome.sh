#!/usr/bin/env bash
# Freezes the Chrome browser process once (SIGSTOP) so Cypress waits on it, like the real hangs.
# $1 = setup: 8s after Chrome starts, while the setup spec runs. $1 = midrun: once the second user-test spec has started.
if [ "$1" = setup ]; then
  until pgrep -f -- '--remote-debugging-port' >/dev/null; do sleep 0.2; done
  sleep 8
else
  # Cypress creates a spec's video when the spec starts, so two videos means spec 2 is running
  until [ "$(find cypress/videos -name '*.mp4' ! -name 'rancher-setup*' 2>/dev/null | wc -l)" -ge 2 ]; do sleep 1; done
  sleep 5
fi
for p in $(pgrep -f -- '--remote-debugging-port'); do
  if ! tr '\0' ' ' < /proc/$p/cmdline | grep -q -- '--type='; then
    kill -STOP "$p" && echo "$(date -u +%T) froze Chrome browser process $p: $(tr '\0' ' ' < /proc/$p/cmdline | cut -c1-120)"
  fi
done
