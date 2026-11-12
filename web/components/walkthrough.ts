/** State of a diagram walkthrough. step null is the overview: every connection drawn, nothing
    highlighted. It is also the server, no-JavaScript and reduced-motion rendering. */
export type Walkthrough = { step: number | null; playing: boolean };

export type WalkthroughAction =
  | { type: "start" }
  | { type: "advance"; total: number }
  | { type: "toggle" }
  | { type: "go"; step: number | null }
  | { type: "previous"; total: number }
  | { type: "next"; total: number }
  /** prefers-reduced-motion became active: stop and show the whole system. */
  | { type: "reducedMotion" };

export const initialWalkthrough: Walkthrough = { step: null, playing: false };

export function walkthroughReducer(state: Walkthrough, action: WalkthroughAction): Walkthrough {
  switch (action.type) {
    case "start": return { step: 0, playing: true };
    case "advance":
      if (!state.playing) return state;
      return { ...state, step: state.step === null ? 0 : state.step + 1 < action.total ? state.step + 1 : null };
    case "toggle": return state.playing ? { ...state, playing: false } : { step: state.step ?? 0, playing: true };
    case "go": return { step: action.step, playing: false };
    case "previous": return { step: state.step === null ? action.total - 1 : state.step === 0 ? null : state.step - 1, playing: false };
    case "next": return { step: state.step === null ? 0 : state.step + 1 < action.total ? state.step + 1 : null, playing: false };
    case "reducedMotion": return initialWalkthrough;
  }
}
