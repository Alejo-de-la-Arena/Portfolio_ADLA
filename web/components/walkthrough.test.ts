import { describe, expect, it } from "vitest";
import { initialWalkthrough, walkthroughReducer, type Walkthrough } from "./walkthrough";

const total = 10;

describe("recorrido del diagrama", () => {
  it("si prefers-reduced-motion se activa mientras corre, se detiene y muestra el sistema completo", () => {
    let state: Walkthrough = walkthroughReducer(initialWalkthrough, { type: "start" });
    state = walkthroughReducer(state, { type: "advance", total });
    state = walkthroughReducer(state, { type: "advance", total });
    expect(state).toEqual({ step: 2, playing: true });
    state = walkthroughReducer(state, { type: "reducedMotion" });
    expect(state).toEqual({ step: null, playing: false });
    // A tick that was already scheduled must not restart it.
    expect(walkthroughReducer(state, { type: "advance", total })).toEqual({ step: null, playing: false });
  });

  it("también se detiene si estaba en pausa en un paso", () => {
    const paused = walkthroughReducer({ step: 4, playing: true }, { type: "toggle" });
    expect(paused).toEqual({ step: 4, playing: false });
    expect(walkthroughReducer(paused, { type: "reducedMotion" })).toEqual(initialWalkthrough);
  });

  it("avanza en orden, vuelve a la vista completa al final y reinicia", () => {
    let state: Walkthrough = { step: total - 1, playing: true };
    state = walkthroughReducer(state, { type: "advance", total });
    expect(state).toEqual({ step: null, playing: true });
    expect(walkthroughReducer(state, { type: "advance", total })).toEqual({ step: 0, playing: true });
  });

  it("los controles manuales pausan y navegan", () => {
    expect(walkthroughReducer({ step: 3, playing: true }, { type: "next", total })).toEqual({ step: 4, playing: false });
    expect(walkthroughReducer({ step: 0, playing: false }, { type: "previous", total })).toEqual({ step: null, playing: false });
    expect(walkthroughReducer({ step: null, playing: false }, { type: "previous", total })).toEqual({ step: total - 1, playing: false });
    expect(walkthroughReducer({ step: 5, playing: true }, { type: "go", step: null })).toEqual({ step: null, playing: false });
    expect(walkthroughReducer({ step: null, playing: false }, { type: "toggle" })).toEqual({ step: 0, playing: true });
  });
});
