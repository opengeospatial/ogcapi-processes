/**
 * Redocly plugin to preserve component name prefixes based on directory structure.
 * Workaround for: https://github.com/Redocly/redocly-cli/issues/661
 *
 * When bundling, Redocly auto-renames conflicting components (e.g., link.yaml -> link-2).
 * This plugin modifies the bundled output to use directory-based prefixes for ALL component types
 * (schemas, responses, parameters, examples, requestBodies, headers, securitySchemes, links, callbacks).
 */

// Store mapping of component objects to their source information
const componentSourceMap = new WeakMap();
const externalDefsRefMap = new WeakMap();
const externalDefsComponents = new Map();

const COMPONENT_FILE_PATTERN = /\/(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks)\/([^/]+)\/([^/]+)\.yaml$/;
const EXTERNAL_DEFS_PATTERN = /(?:^|\/)schemas\/([^/]+)\/([^/#]+)\.yaml#\/\$defs\/([^/]+)$/;
const DEBUG = process.env.REDOCLY_PLUGIN_DEBUG === "1";

function parseExternalDefsRef(ref) {
  if (typeof ref !== "string") {
    return null;
  }
  const match = ref.match(EXTERNAL_DEFS_PATTERN);
  if (!match) {
    return null;
  }
  const [, directory, filename, defName] = match;
  return { directory, filename, defName };
}

const PreserveComponentNamePrefixes = () => {
  return {
    any: {
      enter(node, ctx) {
        // Track all nodes from component files
        if (!node || typeof node !== 'object') {
          return;
        }

        const location = ctx.location;
        if (!location || !location.source || !location.source.absoluteRef) {
          return;
        }

        const filePath = location.source.absoluteRef;

        // Skip component references
        if (filePath.includes('#/components/')) {
          return;
        }

        const defsRefMatch = parseExternalDefsRef(node.$ref);
        if (defsRefMatch) {
          const { directory, filename, defName } = defsRefMatch;
          externalDefsRefMap.set(node, {
            componentType: "schemas",
            filename,
            defName,
            prefixedName: `${directory}-${defName}`
          });
          if (DEBUG) {
            console.warn(`[schema-prefix] external defs ref: ${node.$ref} -> ${directory}-${defName}`);
          }
        }

        // Extract directory and filename from various component paths.
        const match = filePath.match(COMPONENT_FILE_PATTERN);
        if (match) {
          const [, componentType, directory, filename] = match;

          const pointer = location.pointer;
          const defsPointerMatch =
            componentType === "schemas" &&
            typeof pointer === "string" &&
            pointer.match(/^#\/\$defs\/([^/]+)$/);
          if (defsPointerMatch) {
            const [, defName] = defsPointerMatch;
            const prefixedName = `${directory}-${defName}`;
            componentSourceMap.set(node, {
              componentType,
              directory,
              filename,
              prefixedName
            });
            if (!externalDefsComponents.has(prefixedName)) {
              externalDefsComponents.set(prefixedName, {
                directory,
                filename,
                defName,
                node
              });
              if (DEBUG) {
                console.warn(`[schema-prefix] external defs node: ${filePath}${pointer} -> ${prefixedName}`);
              }
            }
          }

          if (directory && directory !== componentType && !defsPointerMatch) {
            // Store the source info for this node
            componentSourceMap.set(node, {
              componentType,
              directory,
              filename,
              prefixedName: `${directory}-${filename}`
            });
          }
        }
      }
    },
    Root: {
      leave(root) {
        // Post-process: rename all component types after bundling
        if (!root.components) {
          return;
        }

        // List of all possible component types in OpenAPI 3.x
        const componentTypes = [
          'schemas',
          'responses',
          'parameters',
          'examples',
          'requestBodies',
          'headers',
          'securitySchemes',
          'links',
          'callbacks'
        ];

        const renameMap = new Map();
        const refRenameMap = new Map();
        const schemaTitleMap = new Map();

        // Process each component type
        for (const componentType of componentTypes) {
          const components = root.components[componentType];
          if (!components) {
            continue;
          }

          // Identify components that should be renamed
          for (const [componentName, componentContent] of Object.entries(components)) {
            const sourceInfo = componentSourceMap.get(componentContent);

            if (sourceInfo && sourceInfo.prefixedName) {
              if (componentType === "schemas") {
                // inject the original schema name as title to display it nicely in OpenAPI Swagger-UI
                const prefix = `${sourceInfo.directory}-`;
                const inferredTitle = sourceInfo.prefixedName.startsWith(prefix)
                  ? sourceInfo.prefixedName.slice(prefix.length)
                  : sourceInfo.prefixedName;
                if (inferredTitle) {
                  schemaTitleMap.set(sourceInfo.prefixedName, inferredTitle);
                }
              }

              // Only rename if the name differs
              if (componentName !== sourceInfo.prefixedName) {
                const key = `${componentType}/${componentName}`;
                renameMap.set(key, {
                  componentType,
                  oldName: componentName,
                  newName: sourceInfo.prefixedName
                });

                refRenameMap.set(
                  `#/components/${componentType}/${componentName}`,
                  `#/components/${componentType}/${sourceInfo.prefixedName}`
                );
              }
            }
          }
        }

        // Apply renames
        for (const [key, { componentType, oldName, newName }] of renameMap.entries()) {
          const components = root.components[componentType];
          if (components && components[oldName]) {
            components[newName] = components[oldName];
            delete components[oldName];
          }
        }

        const defsPrefixMap = new Map();
        for (const [prefixedName, { directory, defName }] of externalDefsComponents.entries()) {
          if (!defsPrefixMap.has(directory)) {
            defsPrefixMap.set(directory, new Map());
          }
          defsPrefixMap.get(directory).set(defName, prefixedName);
        }

        function cloneAndRewriteDefsRefs(value, directory) {
          if (Array.isArray(value)) {
            return value.map((item) => cloneAndRewriteDefsRefs(item, directory));
          }

          if (!value || typeof value !== "object") {
            return value;
          }

          const cloned = {};
          for (const [key, item] of Object.entries(value)) {
            if (key === "$ref" && typeof item === "string") {
              const localDefsMatch = item.match(/^#\/\$defs\/([^/]+)$/);
              if (localDefsMatch) {
                const localDefs = defsPrefixMap.get(directory);
                const defName = localDefsMatch[1];
                if (localDefs && localDefs.has(defName)) {
                  cloned[key] = `#/components/schemas/${localDefs.get(defName)}`;
                  continue;
                }
              }
            }
            cloned[key] = cloneAndRewriteDefsRefs(item, directory);
          }
          return cloned;
        }

        const schemaComponents = root.components.schemas || (root.components.schemas = {});
        for (const [prefixedName, { directory, defName, node }] of externalDefsComponents.entries()) {
          if (!schemaComponents[prefixedName]) {
            schemaComponents[prefixedName] = cloneAndRewriteDefsRefs(node, directory);
          }
          if (!schemaTitleMap.has(prefixedName) && defName) {
            schemaTitleMap.set(prefixedName, defName);
          }
        }

        for (const [schemaName, inferredTitle] of schemaTitleMap.entries()) {
          const schema = schemaComponents[schemaName];
          if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
            continue;
          }
          if (Object.prototype.hasOwnProperty.call(schema, "title")) {
            continue;
          }
          schema.title = inferredTitle;
        }

        const canonicalRefMap = new Map();
        for (const [prefixedName, { directory, filename, defName }] of externalDefsComponents.entries()) {
          if (defName !== "CWL") {
            continue;
          }
          const legacyName = `${directory}-${filename}`;
          if (legacyName === prefixedName) {
            continue;
          }
          if (schemaComponents[prefixedName]) {
            canonicalRefMap.set(
              `#/components/schemas/${legacyName}`,
              `#/components/schemas/${prefixedName}`
            );
          }
        }

        if (DEBUG) {
          console.warn(
            `[schema-prefix] renameMap=${renameMap.size}, externalDefsComponents=${externalDefsComponents.size}`
          );
        }

        // Update all $ref occurrences throughout the document
        function updateRefs(obj, opts = { skipCanonicalAlias: false }) {
          if (!obj || typeof obj !== 'object') {
            return;
          }

          if (obj.$ref && typeof obj.$ref === 'string') {
            const mappedExternalRef = externalDefsRefMap.get(obj);
            if (mappedExternalRef) {
              const promotedRef = `#/components/${mappedExternalRef.componentType}/${mappedExternalRef.prefixedName}`;
              if (root.components[mappedExternalRef.componentType] &&
                  root.components[mappedExternalRef.componentType][mappedExternalRef.prefixedName]) {
                obj.$ref = promotedRef;
              }
            }

            if (!opts.skipCanonicalAlias) {
              const canonicalRef = canonicalRefMap.get(obj.$ref);
              if (canonicalRef) {
                obj.$ref = canonicalRef;
              }
            }

            const renamedRef = refRenameMap.get(obj.$ref);
            if (renamedRef) {
              obj.$ref = renamedRef;
            }

            const externalDefsMatch = obj.$ref.match(EXTERNAL_DEFS_PATTERN);
            if (externalDefsMatch) {
              const [, directory, , defName] = externalDefsMatch;
              const prefixedName = `${directory}-${defName}`;
              if (root.components.schemas && root.components.schemas[prefixedName]) {
                obj.$ref = `#/components/schemas/${prefixedName}`;
              }
            }
          }

          // Recursively update refs in nested objects
          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object') {
              const skipCanonicalAlias =
                obj === schemaComponents &&
                canonicalRefMap.has(`#/components/schemas/${key}`);
              updateRefs(value, { skipCanonicalAlias });
            }
          }
        }

        updateRefs(root);

        for (const [legacyRef, canonicalRef] of canonicalRefMap.entries()) {
          const legacyName = legacyRef.replace("#/components/schemas/", "");
          const legacySchema = schemaComponents[legacyName];
          if (!legacySchema) {
            continue;
          }
          const isSelfReferentialArray = (items) =>
            Array.isArray(items) &&
            items.length > 0 &&
            items.every((entry) => entry && entry.$ref === legacyRef);
          if (isSelfReferentialArray(legacySchema.allOf) || isSelfReferentialArray(legacySchema.oneOf)) {
            delete schemaComponents[legacyName];
            if (DEBUG) {
              console.warn(`[schema-prefix] removed malformed legacy schema alias: ${legacyName} -> ${canonicalRef}`);
            }
          }
        }
      }
    }
  };
};

module.exports = function () {
  return {
    id: 'schema-prefix',
    decorators: {
      oas3: {
        'preserve-schema-name-prefixes': PreserveComponentNamePrefixes,
      }
    }
  }
};
