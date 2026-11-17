import { describe, expect, it } from "vitest";
import { cycleReducer, initialCycle, type Cycle } from "./cycle";

const run = (actions: Parameters<typeof cycleReducer>[1][], from: Cycle = initialCycle) => actions.reduce(cycleReducer, from);

describe("ciclo de visuales", () => {
  it("arranca quieto en el primer elemento (servidor, sin JS, reduced motion)", () => {
    expect(initialCycle).toEqual({ index: 0, run: 0, phase: "rest", playing: false });
  });

  it("entra, sale y pasa al siguiente, volviendo al principio", () => {
    const state = run([{ type: "start" }, { type: "exit" }, { type: "advance", total: 2 }, { type: "exit" }, { type: "advance", total: 2 }]);
    expect(state).toMatchObject({ index: 0, phase: "enter", playing: true });
    expect(state.run).toBe(3);
  });

  it("pausar deja el elemento completo y quieto; reanudar lo vuelve a dibujar", () => {
    const paused = run([{ type: "start" }, { type: "toggle" }]);
    expect(paused).toMatchObject({ phase: "rest", playing: false });
    expect(run([{ type: "exit" }, { type: "advance", total: 3 }], paused)).toEqual(paused);
    const resumed = cycleReducer(paused, { type: "toggle" });
    expect(resumed).toMatchObject({ phase: "enter", playing: true, run: paused.run + 1 });
  });

  it("elegir un elemento detiene el ciclo; con reduced motion, sin animar", () => {
    expect(run([{ type: "start" }, { type: "select", index: 2, animate: true }])).toMatchObject({ index: 2, phase: "enter", playing: false });
    expect(run([{ type: "select", index: 1, animate: false }])).toMatchObject({ index: 1, phase: "rest", playing: false });
  });

  it("si reduced motion se activa a mitad de ciclo, queda quieto en el elemento actual", () => {
    const state = run([{ type: "start" }, { type: "exit" }, { type: "advance", total: 3 }, { type: "reducedMotion" }]);
    expect(state).toMatchObject({ index: 1, phase: "rest", playing: false });
  });
});
