import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typesIndex = resolve(__dirname, "../../api-zod/src/generated/types/index.ts");

let content = readFileSync(typesIndex, "utf8");

// Remove type entries that conflict with top-level zod schema const exports in api.ts.
// orval generates both a zod const (value) AND a TS type for each request body/param,
// and re-exporting both with `export *` causes TS2308 for any that share the same name.
// The zod schema in api.ts already covers both validation and type inference; the type
// alias in generated/types/ is redundant for these purposes.
//
// Pattern: for every Body/Params/QueryParams const in api.ts there is a matching type
// file. We keep these in api.ts (zod schemas); they are NOT re-exported from types/.
// Only add entries here when the codegen creates a collision (build fails with TS2308).
const conflicting = [
  "export * from './importBoqItemsXlsxBody';",
  "export * from './generateAbstractBoqItemsBody';",
];

for (const line of conflicting) {
  content = content.replace(line + "\n", "").replace(line, "");
}

writeFileSync(typesIndex, content);
console.log("patch-generated: removed conflicting body type re-exports from types/index.ts");
