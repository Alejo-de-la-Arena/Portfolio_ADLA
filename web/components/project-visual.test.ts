import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

/* project-visual.tsx loads each visual with its own dynamic import, so a page downloads only the visual
   it shows. A value import of content/case-visuals.ts (every project's data) from a visual's code would
   put all the projects back into each chunk; type imports are erased and fine. */
const visualModules = [
  "components/system-diagram.tsx",
  "components/elevation-plan.tsx",
  "components/season-selector.tsx",
  "components/season-sticker.tsx",
  "content/describe-diagram.ts",
  "content/describe-elevations.ts",
  "content/describe-seasons.ts",
  "content/describe-visuals.ts",
];

it.each(visualModules)("%s no importa valores de case-visuals.ts", (path) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const imports = [...source.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"([^"]+)";/gm)];
  const valueImports = imports.filter(([, type, from]) => !type && /(^|\/)case-visuals$/.test(from));
  expect(valueImports.map(([line]) => line)).toEqual([]);
});

it("project-visual.tsx carga cada visual con import dinámico", () => {
  const source = readFileSync(new URL("./project-visual.tsx", import.meta.url), "utf8");
  for (const name of ["system-diagram", "elevation-plan", "season-selector"]) {
    expect(source).toContain(`dynamic(() => import("./${name}")`);
    expect(source).not.toMatch(new RegExp(`^import [^;]* from "\\./${name}";`, "m"));
  }
});
