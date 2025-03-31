# OGC API - Processes

This GitHub repository contains the OGC API - Processes for processing geospatial information on the web. It focuses on a simple RESTful core specified
as reusable [OpenAPI](http://openapis.org) components with responses in JSON and HTML.

The latest published version of _OGC API - Processes - Part 1: Core_ is found here in [HTML](https://docs.ogc.org/is/18-062r2/18-062r2.html) or [PDF](https://docs.ogc.org/is/18-062r2/18-062r2.pdf).

The latest Editor's Draft version of _OGC API - Processes - Part 1: Core_ (1.1 or 2.0) is found here in [HTML](https://docs.ogc.org/DRAFTS/18-062.html) or [PDF](https://docs.ogc.org/DRAFTS/18-062.pdf).

The latest Draft of _OGC API - Processes - Part 2: Deploy, Replace, Undeploy_ is found here in [HTML](http://docs.ogc.org/DRAFTS/20-044.html) or [PDF](http://docs.ogc.org/DRAFTS/20-044.pdf).

The latest Draft of _OGC API - Processes - Part 3: Workflows and Chaining_ is found here in [HTML](https://docs.ogc.org/DRAFTS/21-009.html) or [PDF](https://docs.ogc.org/DRAFTS/21-009.pdf).

The latest Draft of _OGC API - Processes - Part 4: Job Management_ is found here in [HTML](https://docs.ogc.org/DRAFTS/24-051.html) or [PDF](https://docs.ogc.org/DRAFTS/24-051.pdf).

[OGC API standards](https://ogcapi.ogc.org) define modular API building blocks to spatially enable Web APIs
in a consistent way. [OpenAPI](http://openapis.org) is used to define the reusable
API building blocks.

## Overview

The OGC API - Processes enables the execution of computing processes and the retrieval of metadata describing their purpose and functionality.
Typically, these processes combine raster, vector, and/or coverage data with well-defined algorithms to produce new raster, vector, and/or coverage information.

```
GET /processes
```

Lists the processes this API offers.

```
GET /processes/{processID}
```

Returns a detailed description of a process.

```
GET /jobs
```

Returns the running and finished jobs for a process (optional).

```
POST /processes/{processID}/execution
```

Executes a process, i.e. creates a new job. Inputs, outputs and the process id will have to be specified in
a JSON document that needs to be send in the POST body.

```
GET /jobs/{jobID}
```

Returns the status of a job of a process.

```
DELETE /jobs/{jobID}
```

Cancel a job execution.

```
GET /jobs/{jobID}/results
```

Returns the result of a job of a process.

## Using the standard


The standard is on the OGC website:

* OGC API - Processes - Part 1: Core
  * [Version 1.0.0 (latest approved version)](https://docs.ogc.org/is/18-062r2/18-062r2.html)

Those who want to just see the endpoints and responses can explore [examples of
developer-friendly OpenAPI definitions](https://ogcapi.ogc.org/processes).

The reference version of the OpenAPI components and XML schemas are published
in the [OGC schema repository](http://schemas.opengis.net/ogcapi/processes).

Several implementations of the draft standard exist:

[Implementations of the draft specification / demo services](./implementations.adoc)

## Contributing

The contributor understands that any contributions, if accepted by the OGC Membership, shall be incorporated into OGC API - Processes standards documents and that all copyright and intellectual property shall be vested to the OGC.

The OGC API - Processes Standards Working Group (SWG) is the group at OGC responsible for the stewardship of the standard, but is working to do as much work in public as possible.

* [Open issues](https://github.com/opengeospatial/ogcapi-processes/issues)
* [Copy of License Language](https://raw.githubusercontent.com/opengeospatial/ogcapi-processes/master/LICENSE)

Pull Requests from contributors are welcomed. However, please note that by sending a Pull Request or Commit to this GitHub repository, you are agreeing to the terms in the Observer Agreement https://portal.ogc.org/files/?artifact_id=92169

