#!/usr/bin/env sh

cd "$(dirname "$0")" || exit 1

# Bundle (redocly or swagger-cli)
# Default below assumes global install (e.g.: npm install -g @redocly/cli)
# If using a local install, set BUNDLE_TOOL='npx @redocly/cli' or 'npx @apidevtools/swagger-cli'
BUNDLE_TOOL=${BUNDLE_TOOL:-redocly}
BUNDLE_XARGS=""
if echo "${BUNDLE_TOOL}" | grep -q "redocly"; then
  # if the special plugin is used, names are guaranteed to be unique because of preserved prefixes
  # and their by-design uniqueness of file names under those directory prefixes
  # supress the warnings to avoid misleading errors
  BUNDLE_XARGS="--config ../.github/redocly/config.yaml --component-renaming-conflicts-severity=off"
fi
${BUNDLE_TOOL} bundle ${BUNDLE_XARGS} ogcapi-processes.yaml -o ogcapi-processes.bundled.json "$@"
