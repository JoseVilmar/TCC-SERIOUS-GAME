// ARQUIVO: 08-turns.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Orquestração central da partida — início/fim de jogo,
//   ordem das rodadas (P1→P2→P3), o turno de cada jogador (palpite +
//   movimento ou movimento automático), a fase só-de-movimento, e a
//   checagem de vitória. É o arquivo com mais dependências de todos, por
//   ser o "maestro" que chama quase tudo o mais.
// DEPENDE DE: 02-state.js, 03-graph-setup.js (loadGraph), 04-render.js
//   (buildGraph), 05-algorithm.js (peekNext/consumeNext/expandNode/
//   explorationPct), 06-movement.js (exploredAdjacent/best.../worst...),
//   09-visuals.js (setNodeClass/addLog/setStatus/updateStructureDisplay),
//   10-lifecycle.js (checkWin chama endGame).
// ATENÇÃO (dependência "circular"): este arquivo chama funções de
//   07-teleport.js (tryP3AutoTeleport, checkTeleportUnlock,
//   updateTeleportButtons) que, por sua vez, chamam de volta funções DESTE
//   arquivo (checkWin, doP2Turn). Isso é seguro pelo mesmo motivo explicado
//   no manifesto do topo do arquivo — nada aqui roda antes de todos os
//   scripts terminarem de carregar.
// EXPÕE: setAlgo(a), setGraph(id), startGame(), startRound(),
//   doMovementOnlyRound(), doP1MoveOnly(next), doP2MoveOnly(next),
//   doP3MoveOnly(next) — sub-jogadas de só-movimento reutilizáveis, tanto
//   pela rodada só-de-movimento completa quanto por doP2Turn/doP3Turn
//   quando a fila do algoritmo esvazia no meio da rodada —,
//   expandTurnNode(node, afterExpand), doP1Turn(),
//   moveAndLog(idx,node,msg,type), onNodeClick(id), doP2Turn(), doP3Turn(),
//   doEndOfAllTurns(), checkWin(idx,node), movePlayer(idx,node),
//   moveToken(idx,nodeId), updateTurnIndicator(active)
// USADO POR: 07-teleport.js (checkWin, doP2Turn, afterP1MoveCallback),
//   11-ui-layout.js (botões de UI chamam setAlgo/setGraph/startGame)
// ═══════════════════════════════════════════════════════════════════════════
// ─── GAME FLOW ────────────────────────────────────────────────────────────────
import { state, safeTimeout } from "./02-state.js";
import { loadGraph } from "./03-graph-setup.js";
import { buildGraph, getPos, getNodeRadius } from "./04-render.js";
import {
  consumeNext,
  expandNode,
  peekNext,
  updateProgress,
} from "./05-algorithm.js";
import {
  exploredAdjacent,
  bestExploredAdjacent,
  worstExploredAdjacent,
  getGuessOptions,
} from "./06-movement.js";
import {
  markEdge,
  setNodeClass as setNodeClassVisual,
  highlightNode,
  colorNode,
  flashNode,
  updateStructureDisplay,
  showFeedback,
  addLog,
  setStatus,
} from "./09-visuals.js";
import { endGame, resetGame } from "./10-lifecycle.js";
import {
  tryP3AutoTeleport,
  checkTeleportUnlock,
  updateTeleportButtons,
} from "./07-teleport.js";

export function setAlgo(a) {
  state.algo = a;
  document.getElementById("bfsBtn").classList.toggle("active", a === "BFS");
  document.getElementById("dfsBtn").classList.toggle("active", a === "DFS");
  document.getElementById("structureLabel").textContent =
    a === "BFS" ? "FILA (BFS)" : "PILHA (DFS)";
  if (!state.running) resetGame();
}

export function setGraph(id) {
  state.graphId = id;
  [1, 2, 3].forEach((n) =>
    document.getElementById(`g${n}Btn`).classList.toggle("active", n === id),
  );
  if (!state.running) resetGame();
}

