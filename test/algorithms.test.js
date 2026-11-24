import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../js/02-state.js";
import { loadGraph, computeDist } from "../js/03-graph-setup.js";
import {
  peekNext,
  consumeNext,
  expandNode,
  explorationPct,
  checkDestReveal,
} from "../js/05-algorithm.js";

describe("Algorithm core (BFS/DFS)", () => {
  beforeEach(() => {
    // carrega o grafo 1 para popular state.NODES/ADJACENCY etc.
    loadGraph(1);
    // garante estruturas de estado limpas
    state.exploredNodes = new Set();
    state.visitedNodes = new Set();
    state.bfsQueue = [];
    state.dfsStack = [];
    state.layerTracker = {};
  });

  it("BFS: queue, visited, explored, expansion has no duplicates", () => {
    state.algo = "BFS";
    state.exploredNodes = new Set([state.START]);
    state.visitedNodes = new Set([state.START]);
    state.layerTracker = { [state.START]: 0 };
    state.ADJACENCY[state.START].sort().forEach((n) => {
      if (!state.visitedNodes.has(n)) {
        state.visitedNodes.add(n);
        state.bfsQueue.push(n);
        state.layerTracker[n] = 1;
      }
    });

    const first = peekNext();
    expect(first).toBe(state.bfsQueue[0]);

    const consumed = consumeNext();
    expect(consumed).toBe(first);

    expandNode(consumed);
    expect(state.exploredNodes.has(consumed)).toBe(true);

    // garante que bfsQueue não contenha duplicatas
    const uniq = new Set(state.bfsQueue);
    expect(uniq.size).toBe(state.bfsQueue.length);
  });

  it("DFS: stack, visited, explored, expansion has no duplicates", () => {
    state.algo = "DFS";
    state.exploredNodes = new Set([state.START]);
    state.visitedNodes = new Set([state.START]);
    state.dfsStack = [];
    // empilha vizinhos da mesma forma que o jogo faz no início
    state.ADJACENCY[state.START]
      .sort()
      .reverse()
      .forEach((n) => {
        if (!state.visitedNodes.has(n)) {
          state.visitedNodes.add(n);
          state.dfsStack.push(n);
        }
      });

    const top = peekNext();
    expect(top).toBe(state.dfsStack[state.dfsStack.length - 1]);

    const popped = consumeNext();
    // o elemento desempilhado deve ser o topo
    expect(popped).toBe(top);

    expandNode(popped);
    expect(state.exploredNodes.has(popped)).toBe(true);

    const uniq = new Set(state.dfsStack);
    expect(uniq.size).toBe(state.dfsStack.length);
  });

  it("BFS and DFS produce different expansion sequences (deterministic)", () => {
    function runSequence(algo, steps = 4) {
      loadGraph(1);
      state.algo = algo;
      state.exploredNodes = new Set([state.START]);
      state.visitedNodes = new Set([state.START]);
      state.bfsQueue = [];
      state.dfsStack = [];
      state.layerTracker = { [state.START]: 0 };
      if (algo === "BFS") {
        state.ADJACENCY[state.START].sort().forEach((n) => {
          if (!state.visitedNodes.has(n)) {
            state.visitedNodes.add(n);
            state.bfsQueue.push(n);
            state.layerTracker[n] = 1;
          }
        });
      } else {
        state.ADJACENCY[state.START]
          .sort()
          .reverse()
          .forEach((n) => {
            state.visitedNodes.add(n);
            state.dfsStack.push(n);
          });
      }
      const seq = [];
      for (let i = 0; i < steps; i++) {
        const n = peekNext();
        if (!n) break;
        seq.push(n);
        consumeNext();
        expandNode(n);
      }
      return seq;
    }

    const bfsSeq = runSequence("BFS", 6);
    const dfsSeq = runSequence("DFS", 6);
    // Ordens de referência para o Grafo 1 com desempate alfabético.
    expect(bfsSeq).toEqual(["B", "C", "D", "E", "F", "G"]);
    expect(dfsSeq).toEqual(["B", "D", "H", "K", "I", "F"]);
  });

  it("explorationPct returns correct fraction", () => {
    loadGraph(1);
    state.exploredNodes = new Set(["A", "B"]);
    const pct = explorationPct();
    expect(pct).toBeCloseTo(2 / Object.keys(state.NODES).length);
  });

  it("computeDist produces distances to target", () => {
    loadGraph(1);
    const d = computeDist(state.DEST);
    expect(d[state.DEST]).toBe(0);
    expect(typeof d[state.START]).toBe("number");
  });
});
