/** Automatic cycle through a few items (elevations, Seasons) with pause. Pure, so it is tested apart
    from timers. phase rest is the complete, still rendering: server, no JavaScript, reduced motion,
    paused. enter draws the current item in; exit takes it out before the next. run changes whenever
    the item has to be drawn again, so the component can restart its CSS animations with a key. */
export type Cycle = { index: number; run: number; phase: "rest" | "enter" | "exit"; playing: boolean };

export type CycleAction =
  | { type: "start" }
  /** The current item was on screen long enough: take it out. */
  | { type: "exit" }
  /** The exit finished: next item, wrapping around. */
  | { type: "advance"; total: number }
  | { type: "toggle" }
  /** The visitor picked an item: it stays, the cycle stops. animate is false with reduced motion. */
  | { type: "select"; index: number; animate: boolean }
  /** prefers-reduced-motion became active: stop and show the current item still. */
  | { type: "reducedMotion" };

export const initialCycle: Cycle = { index: 0, run: 0, phase: "rest", playing: false };

export function cycleReducer(state: Cycle, action: CycleAction): Cycle {
  switch (action.type) {
    case "start": return { ...state, run: state.run + 1, phase: "enter", playing: true };
    case "exit": return state.playing && state.phase === "enter" ? { ...state, phase: "exit" } : state;
    case "advance":
      if (!state.playing || state.phase !== "exit") return state;
      return { index: (state.index + 1) % action.total, run: state.run + 1, phase: "enter", playing: true };
    case "toggle": return state.playing
      ? { ...state, playing: false, phase: "rest" }
      : { ...state, run: state.run + 1, phase: "enter", playing: true };
    case "select": return { index: action.index, run: state.run + 1, phase: action.animate ? "enter" : "rest", playing: false };
    case "reducedMotion": return { ...state, playing: false, phase: "rest" };
  }
}
