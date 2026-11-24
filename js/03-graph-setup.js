// ARQUIVO: 03-graph-setup.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Carregar um grafo de GRAPHS para dentro do estado global
//   (NODES/EDGES/ADJACENCY/START/DEST) e calcular a distância de cada nó até
//   o destino (usada para decidir "melhor"/"pior" vizinho ao mover).
// DEPENDE DE: 01-graph-data.js (GRAPHS), 02-state.js (variáveis que preenche).
// EXPÕE: loadGraph(id), computeDist(target)
// USADO POR: 08-turns.js (setGraph/startGame chamam loadGraph),
//   10-lifecycle.js (resetGame), 11-ui-layout.js (bootstrap inicial)
// ═══════════════════════════════════════════════════════════════════════════
// ─── GRAPH SETUP ─────────────────────────────────────────────────────────────
import { GRAPHS } from "./01-graph-data.js";
import { state } from "./02-state.js";

export function loadGraph(id) {
  const g = GRAPHS[id];
  state.NODES = g.nodes;
  state.EDGES = g.edges;
  state.START = g.start;
  state.DEST = g.dest;
  state.ADJACENCY = {};
  Object.keys(state.NODES).forEach((n) => (state.ADJACENCY[n] = []));
  state.EDGES.forEach(([a, b]) => {
    state.ADJACENCY[a].push(b);
    state.ADJACENCY[b].push(a);
  });
  state.DIST = computeDist(state.DEST);
  state.playerPos = [state.START, state.START, state.START];
  state.playerFinished = [false, false, false];
  ["pos0", "pos1", "pos2"].forEach(
    (id) => (document.getElementById(id).textContent = state.START),
  );
}

export function computeDist(target) {
  const dist = {},
    q = [target];
  dist[target] = 0;
  while (q.length) {
    const n = q.shift();
    state.ADJACENCY[n].forEach((nb) => {
      if (dist[nb] === undefined) {
        dist[nb] = dist[n] + 1;
        q.push(nb);
      }
    });
  }
  return dist;
}

// ═══════════════════════════════════════════════════════════════════════════
