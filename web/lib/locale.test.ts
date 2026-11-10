import { expect, it } from "vitest";
import { preferredLocale } from "./locale";
it.each([
  [null, "es"], ["", "es"], ["en-US,en;q=0.9,es;q=0.8", "en"],
  ["es-AR,es;q=0.9", "es"], ["es;q=0.2,en;q=0.9", "en"],
  ["fr,en;q=0.8", "en"], ["en;q=0,es;q=0.5", "es"],
  ["en;q=invalid,es", "es"], ["EN-gb", "en"], ["de", "es"],
  ["*;q=0.1,en;q=0.9", "en"], ["en;q=2,es;q=0.4", "es"],
])("negocia %s → %s", (header, expected) => {
  expect(preferredLocale(header)).toBe(expected);
});
