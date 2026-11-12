import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, sep } from "node:path";
import { expect, it } from "vitest";
import { contentPaths, previewPaths } from "./routes";

it("every localized page is represented in the shared route allowlist", async () => {
  const root = fileURLToPath(new URL("../app/", import.meta.url));
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== "page.tsx") continue;
    const segments = relative(root, entry.parentPath).split(sep);
    if (segments[0] !== "[locale]") continue;
    const pattern = "/" + segments.filter((segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith("@"))
      .map((segment) => /^\[\[\.\.\..+\]\]$/.test(segment) ? ".*"
        : /^\[\.\.\..+\]$/.test(segment) ? ".+"
        : /^\[.+\]$/.test(segment) ? "[^/]+"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/");
    expect([...contentPaths, ...previewPaths].some((path) => new RegExp("^" + pattern + "$").test(path)), segments.join("/") + "/page.tsx is missing from lib/routes.ts").toBe(true);
  }
});
