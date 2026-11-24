// ARQUIVO: 06-movement.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Funções puras de cálculo de movimento — quais vizinhos
//   já explorados um jogador pode alcançar, qual é o melhor/pior/aleatório
//   dentre eles, e como montar as opções de palpite (guess) mostradas a P1.
// DEPENDE DE: 02-state.js (ADJACENCY, exploredNodes, DIST).
// EXPÕE: exploredAdjacent(pos), bestExploredAdjacent(pos),
//   worstExploredAdjacent(pos), getGuessOptions(correct)
// USADO POR: 08-turns.js (todo o fluxo de turnos usa estas funções para
//   decidir movimento de P1/P2/P3 e montar as opções de palpite)
// ═══════════════════════════════════════════════════════════════════════════
// ─── AJUDANTES DE MOVIMENTO ───────────────────────────────────────────────────
import { state } from "./02-state.js";

export function exploredAdjacent(pos) {
  // apenas vizinhos adjacentes que já foram explorados pelo algoritmo
  return state.ADJACENCY[pos].filter((n) => state.exploredNodes.has(n));
}

export function bestExploredAdjacent(pos) {
  const nb = exploredAdjacent(pos);
  if (!nb.length) return pos;
  return nb.reduce((b, n) => (state.DIST[n] < state.DIST[b] ? n : b), nb[0]);
}

export function worstExploredAdjacent(pos) {
  const nb = exploredAdjacent(pos);
  if (!nb.length) return pos;
  return nb.reduce((w, n) => (state.DIST[n] > state.DIST[w] ? n : w), nb[0]);
}

export function getGuessOptions(correct) {
  const totalNodes = Object.keys(state.NODES);
  const pool = totalNodes.filter(
    (n) => n !== correct && !state.exploredNodes.has(n) && n !== state.START,
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = [correct, ...pool.slice(0, 2)];
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

// ═══════════════════════════════════════════════════════════════════════════
