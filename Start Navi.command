#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
trap 'code=$?; if [ "$code" -ne 0 ]; then echo; echo "Navi could not start. See the message above and START-HERE.md."; read -r -p "Press Return to close..." _; fi' EXIT
if [ "$(uname -s)" != "Darwin" ]; then echo "This launcher is for macOS."; exit 1; fi
case "$(uname -m)" in
  arm64) navi_arch=arm64; navi_sha=8294b7aa9b03997481c06babf1e8b270c859358f27da57a11509afe537ac381d ;;
  x86_64) navi_arch=x64; navi_sha=d1b5e999db158c62fe8f7267a4476b035d8bd93b1a605bac24a3f0dd166e3316 ;;
  *) echo "Unsupported Mac processor."; exit 1 ;;
esac
navi_version=v24.19.0
navi_runtime="$PWD/.stand-runtime/node-${navi_version}-darwin-${navi_arch}"
if [ ! -x "$navi_runtime/bin/node" ]; then
  echo "First launch: downloading Node.js from nodejs.org..."
  mkdir -p .stand-runtime
  navi_archive="node-${navi_version}-darwin-${navi_arch}.tar.gz"
  curl --fail --location --retry 2 --connect-timeout 20 --max-time 600 "https://nodejs.org/dist/${navi_version}/${navi_archive}" -o ".stand-runtime/${navi_archive}"
  printf '%s  %s\n' "$navi_sha" ".stand-runtime/${navi_archive}" | shasum -a 256 -c -
  tar -xzf ".stand-runtime/${navi_archive}" -C .stand-runtime
fi
export PATH="$navi_runtime/bin:$PATH"
export WRANGLER_SEND_METRICS=false
export CLOUDFLARE_CF_FETCH_ENABLED=false
navi_fingerprint="${navi_arch}-$(shasum -a 256 package-lock.json | cut -d ' ' -f 1)"
if [ ! -f .stand-runtime/dependencies-ready ] || [ "$(cat .stand-runtime/dependencies-ready)" != "$navi_fingerprint" ] || [ ! -f node_modules/vinext/dist/cli.js ]; then
  echo "First launch: installing the application's locked dependencies. This can take several minutes..."
  npm run install:ci
  printf '%s' "$navi_fingerprint" > .stand-runtime/dependencies-ready
fi
if [ "${1:-}" = "--setup-only" ]; then echo "Setup complete."; exit 0; fi
node scripts/start-stand.mjs
