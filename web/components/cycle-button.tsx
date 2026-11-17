import { visualUi as ui } from "@/content/dictionary";
import type { Locale } from "@/content/types";
import styles from "./cycle-button.module.css";

/** Pause / play for an automatic cycle (WCAG 2.2.2). Native button, 44 px square. */
export function CycleButton({ playing, locale, onClick }: { playing: boolean; locale: Locale; onClick: () => void }) {
  return <button type="button" className={styles.button} onClick={onClick}
    aria-label={playing ? ui.pauseCycle[locale] : ui.playCycle[locale]}>
    <svg viewBox="0 0 16 16" aria-hidden="true">{playing
      ? <><rect x="3.5" y="3" width="3" height="10" /><rect x="9.5" y="3" width="3" height="10" /></>
      : <polygon points="4,2.5 13.5,8 4,13.5" />}</svg>
  </button>;
}
