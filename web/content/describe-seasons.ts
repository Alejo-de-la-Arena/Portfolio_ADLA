import { visualUi as ui } from "./dictionary";
import { fill, list, type DescriptionPart } from "./describe-visuals";
import { seasonShapeName, type SeasonSet } from "./seasons";
import type { Locale } from "./types";
import { formatDate } from "@/lib/dates";
import { INK, readableTextOn } from "@/lib/season-theme";

/** The Seasons description in runs, so each brand intro can be rendered with its own lang attribute. */
export function describeSeasonParts(set: SeasonSet, locale: Locale): DescriptionPart[] {
  const parts: DescriptionPart[] = [{ text: fill(ui.seasonsDescribeIntro[locale], { title: set.title[locale], total: set.items.length }) }];
  for (const season of set.items) {
    const [before, after] = fill(ui.seasonsDescribeItem[locale], {
      name: season.nombre,
      number: season.numero,
      start: formatDate(season.fechaInicio, locale),
      end: formatDate(season.fechaFin, locale),
      fridays: fill(ui.fridays[locale], { n: season.fechas.length }),
      shape: seasonShapeName[season.forma][locale],
      colors: fill((season.colores.length === 1 ? ui.seasonColorOne : ui.seasonColorMany)[locale],
        { list: list([...season.colores], locale) }),
      onAccent: readableTextOn(season.colores[0]) === INK ? ui.ink[locale] : ui.paper[locale],
    }).split("{intro}");
    parts.push({ text: ` ${before}` }, { text: season.intro, lang: set.introLang }, { text: after });
  }
  return parts;
}

export function describeSeasons(set: SeasonSet, locale: Locale): string {
  return describeSeasonParts(set, locale).map((part) => part.text).join("");
}
