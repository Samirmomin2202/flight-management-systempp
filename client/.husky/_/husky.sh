#!/usr/bin/env sh
# Husky shim (kept minimal)
if [ -z "$husky_skip_init" ]; then
  readonly husky_skip_init=1
  export PATH="$PATH:/usr/local/bin"
fi
