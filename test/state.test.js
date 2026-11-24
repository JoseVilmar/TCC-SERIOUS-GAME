import { describe, it, expect, vi } from "vitest";
import { state, safeTimeout } from "../js/02-state.js";
import { resetGame } from "../js/10-lifecycle.js";
import { loadGraph } from "../js/03-graph-setup.js";

describe("State and reset", () => {
  it("resetGame clears state and increments gameEpoch", () => {
    loadGraph(1);
    const before = state.gameEpoch;
    // altera o estado
    state.exploredNodes.add("A");
    state.correctCount = 5;
    state.afterP1MoveCallback = () => {};
    resetGame();
    expect(state.gameEpoch).toBeGreaterThanOrEqual(before + 1);
    expect(state.correctCount).toBe(0);
    expect(state.exploredNodes.size).toBe(0);
    expect(state.destRevealed).toBe(false);
    expect(state.teleportUsed).toBe(false);
    expect(state.afterP1MoveCallback).toBeNull();
  });

  it("start-game-like initialization can be prepared without calling startGame", () => {
    loadGraph(1);
    // simula a configuração mínima de início para o BFS
    state.algo = "BFS";
    state.exploredNodes = new Set([state.START]);
    state.visitedNodes = new Set([state.START]);
    state.bfsQueue = [];
    state.layerTracker = { [state.START]: 0 };
    state.ADJACENCY[state.START].sort().forEach((n) => {
      if (!state.visitedNodes.has(n)) {
        state.visitedNodes.add(n);
        state.bfsQueue.push(n);
        state.layerTracker[n] = 1;
      }
    });
    expect(state.bfsQueue.length).toBeGreaterThan(0);
    expect(state.visitedNodes.has(state.START)).toBe(true);
  });

  it("safeTimeout cancela callbacks de sessões anteriores", () => {
    let scheduled;
    const timer = vi.spyOn(window, "setTimeout").mockImplementation((fn) => {
      scheduled = fn;
      return 1;
    });
    try {
      const callback = vi.fn();
      safeTimeout(callback, 100);
      resetGame();
      scheduled();
      expect(callback).not.toHaveBeenCalled();
    } finally {
      timer.mockRestore();
    }
  });
});
