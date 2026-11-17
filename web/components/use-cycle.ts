"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { cycleReducer, initialCycle } from "./cycle";

export const motionQuery = "(prefers-reduced-motion: reduce)";

export type CycleTiming = { enter: number; hold: number; exit: number };

/** Runs the cycle reducer with timers. It starts the first time the root is on screen (never with
    reduced motion), waits while it is off screen, and stops if reduced motion turns on mid-cycle. */
export function useCycle(total: number, timing: CycleTiming) {
  const [state, dispatch] = useReducer(cycleReducer, initialCycle);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !started.current && !window.matchMedia(motionQuery).matches) {
        started.current = true;
        dispatch({ type: "start" });
      }
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia(motionQuery);
    const onChange = () => { if (query.matches) dispatch({ type: "reducedMotion" }); };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const { enter, hold, exit } = timing;
  useEffect(() => {
    if (!state.playing || !visible) return;
    const id = state.phase === "enter" ? window.setTimeout(() => dispatch({ type: "exit" }), enter + hold)
      : state.phase === "exit" ? window.setTimeout(() => dispatch({ type: "advance", total }), exit)
      : undefined;
    return () => window.clearTimeout(id);
  }, [state.phase, state.run, state.playing, visible, total, enter, hold, exit]);

  const select = useCallback((index: number) =>
    dispatch({ type: "select", index, animate: !window.matchMedia(motionQuery).matches }), []);
  const toggle = useCallback(() => dispatch({ type: "toggle" }), []);

  return { state, select, toggle, rootRef };
}
