# OpenAPI building blocks

This example API definition can be used to provide an OpenAPI 3.0 definition for an implementation of _OGC API - Processes - Part 1: Core and Part 3: Workflows and Chaining_.
The API definition can be visualized with [SwaggerUI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/jerstlouis/ogcapi-processes/part3-update/extensions/workflows/openapi/ogcapi-processes-3.bundled.json).

The lists of processes in the `/api` sub-directory should be tailored to the implementation & deployment, or those `/api/*` paths can be implemented dynamically by the server instead.
The list of supported paths should be ajusted in `ogcapi-processes-3.yaml`.

The `ogcapi-processes-3.bundled.json` was generated with `swagger-cli bundle` from `ogcapi-processes-3.yaml` and its dependencies included from the components sub-directories.

See also [SwaggerCLI](https://apitools.dev/swagger-cli/) and its [GitHub repository](https://github.com/APIDevTools/swagger-cli).