export function startGame() {
  if (state.running) return;
  state.gameEpoch++; // nova sessão — invalida safeTimeout() pendentes de uma partida anterior
  state.running = true;
  document.getElementById("startBtn").disabled = true;

  state.exploredNodes = new Set();
  state.visitedNodes = new Set([state.START]);
  state.exploredNodes.add(state.START);

  if (state.algo === "BFS") {
    state.bfsQueue = [];
    state.layerTracker = { [state.START]: 0 };
    state.ADJACENCY[state.START].sort().forEach((n) => {
      if (!state.visitedNodes.has(n)) {
        state.visitedNodes.add(n);
        state.bfsQueue.push(n);
        state.layerTracker[n] = 1;
        markEdge(state.START, n);
      }
    });
  } else {
    state.dfsStack = [];
    state.ADJACENCY[state.START]
      .sort()
      .reverse()
      .forEach((n) => {
        state.visitedNodes.add(n);
        state.dfsStack.push(n);
        markEdge(state.START, n);
      });
  }

  colorNode(state.START);
  highlightNode(state.START);
  updateProgress();
  addLog(
    `Algoritmo <span>${state.algo}</span> | Grafo <span>${state.graphId}</span>`,
    "info",
  );
  updateStructureDisplay();
  startRound();
}

// Turno de cada jogador: espiar próximo nó do algoritmo → jogador chuta → expandir nó → jogador se move → próximo jogador
export function startRound() {
  // Se o algoritmo estiver esgotado, passa para modo somente-movimento
  if (!peekNext()) {
    doMovementOnlyRound();
    return;
  }
  doP1Turn();
}

// Sub-jogadas de "só movimento" (sem palpite), reutilizáveis. Usadas tanto
// pela rodada só-de-movimento completa (doMovementOnlyRound, quando o
// algoritmo já esgotou ANTES de a rodada começar) quanto por doP2Turn/
// doP3Turn quando a fila esvazia NO MEIO da rodada — nesse caso só quem
// ainda não jogou entra em modo movimento, sem reiniciar do P1.
export function doP1MoveOnly(next) {
  if (state.playerFinished[0]) {
    next();
    return;
  }
  updateTurnIndicator(0);
  const adj = exploredAdjacent(state.playerPos[0]).filter(
    (n) => n !== state.playerPos[0],
  );
  state.clickableNodes = [state.playerPos[0], ...adj];
  setNodeClassVisual(state.clickableNodes, "move-clickable", true);
  state.waitingInput = true;
  state.phase = "move";
  updateTeleportButtons();
  setStatus("MOVA P1 — ESCOLHA UM NÓ ADJACENTE EXPLORADO (OU FIQUE).");
  document.getElementById("statusDot").className = "status-dot moving";
  state.afterP1MoveCallback = next;
}

export function doP2MoveOnly(next) {
  if (state.playerFinished[1]) {
    next();
    return;
  }
  updateTurnIndicator(1);
  safeTimeout(() => {
    const best = bestExploredAdjacent(state.playerPos[1]);
    if (
      best !== state.playerPos[1] &&
      state.DIST[best] < state.DIST[state.playerPos[1]]
    ) {
      movePlayer(1, best);
      addLog(`P2 moveu para <span>${best}</span>`);
      if (checkWin(1, best)) return;
    } else {
      addLog(`P2 ficou em <span>${state.playerPos[1]}</span> (sem nó melhor)`);
    }
    safeTimeout(next, 400);
  }, 500);
}

