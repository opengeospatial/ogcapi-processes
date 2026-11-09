#!/usr/bin/env node
/**
 * Validates every OpenAPI variant (oas30, oas31, oas32) of the OGC API - Processes definition.
 *
 * For each variant:
 *   1. Check the file is in sync with the 'ogcapi-processes.yaml' source (only the 'openapi' version differs).
 *   2. Bundle it with Redocly, resolving all '$ref'.
 *   3. Validate the bundle against the official OpenAPI JSON Schema of the declared version.
 *   4. Check rules that the JSON Schema of the specification cannot enforce (component names, 'nullable').
 *   5. Lint the bundle with the repository Redocly configuration.
 *
 * Usage (from the 'openapi' directory, after 'npm install'):
 *   node validate.mjs [oas30 oas31 oas32 ...]
 *   npm run validate
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Validator } from "@seriousme/openapi-schema-validator";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "ogcapi-processes.yaml");
const REDOCLY = join(HERE, "node_modules", ".bin", process.platform === "win32" ? "redocly.cmd" : "redocly");
const REDOCLY_CONFIG = join(HERE, "..", ".github", "redocly", "config.yaml");

export const VARIANTS = {
  oas30: { version: "3.0.3", family: "3.0" },
  oas31: { version: "3.1.0", family: "3.1" },
  oas32: { version: "3.2.0", family: "3.2" },
};

const COMPONENT_NAME = /^[a-zA-Z0-9._-]+$/;

const variantFile = (name) => join(HERE, `${name}-ogcapi-processes.yaml`);

// Keywords whose children are user-defined names (not schema keywords) or instance data.
const NAME_MAPS = new Set(["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"]);
const DATA_KEYS = new Set(["example", "examples", "default", "enum", "const"]);

/**
 * Collect schema keywords that are not portable across 3.0.x, 3.1.x and 3.2.x.
 * Only 'nullable' needs a custom check since the 3.1+ meta-schemas silently accept unknown keywords.
 */
export function findPortabilityIssues(node, path = "#", issues = []) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => findPortabilityIssues(item, `${path}/${i}`, issues));
    return issues;
  }
  if (node === null || typeof node !== "object") {
    return issues;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "nullable" && typeof value === "boolean") {
      issues.push(`${path}: 'nullable' is removed in OpenAPI 3.1+, use 'oneOf' with '{enum: [null]}'`);
    }
    if (key.startsWith("x-") || DATA_KEYS.has(key)) {
      continue;
    }
    if (NAME_MAPS.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
      for (const [name, sub] of Object.entries(value)) {
        findPortabilityIssues(sub, `${path}/${key}/${name}`, issues);
      }
      continue;
    }
    findPortabilityIssues(value, `${path}/${key}`, issues);
  }
  return issues;
}

function expectedVariant(sourceText, version) {
  return sourceText.replace(/^openapi:.*$/m, `openapi: ${version}`);
}

function run(args) {
  return execFileSync(REDOCLY, args, { cwd: HERE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

async function validateVariant(name, workDir) {
  const { version, family } = VARIANTS[name];
  const file = variantFile(name);
  const errors = [];

  if (!existsSync(file)) {
    return [`${file} does not exist (run 'sh update.sh' to generate it)`];
  }
  const sourceText = readFileSync(SOURCE, "utf8");
  if (readFileSync(file, "utf8") !== expectedVariant(sourceText, version)) {
    errors.push(`${name}-ogcapi-processes.yaml is out of sync with ogcapi-processes.yaml (run 'sh update.sh')`);
  }

  const bundle = join(workDir, `${name}.bundled.json`);
  try {
    run([
      "bundle", "--config", REDOCLY_CONFIG, "--component-renaming-conflicts-severity=off", file, "-o", bundle,
    ]);
  } catch (err) {
    return [...errors, `bundling failed:\n${err.stderr || err.stdout || err.message}`];
  }

  const spec = JSON.parse(readFileSync(bundle, "utf8"));
  if (typeof spec.openapi !== "string" || !spec.openapi.startsWith(`${family}.`)) {
    errors.push(`declared OpenAPI version is '${spec.openapi}', expected '${family}.x'`);
  }
  // The JSON Schema of the specification is applied directly. The 'validate' method of the library
  // additionally scans for '$ref' keys, which wrongly flags properties named '$ref' (e.g.: 'reference.yaml').
  // Bundling already guarantees that all references are resolved.
  const validate = new Validator().getAjvValidator(family);
  if (!validate(spec)) {
    for (const e of validate.errors ?? []) {
      errors.push(`schema: ${e.instancePath || "/"} ${e.message} ${JSON.stringify(e.params)}`);
    }
  }

  // The JSON Schema of the specification does not reject component names that violate the naming rule.
  for (const [section, entries] of Object.entries(spec.components ?? {})) {
    for (const key of Object.keys(entries ?? {})) {
      if (!COMPONENT_NAME.test(key)) {
        errors.push(`components: '${section}/${key}' does not match ${COMPONENT_NAME}`);
      }
    }
  }
  findPortabilityIssues(spec).forEach((issue) => errors.push(`portability: ${issue}`));

  try {
    run(["lint", "--config", REDOCLY_CONFIG, "--format", "stylish", bundle]);
  } catch (err) {
    errors.push(`lint:\n${err.stdout || err.stderr || err.message}`);
  }
  return errors;
}

async function main() {
  const requested = process.argv.slice(2);
  const names = requested.length ? requested : Object.keys(VARIANTS);
  const unknown = names.filter((n) => !(n in VARIANTS));
  if (unknown.length) {
    console.error(`Unknown variant(s): ${unknown.join(", ")}. Available: ${Object.keys(VARIANTS).join(", ")}`);
    process.exit(2);
  }
  if (!existsSync(REDOCLY)) {
    console.error("Redocly CLI not found. Run 'npm install' (or 'npm ci') in the 'openapi' directory first.");
    process.exit(2);
  }

  const workDir = mkdtempSync(join(tmpdir(), "ogcapi-processes-"));
  let failed = false;
  try {
    for (const name of names) {
      const errors = await validateVariant(name, workDir);
      if (errors.length) {
        failed = true;
        console.error(`✗ ${name} (OpenAPI ${VARIANTS[name].version}): ${errors.length} problem(s)`);
        errors.forEach((e) => console.error(`    ${e.replace(/\n/g, "\n    ")}`));
      } else {
        console.log(`✓ ${name} (OpenAPI ${VARIANTS[name].version}) is valid`);
      }
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
