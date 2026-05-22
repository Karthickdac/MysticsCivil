import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typesIndex = resolve(__dirname, "../../api-zod/src/generated/types/index.ts");

let content = readFileSync(typesIndex, "utf8");

// Remove type entries that conflict with top-level zod schema const exports in api.ts.
// orval generates both a zod const (value) and a TS type for multipart/binary request bodies,
// and re-exporting both causes TS2308. The zod schema in api.ts already covers validation;
// the TS type alias in types/ is redundant for these cases.
const conflicting = [
  "export * from './importBoqItemsXlsxBody';",
];

for (const line of conflicting) {
  content = content.replace(line + "\n", "").replace(line, "");
}

writeFileSync(typesIndex, content);
console.log("patch-generated: removed conflicting body type re-exports from types/index.ts");
