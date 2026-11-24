import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../js/02-state.js";
import { loadGraph } from "../js/03-graph-setup.js";
import {
  exploredAdjacent,
  bestExploredAdjacent,
  worstExploredAdjacent,
  getGuessOptions,
} from "../js/06-movement.js";

describe("Movement helpers", () => {
  beforeEach(() => {
    loadGraph(1);
    state.exploredNodes = new Set();
    // garante que DIST existe (foi calculado por loadGraph)
    state.DIST = state.DIST || {};
  });

  it("exploredAdjacent returns only explored neighbors", () => {
    // escolhe um nó que tenha vizinhos
    const pos = state.START;
    // marca um vizinho como explorado
    const nb = state.ADJACENCY[pos][0];
    state.exploredNodes = new Set([nb]);
    const res = exploredAdjacent(pos);
    expect(res).toContain(nb);
  });

  it("bestExploredAdjacent and worstExploredAdjacent behave", () => {
    // garante DIST (calculado por loadGraph) e usa-o
    state.DIST = state.DIST || {};
    const pos = state.START;
    // marca todos os vizinhos como explorados
    state.ADJACENCY[pos].forEach((n) => state.exploredNodes.add(n));
    const best = bestExploredAdjacent(pos);
    const worst = worstExploredAdjacent(pos);
    expect(best).toBeDefined();
    expect(worst).toBeDefined();
    // o melhor deve ter distância <= pior
    expect(state.DIST[best]).toBeLessThanOrEqual(state.DIST[worst]);
  });

  it("getGuessOptions includes correct, has no duplicates and length <= 3", () => {
    // tornar determinístico
    const spy = vi.spyOn(Math, "random").mockImplementation(() => 0.3);
    const correct = state.START;
    const opts = getGuessOptions(correct);
    expect(opts).toContain(correct);
    const uniq = new Set(opts);
    expect(uniq.size).toBe(opts.length);
    expect(opts.length).toBeGreaterThanOrEqual(1);
    expect(opts.length).toBeLessThanOrEqual(3);
    spy.mockRestore();
  });
});
