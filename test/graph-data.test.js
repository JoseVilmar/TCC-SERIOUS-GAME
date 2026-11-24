import { describe, it, expect } from "vitest";
import { GRAPHS } from "../js/01-graph-data.js";
import { loadGraph, computeDist } from "../js/03-graph-setup.js";
import { state } from "../js/02-state.js";

describe("Consistência dos grafos", () => {
  const sizes = { 1: 11, 2: 19, 3: 27 };

  for (const [id, size] of Object.entries(sizes)) {
    it(`grafo ${id} contém ${size} nós e arestas válidas`, () => {
      const graph = GRAPHS[id];
      const ids = new Set(Object.keys(graph.nodes));
      expect(ids.size).toBe(size);
      expect(ids.has(graph.start)).toBe(true);
      expect(ids.has(graph.dest)).toBe(true);
      expect(graph.dest).not.toBe(graph.start);
      for (const [from, to] of graph.edges) {
        expect(ids.has(from)).toBe(true);
        expect(ids.has(to)).toBe(true);
        expect(from).not.toBe(to);
      }
      loadGraph(Number(id));
      expect(Object.keys(computeDist(state.DEST))).toHaveLength(size);
    });
  }
});
