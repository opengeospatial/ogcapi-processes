# Web Processing Service 2.0 REST/JSON Binding Extension

This GitHub repository contains the REST/JSON Binding Extension of the [OGC](http://opengeospatial.org)'s
Web Processing Service (WPS) 2.0 standard for processing geospatial information on the web. It is a complete
rewrite of previous versions, focusing on a simple RESTful core specified
as reusable [OpenAPI](http://openapis.org) components with responses in JSON and HTML.

## Overview

A Web Processing Service is a web service that enables the execution of computing processes and the retrieval of metadata describing their purpose and functionality. 
Typically, these processes combine raster, vector, and/or coverage data with well-defined algorithms to produce new raster, vector, and/or coverage information.

```
GET /processes
```

Lists the processes this WPS offers. 

```
GET /processes/{process-id}
```

Returns a detailed description of a process.

```
GET /processes/{process-id}/jobs
```

Returns the running and finished jobs for a process.

```
POST /processes/{process-id}/jobs
```

Executes a process, i.e. creates a new job. Inputs and outputs will have to be specified in
a JSON document that needs to be send in the POST body.

```
GET /processes/{process-id}/jobs/{job-id}
```

Returns the status of a job of a process.

```
GET /processes/{process-id}/jobs/{job-id}/results
```

Returns the result of a job of a process.

## Using the standard

A draft of the WPS 2.0 REST/JSON Binding Extension is available:

* [OGC Web Processing Service 2.0 REST/JSON Binding Extension, Draft](https://raw.githubusercontent.com/opengeospatial/wps-rest-binding/develop/docs/18-062.pdf)

* [WPS 2.0 REST/JSON Binding Extension OpenAPI specification](https://app.swaggerhub.com/apis/geoprocessing/WPS/1.0-draft.2)

Demo implementations:

* [52°North](http://geoprocessing.demo.52north.org:8080/javaps/rest/)

## Contributing

The contributor understands that any contributions, if accepted by the OGC Membership, shall be incorporated into OGC Web Processing Service 2.0 REST/JSON Binding Extension standards documents and that all copyright and intellectual property shall be vested to the OGC.

The WPS 2.0 Standards Working Group (SWG) is the group at OGC responsible for the stewardship of the standard, but is working to do as much work in public as possible.

* [Open issues](https://github.com/opengeospatial/wps-rest-binding/issues)
* [Copy of License Language](https://raw.githubusercontent.com/opengeospatial/wps-rest-binding/master/LICENSE)
