#!/usr/bin/env sh

cd "$(dirname "$0")" || exit 1

# Refresh pProcessListDeploy.yaml content
rm paths/processes-dru/pProcessListDeploy.yaml ; \
for i in processes-core/pProcessList.yaml \
    processes-dru/operations/oDeploy.yaml ; \
do \
   cat paths/$i >> paths/processes-dru/pProcessListDeploy.yaml;
done

# Refresh pProcessDescriptionReplaceUndeploy.yaml content
rm paths/processes-dru/pProcessDescriptionReplaceUndeploy.yaml; \
for i in processes-core/pProcessDescription.yaml \
    processes-dru/operations/oReplace.yaml \
    processes-dru/operations/oUndeploy.yaml; \
do \
   cat paths/$i >> paths/processes-dru/pProcessDescriptionReplaceUndeploy.yaml ;\
done

# Bundle (redocly or swagger-cli)
# Default below assumes global install (e.g.: npm install -g @redocly/cli)
# If using a local install, set BUNDLE_TOOL='npx @redocly/cli' or 'npx @apidevtools/swagger-cli'
BUNDLE_TOOL=${BUNDLE_TOOL:-redocly}
${BUNDLE_TOOL} bundle ogcapi-processes.yaml -o ogcapi-processes.bundled.json
