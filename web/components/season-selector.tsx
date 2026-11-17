"use client";

import { useId, useState, type AnimationEvent, type CSSProperties } from "react";
import { visualUi as ui } from "@/content/dictionary";
import { describeSeasonParts } from "@/content/describe-seasons";
import type { Season, SeasonSet } from "@/content/seasons";
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

/** A card on screen. id keys its element, so a card keeps its node while it goes from current to leaving. */
type Layer = { index: number; id: number };

/** One complete card in a Season's own colours: every text sits on its own background, never on a
    colour halfway between two Seasons. */
function SeasonCard({ season, set, index, locale, className, phase, stickerKey, onAnimationEnd }: {
  season: Season; set: SeasonSet; index: number; locale: Locale; className: string;
  phase?: string; stickerKey?: number; onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
}) {
  const number = ui.seasonNumber[locale].replace("{n}", season.numero);
  return <div className={className} style={seasonAccentVars(season) as CSSProperties} data-phase={phase}
    onAnimationEnd={onAnimationEnd}>
    {/* The card is the size container; the sheet inside lays out in its units. */}
    <div className={styles.sheet}>
      <p className={styles.top}><span>FORMAT</span><span>{number}</span></p>
      <SeasonSticker key={stickerKey} forma={season.forma} rotate={index % 2 ? 7 : -9}
        className={styles.sticker} logoClassName={styles.logo} />
      <p className={styles.name}>{season.nombre}</p>
      <p className={styles.dates}>
        <span>{formatDate(season.fechaInicio, locale)} – {formatDate(season.fechaFin, locale)}</span>
        <span className={styles.badge}>{ui.fridays[locale].replace("{n}", String(season.fechas.length))}</span>
      </p>
      {/* Brand copy, verbatim in its own language on both site versions. */}
      <p className={styles.band} lang={set.introLang}>{season.intro}</p>
    </div>
  </div>;
}

/** FORMAT: the same interface, another identity. Changing Season fades the new card in, complete with its
    own colours (seasonAccentVars, the client's lib/theme.ts) and sticker, over the old one, which stays
    opaque underneath until the fade ends. No colour is interpolated, so text and background never pass
    through each other. With reduced motion the new card replaces the old one at once. */
export function SeasonSelector({ set, locale, variant = "full", className }: Props) {
  const { state, select, toggle, rootRef } = useCycle(set.items.length, TIMING);
  const baseId = useId();
  const season = set.items[state.index];
  const descriptionId = `${baseId}-description`;
  const number = ui.seasonNumber[locale].replace("{n}", season.numero);

  // Derived during render (React's "adjusting state when a prop changes"): a new index makes the shown
  // card the leaving one and mounts a new current card on top.
  const [view, setView] = useState<{ current: Layer; leaving: Layer | null }>({ current: { index: state.index, id: 0 }, leaving: null });
  let { current, leaving } = view;
  if (current.index !== state.index) {
    ({ current, leaving } = { current: { index: state.index, id: current.id + 1 }, leaving: current });
    setView({ current, leaving });
  }
  const fadeEnded = (event: AnimationEvent<HTMLDivElement>) => {
    // Only the card's own fade; the sticker's animation bubbles up too.
    if (event.target === event.currentTarget) setView((v) => ({ ...v, leaving: null }));
  };

  const card = <div className={styles.stage} role="img" aria-label={`${season.nombre}, ${number}`} aria-describedby={descriptionId}>
    {leaving && <SeasonCard key={leaving.id} season={set.items[leaving.index]} set={set} index={leaving.index}
      locale={locale} className={`${styles.card} ${styles.leaving}`} />}
    <SeasonCard key={current.id} season={season} set={set} index={state.index} locale={locale}
      className={`${styles.card} ${leaving ? styles.entering : ""}`} phase={state.phase} stickerKey={state.run}
      onAnimationEnd={leaving ? fadeEnded : undefined} />
  </div>;

  const description = <p id={descriptionId} className="visually-hidden">
    {describeSeasonParts(set, locale).map((part, i) => part.lang ? <span key={i} lang={part.lang}>{part.text}</span> : part.text)}
  </p>;
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
