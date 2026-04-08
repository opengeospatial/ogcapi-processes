# OGC API - Processes

[OGC API standards](https://ogcapi.ogc.org/) define modular API building blocks to spatially enable Web APIs
in a consistent way. [OpenAPI](http://openapis.org) is used to define the reusable
API building blocks with responses in JSON and HTML.

The OGC API family of standards is organized by resource type.
The _OGC API - Processes_ standard enables the execution of computing processes and the retrieval of metadata describing their purpose and functionality.
Typically, these processes combine raster, vector, and/or coverage data with well-defined algorithms to produce new raster, vector, and/or coverage information.

## Overview of OGC API - Processes - Part 1: Core

```
GET /processes
```

Lists the processes this API offers.

```
GET /processes/{processID}
```

Returns a detailed description of a process.

```
GET /processes/{processID}/jobs
```

Returns the running and finished jobs for a process (optional).

```
POST /processes/{processID}/jobs
```
Executes a process, i.e. creates a new job. Inputs and outputs will have to be specified in a JSON document that needs to be send in the POST body.

```
GET /processes/{processID}/jobs/{jobID}
```

Returns the status of a job of a process.

```
DELETE /processes/{processID}/jobs/{jobID}
```

Cancel a job execution.

```
GET /processes/{processID}/jobs/{jobID}/results
```
Returns the result of a job of a process.


## Overview of OGC API - Processes - Part 2: Deploy, Replace, Undeploy

```
POST /processes
```

Deploy a new process.

```
PUT /processes/{processID}
```

Replace an existing process.

```
DELETE /processes/{processID}
```

Undeploy a process.

## Overview of OGC API - Processes - Part 3: Workflows and Chaining

No additional endpoints. Execution reuses the same endpoints as in Part 1 with nested processes and additional parameters.

## Overview of OGC API - Processes - Part 4: Job Management

```
POST /jobs
```

Create a new job (potentially pending execution).

```
PATCH /jobs/{jobID}
```

Update an existing job.

```
POST /jobs/{jobID}/results
```

Trigger execution of an existing job.

```
GET /jobs/{jobID}/prov
```

Returns provenance details of a completed job.
