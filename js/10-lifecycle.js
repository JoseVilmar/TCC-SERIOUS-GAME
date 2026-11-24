// ARQUIVO: 10-lifecycle.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Início e fim do ciclo de vida de uma partida — encerrar
//   o jogo mostrando o vencedor (ou empate), e resetar todo o estado para
//   uma nova partida.
// DEPENDE DE: 02-state.js (reseta praticamente todas as variáveis),
//   03-graph-setup.js (loadGraph, dentro de resetGame), 04-render.js
//   (buildGraph), 09-visuals.js (setStatus/addLog/updateStructureDisplay),
//   07-teleport.js (reseta flags de teleporte).
// EXPÕE: endGame(winnerIdx), resetGame()
// USADO POR: 08-turns.js (checkWin chama endGame), 07-teleport.js
//   (tryP3AutoTeleport/useTeleport chamam checkWin, que pode chamar
//   endGame), 11-ui-layout.js (botão "Reset" chama resetGame)
// ═══════════════════════════════════════════════════════════════════════════
// ─── FIM / RESET ─────────────────────────────────────────────────────────────
import { state } from "./02-state.js";
import { loadGraph } from "./03-graph-setup.js";
import { buildGraph } from "./04-render.js";
import {
  setNodeClass,
  updateStructureDisplay,
  setStatus,
} from "./09-visuals.js";
import { updateTurnIndicator } from "./08-turns.js";

export function endGame(winnerIdx) {
  state.running = false;
  state.waitingInput = false;
  state.phase = "idle";
  state.afterP1MoveCallback = null;
  setNodeClass(Object.keys(state.NODES), "clickable", false);
  setNodeClass(Object.keys(state.NODES), "move-clickable", false);
  updateTurnIndicator(-1);
  document.getElementById("statusDot").className = "status-dot";

  if (winnerIdx === null) {
    setStatus("Exploração completa");
    return;
  }
  const colors = ["#00f5a0", "#f5004a", "#f5c800"];
  const names = ["P1", "P2", "P3"];
  const color = colors[winnerIdx];
  const name = names[winnerIdx];
  const total = state.correctCount + state.wrongCount;
  const pct = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
  document.getElementById("winnerTitle").textContent = `${name} VENCEU!`;
  document.getElementById("winnerTitle").style.color = color;
  document.getElementById("winnerSub").textContent =
    `CHEGOU AO NÓ DESTINO (${state.DEST}) PRIMEIRO`;
  document.getElementById("winnerStats").textContent =
    `ACERTOS (P1): ${state.correctCount}  |  ERROS (P1): ${state.wrongCount}  |  PRECISÃO: ${pct}%\nALGORITMO: ${state.algo}  |  GRAFO: ${state.graphId}`;
  document.getElementById("winnerOverlay").classList.add("show");
  setStatus(`${name} VENCEU!`);
}

export function resetGame() {
  state.gameEpoch++; // invalida qualquer safeTimeout() de uma partida em andamento
  state.running = false;
  state.waitingInput = false;
  state.phase = "idle";
  state.step = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.exploredNodes = new Set();
  state.visitedNodes = new Set();
  state.bfsQueue = [];
  state.dfsStack = [];
  state.layerTracker = {};
  state.teleportUsed = false;
  state.teleportReady = false;
  state.destRevealed = false;
  state.p3TeleportUsed = false;
  state.logs = [];
  state.correctNext = null;
  state.clickableNodes = [];
  state.roundCorrectNode = null;
  state.afterP1MoveCallback = null; // evita reutilizar um turno anterior depois do reset

  loadGraph(state.graphId);

  document.getElementById("startBtn").disabled = false;
  document.getElementById("winnerOverlay").classList.remove("show");
  document.getElementById("correctCount").textContent = "0";
  document.getElementById("wrongCount").textContent = "0";
  document.getElementById("teleBtn2").disabled = true;
  document.getElementById("teleBtn3").disabled = true;
  document.getElementById("teleStatus").textContent = "Bloqueado";
  document.getElementById("teleStatus").style.color = "";
  document.getElementById("logList").innerHTML = "";
  updateStructureDisplay();
  document.getElementById("hintText").textContent = "";
  document.getElementById("feedbackToast").className = "feedback-toast";
  document.getElementById("statusDot").className = "status-dot";
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("progressLabel").textContent =
    "0% explorado — destino oculto";
  updateTurnIndicator(-1);
  setStatus("ESCOLHA O ALGORITMO E O GRAFO, DEPOIS INICIE");
  buildGraph();
}

window.resetGame = resetGame;

// ═══════════════════════════════════════════════════════════════════════════
