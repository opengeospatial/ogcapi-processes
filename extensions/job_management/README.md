# Standard template

This folder contains the content for the OGC API - Processes - Part 4: Job Management (JM).

This extension provides the ability to create new jobs without starting its execution. Meaning that you can prepare a job and execute it later. This extension also provides ways to track history associated with the execution, starting with the job definition.

The repo is organized as follows:

* standard - the main standard document content
  - organized in multiple sections and directories (recommendations, requirements, etc.)
* xml - normative XML/XSD components specified by the standard
* examples - JSON and XML examples

The schemas associated with this extension are stored from the root directory in `openapi/*{api,parameters,path,responses,schemas}*/processes-job-management`.