export function doP3MoveOnly(next) {
  if (state.playerFinished[2]) {
    next();
    return;
  }
  const teleportTarget = tryP3AutoTeleport();
  if (teleportTarget !== null) {
    updateTurnIndicator(2);
    setStatus("P3 TELETRANSPORTOU...");
    document.getElementById("statusDot").className = "status-dot running";
    safeTimeout(() => {
      if (checkWin(2, state.playerPos[2])) return;
      if (checkWin(teleportTarget, state.playerPos[teleportTarget])) return;
      safeTimeout(next, 400);
    }, 900);
    return;
  }
  updateTurnIndicator(2);
  safeTimeout(() => {
    const best = bestExploredAdjacent(state.playerPos[2]);
    if (
      best !== state.playerPos[2] &&
      state.DIST[best] < state.DIST[state.playerPos[2]]
    ) {
      movePlayer(2, best);
      addLog(`P3 moveu para <span>${best}</span>`);
      if (checkWin(2, best)) return;
    } else {
      addLog(`P3 ficou em <span>${state.playerPos[2]}</span> (sem nó melhor)`);
    }
    safeTimeout(next, 400);
  }, 500);
}

export function doMovementOnlyRound() {
  const allDone = [0, 1, 2].every(
    (i) => state.playerFinished[i] || state.playerPos[i] === state.DEST,
  );
  if (allDone) {
    endGame(null);
    return;
  }
  updateTurnIndicator(-1);
  setStatus("ALGORITMO COMPLETO — PLAYERS SE MOVEM AO DESTINO");
  document.getElementById("statusDot").className = "status-dot running";

  doP1MoveOnly(() =>
    doP2MoveOnly(() =>
      doP3MoveOnly(() => {
        updateTurnIndicator(-1);
        safeTimeout(() => startRound(), 400);
      }),
    ),
  );
}

// ── Shared: expand the node for this turn, then call the move callback ──
export function expandTurnNode(node, afterExpand) {
  consumeNext();
  state.step++;
  highlightNode(node);
  colorNode(node);
  expandNode(node);
  checkTeleportUnlock(node);
  updateStructureDisplay();
  safeTimeout(afterExpand, 400);
}

// ── P1 ──
export function doP1Turn() {
  if (state.playerFinished[0]) {
    doP2Turn();
    return;
  }
  const myNode = peekNext();
  if (!myNode) {
    doMovementOnlyRound();
    return;
  }
  updateTurnIndicator(0);
  state.correctNext = myNode;
  state.clickableNodes = getGuessOptions(state.correctNext);
  setNodeClassVisual(state.clickableNodes, "clickable", true);
  state.waitingInput = true;
  state.phase = "guess";
  updateTeleportButtons();
  setStatus("SUA VEZ (P1) — QUAL NÓ O ALGORITMO VISITARÁ A SEGUIR?");
  document.getElementById("statusDot").className = "status-dot waiting";
  document.getElementById("hintText").textContent =
    state.graphId !== 1
      ? ""
      : state.algo === "BFS"
        ? "↑ O primeiro da fila é o próximo"
        : "↑ O topo da pilha é o próximo";
  updateStructureDisplay();
}

// moveAndLog: move um jogador e registra no log após a animação do token (~500ms)
export function moveAndLog(idx, node, msg, type = "") {
  movePlayer(idx, node);
  safeTimeout(() => addLog(msg, type), 520);
}

