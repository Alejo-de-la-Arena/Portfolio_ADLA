import { visualUi as ui } from "./dictionary";
import { fill, formatMm, list } from "./describe-visuals";
import type { Elevation, ElevationSet } from "./elevations";
import type { Locale } from "./types";

/** What the elevation contains, counted from its modules. */
function parts(elevation: Elevation, locale: Locale): string[] {
  let swing = 0, sliding = 0, drawers = 0, shelves = 0, sinks = 0, boards = 0;
  for (const m of elevation.modulos) {
    if (m.tipo === "puertas-batientes") swing += m.hojas;
    else if (m.tipo === "puertas-corredizas") sliding += m.hojas;
    else if (m.tipo === "cajones") drawers += m.n;
    else if (m.tipo === "estantes") shelves += m.n;
    else if (m.tipo === "bacha") sinks += 1;
    else if (m.tipo === "tabla") boards += 1;
  }
  const out: string[] = [];
  if (swing) out.push(swing === 1 ? ui.partSwingDoorOne[locale] : fill(ui.partSwingDoor[locale], { n: swing }));
  if (sliding) out.push(fill(ui.partSlidingDoor[locale], { n: sliding }));
  if (drawers) out.push(drawers === 1 ? ui.partDrawerOne[locale] : fill(ui.partDrawer[locale], { n: drawers }));
  if (shelves) out.push(fill(ui.partShelf[locale], { n: shelves }));
  if (sinks) out.push(ui.partSink[locale]);
  if (boards) out.push(fill(ui.partBoard[locale], { n: boards }));
  return out;
}

export function describeElevation(elevation: Elevation, locale: Locale): string {
  const head = fill(ui.planDescribeItem[locale], {
    name: elevation.name[locale], width: formatMm(elevation.ancho, locale), height: formatMm(elevation.alto, locale),
  });
  const modules = elevation.parciales && elevation.parciales.length > 1
    ? fill(ui.planDescribeModules[locale], { list: list(elevation.parciales.map((p) => formatMm(p, locale)), locale) }) : null;
  const contents = parts(elevation, locale);
  return [head, modules, contents.length ? fill(ui.planDescribeParts[locale], { list: list(contents, locale) }) : null]
    .filter(Boolean).join("; ") + ".";
}

export function describeElevations(set: ElevationSet, locale: Locale): string {
  return [fill(ui.planDescribeIntro[locale], { title: set.title[locale], total: set.items.length }),
    ...set.items.map((item) => describeElevation(item, locale))].join(" ");
}
