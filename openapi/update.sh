#!/bin/sh

# Refresh pProcessListDeploy.yaml content
rm paths/processes-dru/pProcessListDeploy.yaml ; \
for i in processes-core/pProcessList.yaml \
    processes-dru/pDeploy.yaml ; \
do \
   cat paths/$i >> paths/processes-dru/pProcessListDeploy.yaml;
done

# Refresh pProcessDescriptionReplaceUndeploy.yaml content
rm paths/processes-dru/pProcessDescriptionReplaceUndeploy.yaml; \
for i in processes-core/pProcessDescription.yaml \
    processes-dru/pReplace.yaml \
    processes-dru/pUndeploy.yaml; \
do \
   cat paths/$i >> paths/processes-dru/pProcessDescriptionReplaceUndeploy.yaml ;\
done

# Bundle with swagger-cli
swagger-cli bundle ogcapi-processes.yaml -o ogcapi-processes.bundled.json
