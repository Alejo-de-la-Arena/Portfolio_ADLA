"use client";

import { useId, type CSSProperties } from "react";
import { visualUi as ui } from "@/content/dictionary";
import { describeSeasons } from "@/content/describe-visuals";
import type { SeasonSet } from "@/content/seasons";
import type { Locale } from "@/content/types";
import { formatDate } from "@/lib/dates";
import { seasonAccentVars } from "@/lib/season-theme";
import { useCycle } from "./use-cycle";
import { CycleButton } from "./cycle-button";
import { SeasonSticker } from "./season-sticker";
import styles from "./season-selector.module.css";

const TIMING = { enter: 700, hold: 3300, exit: 0 };

type Props = {
  set: SeasonSet;
  locale: Locale;
  /** full: card with the Season list and legend beside it. thumbnail: card, compact buttons, legend. */
  variant?: "full" | "thumbnail";
  className?: string;
};

/** FORMAT: the same interface, another identity. One poster card; changing Season rewrites only its CSS
    custom properties (seasonAccentVars, the client's lib/theme.ts) and its sticker shape. */
export function SeasonSelector({ set, locale, variant = "full", className }: Props) {
  const { state, select, toggle, rootRef } = useCycle(set.items.length, TIMING);
  const baseId = useId();
  const season = set.items[state.index];
  const descriptionId = `${baseId}-description`;
  const number = ui.seasonNumber[locale].replace("{n}", season.numero);
  const fridays = ui.fridays[locale].replace("{n}", String(season.fechas.length));

  const card = <div className={styles.card} style={seasonAccentVars(season) as CSSProperties}
    role="img" aria-label={`${season.nombre}, ${number}`} aria-describedby={descriptionId} data-phase={state.phase}>
    {/* The card is the size container; the sheet inside lays out in its units. */}
    <div className={styles.sheet}>
      <p className={styles.top}><span>FORMAT</span><span>{number}</span></p>
      <SeasonSticker key={state.run} forma={season.forma} rotate={state.index % 2 ? 7 : -9}
        className={styles.sticker} logoClassName={styles.logo} />
      <p className={styles.name}>{season.nombre}</p>
      <p className={styles.dates}>
        <span>{formatDate(season.fechaInicio, locale)} – {formatDate(season.fechaFin, locale)}</span>
        <span className={styles.badge}>{fridays}</span>
      </p>
      <p className={styles.band}>{season.intro}</p>
    </div>
  </div>;

  const description = <p id={descriptionId} className="visually-hidden">{describeSeasons(set, locale)}</p>;
  const choices = <ul className={styles.choices} aria-label={ui.chooseSeason[locale]}>
    {set.items.map((item, index) => <li key={item.slug}>
      <button type="button" aria-pressed={index === state.index} onClick={() => select(index)}>
        <span className={styles.swatch} style={{ background: item.colores[0] }} aria-hidden="true" />
        <span className={styles.choiceName}>{item.nombre}</span>
        {variant === "full" && <span className={styles.choiceMeta}>{item.numero}</span>}
      </button>
    </li>)}
  </ul>;
  const playButton = <CycleButton playing={state.playing} locale={locale} onClick={toggle} />;
  const legend = <p className={styles.legend}>{ui.seasonsLegend[locale]}</p>;

  if (variant === "thumbnail") {
    return <figure ref={rootRef} className={`${styles.root} ${styles.thumbnail} ${className ?? ""}`}>
      {card}
      {description}
      <figcaption className={styles.caption}>
        <div className={styles.row}>{playButton}{choices}</div>
        {legend}
      </figcaption>
    </figure>;
  }

  return <figure ref={rootRef} className={`${styles.root} ${className ?? ""}`}>
    <div className={styles.layout}>
      <div className={styles.canvas}>{card}{description}</div>
      <figcaption className={styles.panel}>
        <div className={styles.controls}>
          {playButton}
          <p className={styles.status} aria-live={state.playing ? "off" : "polite"}>{season.nombre} · {number}</p>
        </div>
        {choices}
        {legend}
      </figcaption>
    </div>
  </figure>;
}
