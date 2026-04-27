/**
 * Redocly plugin to preserve schema name prefixes based on directory structure.
 * Workaround for: https://github.com/Redocly/redocly-cli/issues/661
 *
 * When bundling, Redocly auto-renames conflicting schemas (e.g., link.yaml -> link-2).
 * This plugin modifies the bundled output to use directory-based prefixes for schema names.
 */

// Store mapping of schema objects to their source information
const schemaSourceMap = new WeakMap();

const PreserveSchemaNamePrefixes = () => {
  return {
    any: {
      enter(node, ctx) {
        // Track all nodes from schema files
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

        // Extract: .../schemas/{directory}/{filename}.yaml
        const match = filePath.match(/\/schemas\/([^\/]+)\/([^\/]+)\.yaml$/);
        if (match) {
          const [, directory, filename] = match;

          if (directory && directory !== 'schemas') {
            // Store the source info for this node
            schemaSourceMap.set(node, {
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
        // Post-process: rename component schemas after bundling
        if (!root.components || !root.components.schemas) {
          return;
        }

        const schemas = root.components.schemas;
        const renameMap = new Map();

        // Identify schemas that should be renamed
        for (const [schemaName, schemaContent] of Object.entries(schemas)) {
          const sourceInfo = schemaSourceMap.get(schemaContent);

          if (sourceInfo && sourceInfo.prefixedName) {
            // Only rename if the name differs
            if (schemaName !== sourceInfo.prefixedName) {
              renameMap.set(schemaName, sourceInfo.prefixedName);
            }
          }
        }

        // Apply renames
        for (const [oldName, newName] of renameMap.entries()) {
          // Move the schema to new name
          if (schemas[oldName]) {
            schemas[newName] = schemas[oldName];
            delete schemas[oldName];
          }
        }

        // Update all $ref occurrences throughout the document
        function updateRefs(obj) {
          if (!obj || typeof obj !== 'object') {
            return;
          }

          if (obj.$ref && typeof obj.$ref === 'string') {
            for (const [oldName, newName] of renameMap.entries()) {
              const oldRef = `#/components/schemas/${oldName}`;
              const newRef = `#/components/schemas/${newName}`;
              if (obj.$ref === oldRef) {
                obj.$ref = newRef;
              }
            }
          }

          // Recursively update refs in nested objects
          for (const value of Object.values(obj)) {
            if (value && typeof value === 'object') {
              updateRefs(value);
            }
          }
        }

        updateRefs(root);
      }
    }
  };
};

module.exports = {
  id: 'schema-prefix',
  decorators: {
    oas3: {
      'preserve-schema-name-prefixes': PreserveSchemaNamePrefixes,
    }
  }
};