export function onNodeClick(id) {
  if (!state.waitingInput) return;

  if (state.phase === "guess") {
    if (!state.clickableNodes.includes(id)) return;
    state.waitingInput = false;
    setNodeClassVisual(state.clickableNodes, "clickable", false);
    document.getElementById("hintText").textContent = "";

    if (id === state.correctNext) {
      state.correctCount++;
      document.getElementById("correctCount").textContent = state.correctCount;
      showFeedback("✓ CORRETO!", "correct");
      flashNode(id, "correct-flash");
      safeTimeout(
        () => addLog(`✓ P1 acertou! <span>${id}</span>`, "correct"),
        750,
      );
      expandTurnNode(state.correctNext, () => {
        state.phase = "move";
        const adj = exploredAdjacent(state.playerPos[0]).filter(
          (n) => n !== state.playerPos[0],
        );
        state.clickableNodes = [state.playerPos[0], ...adj];
        setNodeClassVisual(state.clickableNodes, "move-clickable", true);
        state.waitingInput = true;
        updateTeleportButtons();
        setStatus("CORRETO! ESCOLHA UM NÓ ADJACENTE EXPLORADO (OU FIQUE).");
        document.getElementById("statusDot").className = "status-dot moving";
      });
    } else {
      state.wrongCount++;
      document.getElementById("wrongCount").textContent = state.wrongCount;
      showFeedback("✗ ERRADO!", "wrong");
      flashNode(id, "wrong-flash");
      safeTimeout(() => flashNode(state.correctNext, "correct-flash"), 320);
      safeTimeout(
        () =>
          addLog(
            `✗ P1 errou! Correto: <span>${state.correctNext}</span>`,
            "wrong",
          ),
        900,
      );
      expandTurnNode(state.correctNext, () => {
        state.phase = "idle";
        updateTeleportButtons();
        const worst = worstExploredAdjacent(state.playerPos[0]);
        if (worst !== state.playerPos[0]) {
          moveAndLog(
            0,
            worst,
            `P1 moveu (forçado) para <span>${worst}</span>`,
            "wrong",
          );
          safeTimeout(() => {
            if (checkWin(0, worst)) return;
            safeTimeout(() => doP2Turn(), 200);
          }, 530);
        } else {
          addLog(`P1 ficou parado`, "wrong");
          safeTimeout(() => doP2Turn(), 400);
        }
      });
    }
  } else if (state.phase === "move") {
    if (!state.clickableNodes.includes(id)) return;
    state.waitingInput = false;
    setNodeClassVisual(state.clickableNodes, "move-clickable", false);
    state.phase = "idle";
    updateTeleportButtons();
    if (id !== state.playerPos[0]) {
      moveAndLog(0, id, `P1 moveu para <span>${id}</span>`);
      safeTimeout(() => {
        if (checkWin(0, id)) return;
        const cb = state.afterP1MoveCallback;
        state.afterP1MoveCallback = null;
        if (cb) {
          safeTimeout(cb, 200);
        } else {
          safeTimeout(() => doP2Turn(), 200);
        }
      }, 530);
    } else {
      addLog(`P1 ficou em <span>${id}</span>`);
      const cb = state.afterP1MoveCallback;
      state.afterP1MoveCallback = null;
      if (cb) {
        safeTimeout(cb, 300);
      } else {
        safeTimeout(() => doP2Turn(), 300);
      }
    }
  }
}

// ── P2 (always correct → expand → best adjacent or stay) ──
export function doP2Turn() {
  if (state.playerFinished[1]) {
    doP3Turn();
    return;
  }
  const myNode = peekNext();
  if (!myNode) {
    doP2MoveOnly(() => doP3MoveOnly(() => doEndOfAllTurns()));
    return;
  }
  updateTurnIndicator(1);
  setStatus("VEZ DO P2...");
  document.getElementById("statusDot").className = "status-dot running";

  safeTimeout(() => {
    flashNode(myNode, "correct-flash");
    safeTimeout(
      () => addLog(`✓ P2 acertou! <span>${myNode}</span>`, "correct"),
      750,
    );
    expandTurnNode(myNode, () => {
      const best = bestExploredAdjacent(state.playerPos[1]);
      if (
        best !== state.playerPos[1] &&
        state.DIST[best] < state.DIST[state.playerPos[1]]
      ) {
        moveAndLog(1, best, `P2 moveu para <span>${best}</span>`);
        safeTimeout(() => {
          if (checkWin(1, best)) return;
          safeTimeout(() => doP3Turn(), 200);
        }, 530);
      } else {
        addLog(
          `P2 ficou em <span>${state.playerPos[1]}</span> (sem nó melhor)`,
        );
        safeTimeout(() => doP3Turn(), 400);
      }
    });
  }, 600);
}

