// ARQUIVO: 05-algorithm.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: O "motor" do BFS/DFS em si — tirar o próximo nó da
//   fila/pilha, expandi-lo (marcar como explorado, empilhar/enfileirar
//   vizinhos), calcular % de exploração e decidir quando o destino é
//   revelado.
// DEPENDE DE: 02-state.js (bfsQueue/dfsStack/exploredNodes/visitedNodes/
//   layerTracker/algo/DEST/destRevealed), 04-render.js (usa ids de
//   elementos SVG indiretamente via 09-visuals), 09-visuals.js (markEdge,
//   highlightNode — chamadas por expandNode).
// ATENÇÃO (dependência "circular"): revealDest() chama endGame(), que só é
//   definida em 10-lifecycle.js (carregado DEPOIS deste arquivo na ordem
//   sugerida). Isso é seguro porque revealDest só executa dentro de uma
//   jogada real (nunca no carregamento da página) — nesse ponto todos os
//   scripts já terminaram de carregar. Ver nota no manifesto no topo do
//   arquivo.
// EXPÕE: peekNext(), consumeNext(), expandNode(node), explorationPct(),
//   updateProgress(), checkDestReveal(node), revealDest()
// USADO POR: 08-turns.js (expandTurnNode chama consumeNext/expandNode),
//   07-teleport.js (checkTeleportUnlock lê bfsQueue/layerTracker)
// ═══════════════════════════════════════════════════════════════════════════
// ─── ALGO ────────────────────────────────────────────────────────────────────
import { state, THRESHOLD, safeTimeout } from "./02-state.js";
import { addBadge, getNodeRadius } from "./04-render.js";
import { markEdge, highlightNode, addLog, showFeedback } from "./09-visuals.js";
import { endGame } from "./10-lifecycle.js";

export function peekNext() {
  if (state.algo === "BFS")
    return state.bfsQueue.length > 0 ? state.bfsQueue[0] : null;
  for (let i = state.dfsStack.length - 1; i >= 0; i--)
    if (!state.exploredNodes.has(state.dfsStack[i])) return state.dfsStack[i];
  return null;
}
export function consumeNext() {
  if (state.algo === "BFS")
    return state.bfsQueue.length > 0 ? state.bfsQueue.shift() : null;
  while (state.dfsStack.length > 0) {
    const n = state.dfsStack.pop();
    if (!state.exploredNodes.has(n)) return n;
  }
  return null;
}
export function expandNode(node) {
  state.exploredNodes.add(node);
  if (state.algo === "BFS") {
    const layer = state.layerTracker[node] ?? 0;
    state.ADJACENCY[node].sort().forEach((n) => {
      if (!state.visitedNodes.has(n)) {
        state.visitedNodes.add(n);
        state.bfsQueue.push(n);
        state.layerTracker[n] = layer + 1;
        markEdge(node, n);
      }
    });
  } else {
    state.ADJACENCY[node]
      .sort()
      .reverse()
      .forEach((n) => {
        if (!state.visitedNodes.has(n)) {
          state.visitedNodes.add(n);
          state.dfsStack.push(n);
          markEdge(node, n);
        }
      });
  }
  updateProgress();
  checkDestReveal(node);
}

export function explorationPct() {
  return state.exploredNodes.size / Object.keys(state.NODES).length;
}

export function updateProgress() {
  const pct = explorationPct();
  const pctDisplay = Math.round(pct * 100);
  document.getElementById("progressFill").style.width = pctDisplay + "%";
  if (state.destRevealed) {
    document.getElementById("progressLabel").textContent =
      `${pctDisplay}% explorado — destino revelado!`;
  } else {
    const needed = Math.ceil(THRESHOLD * Object.keys(state.NODES).length);
    const remaining = Math.max(0, needed - state.exploredNodes.size);
    document.getElementById("progressLabel").textContent =
      pct >= THRESHOLD
        ? `${pctDisplay}% — aguardando nó destino`
        : `${pctDisplay}% — faltam ${remaining} nós`;
  }
}

export function checkDestReveal(node) {
  if (state.destRevealed) return;
  const pct = explorationPct();
  const destExplored = state.exploredNodes.has(state.DEST);
  if (pct >= THRESHOLD && destExplored) {
    revealDest();
  }
}

export function revealDest() {
  state.destRevealed = true;
  const c = document.getElementById(`circle-${state.DEST}`);
  const l = document.getElementById(`label-${state.DEST}`);
  if (c) {
    // Retira a cor inline aplicada na exploração para respeitar o estilo de destino.
    c.style.removeProperty("fill");
    c.style.removeProperty("stroke");
    c.setAttribute("class", "node-circle destination revealed");
  }
  if (l) {
    l.setAttribute("class", "node-label");
    l.textContent = state.DEST;
  }
  addBadge(state.DEST, "★ DESTINO", -(getNodeRadius() + 12), "#888899");
  showFeedback("★ DESTINO REVELADO!", "warn");
  addLog(`★ Destino <span>${state.DEST}</span> revelado!`, "warn");
  updateProgress();

  // Verifica se algum jogador já está no nó destino
  const atDest = state.playerPos.indexOf(state.DEST);
  if (atDest !== -1) {
    state.playerFinished[atDest] = true;
    safeTimeout(() => endGame(atDest), 600);
    return;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
