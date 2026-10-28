import { mkdir, cp, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "web");
const target = path.join(source, "dist");
await mkdir(target, { recursive: true });
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (entry.name.startsWith(".") || entry.name === "dist") continue;
  await cp(path.join(source, entry.name), path.join(target, entry.name), {
    recursive: true,
  });
}
console.log("Site pronto em web/dist");