// ── P3 (50% correct → expand → best or stay; 50% wrong → expand → worst) ──
export function doP3Turn() {
  if (state.playerFinished[2]) {
    doEndOfAllTurns();
    return;
  }
  const myNode = peekNext();
  if (!myNode) {
    doP3MoveOnly(() => doEndOfAllTurns());
    return;
  }
  updateTurnIndicator(2);
  setStatus("VEZ DO P3...");

  safeTimeout(() => {
    const p3Correct = Math.random() < 0.5;
    if (p3Correct) {
      flashNode(myNode, "correct-flash");
      safeTimeout(
        () => addLog(`✓ P3 acertou! <span>${myNode}</span>`, "correct"),
        750,
      );
      expandTurnNode(myNode, () => {
        const teleportTarget = tryP3AutoTeleport();
        if (teleportTarget !== null) {
          safeTimeout(() => {
            if (checkWin(2, state.playerPos[2])) return;
            if (checkWin(teleportTarget, state.playerPos[teleportTarget]))
              return;
            safeTimeout(() => doEndOfAllTurns(), 400);
          }, 900);
          return;
        }
        const best = bestExploredAdjacent(state.playerPos[2]);
        if (
          best !== state.playerPos[2] &&
          state.DIST[best] < state.DIST[state.playerPos[2]]
        ) {
          moveAndLog(2, best, `P3 moveu para <span>${best}</span>`);
          safeTimeout(() => {
            if (checkWin(2, best)) return;
            safeTimeout(() => doEndOfAllTurns(), 200);
          }, 530);
        } else {
          addLog(
            `P3 ficou em <span>${state.playerPos[2]}</span> (sem nó melhor)`,
          );
          safeTimeout(() => doEndOfAllTurns(), 400);
        }
      });
    } else {
      flashNode(myNode, "wrong-flash");
      safeTimeout(
        () => addLog(`✗ P3 errou! Correto era <span>${myNode}</span>`, "wrong"),
        750,
      );
      expandTurnNode(myNode, () => {
        const worst = worstExploredAdjacent(state.playerPos[2]);
        if (worst !== state.playerPos[2]) {
          moveAndLog(
            2,
            worst,
            `P3 moveu (forçado) para <span>${worst}</span>`,
            "wrong",
          );
          safeTimeout(() => {
            if (checkWin(2, worst)) return;
            safeTimeout(() => doEndOfAllTurns(), 200);
          }, 530);
        } else {
          addLog(`P3 ficou parado`, "wrong");
          safeTimeout(() => doEndOfAllTurns(), 400);
        }
      });
    }
  }, 600);
}

// ── Depois que os 3 jogadores tiveram sua vez ──
export function doEndOfAllTurns() {
  updateTurnIndicator(-1);
  setStatus("PRÓXIMO TURNO...");
  document.getElementById("statusDot").className = "status-dot";
  safeTimeout(() => startRound(), 700);
}

export function checkWin(idx, node) {
  if (node === state.DEST && state.destRevealed) {
    state.playerFinished[idx] = true;
    safeTimeout(() => endGame(idx), 500);
    return true;
  }
  return false;
}

export function movePlayer(idx, node) {
  state.playerPos[idx] = node;
  moveToken(idx, node);
  document.getElementById(`pos${idx}`).textContent = node;
}

export function moveToken(idx, nodeId) {
  const p = getPos(nodeId);
  const token = document.getElementById(`player-${idx}`);
  if (!token) return;
  const r = getNodeRadius();
  token.setAttribute("cx", p.x + (idx - 1) * 14);
  token.setAttribute("cy", p.y - (r + 10));
}

export function updateTurnIndicator(active) {
  [0, 1, 2].forEach((i) => {
    document
      .getElementById(`turn-row-${i}`)
      .classList.toggle("active-turn", i === active);
    document.getElementById(`arrow${i}`).textContent = i === active ? "◀" : "";
  });
}

window.setAlgo = setAlgo;
window.setGraph = setGraph;
window.startGame = startGame;

// ═══════════════════════════════════════════════════════════════════════════
