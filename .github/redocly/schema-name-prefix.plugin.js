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

        // Extract directory and filename from various component paths:
        // - schemas/{directory}/{filename}.yaml
        // - responses/{directory}/{filename}.yaml
        // - parameters/{directory}/{filename}.yaml
        // etc.
        const match = filePath.match(/\/(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks)\/([^\/]+)\/([^\/]+)\.yaml$/);
        if (match) {
          const [, componentType, directory, filename] = match;

          if (directory && directory !== componentType) {
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
              // Only rename if the name differs
              if (componentName !== sourceInfo.prefixedName) {
                const key = `${componentType}/${componentName}`;
                renameMap.set(key, {
                  componentType,
                  oldName: componentName,
                  newName: sourceInfo.prefixedName
                });
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

        // Update all $ref occurrences throughout the document
        function updateRefs(obj) {
          if (!obj || typeof obj !== 'object') {
            return;
          }

          if (obj.$ref && typeof obj.$ref === 'string') {
            for (const [key, { componentType, oldName, newName }] of renameMap.entries()) {
              const oldRef = `#/components/${componentType}/${oldName}`;
              const newRef = `#/components/${componentType}/${newName}`;
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
      'preserve-schema-name-prefixes': PreserveComponentNamePrefixes,
    }
  }
};




