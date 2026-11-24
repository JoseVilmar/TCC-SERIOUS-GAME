// ARQUIVO: 07-teleport.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: As duas mecânicas de teleporte — o desbloqueio e uso
//   manual do teleporte de P1, e o teleporte automático de P3, disparado
//   depois que P3 acerta o palpite (ou logo no início da vez dele, na fase
//   só-de-movimento, onde não há palpite) quando a exploração atinge 90%.
// DEPENDE DE: 02-state.js (teleportUsed/teleportReady/p3TeleportUsed/phase/
//   waitingInput/playerPos/playerFinished), 04-render.js (moveToken).
// ATENÇÃO (dependência "circular"): tryP3AutoTeleport() e useTeleport()
//   chamam checkWin() e doP2Turn(), que só existem em 08-turns.js
//   (carregado DEPOIS deste arquivo na ordem sugerida). Seguro pelo mesmo
//   motivo do manifesto no topo do arquivo — nada aqui roda no carregamento
//   da página, só dentro de jogadas reais.
// EXPÕE: tryP3AutoTeleport(), checkTeleportUnlock(node), isP1MoveWindow(),
//   updateTeleportButtons(), useTeleport(targetIdx)
// USADO POR: 08-turns.js (doP3Turn chama tryP3AutoTeleport só depois de P3
//   acertar o palpite, substituindo o passo de movimento; doP3MoveOnly
//   chama logo no início da sua vez, já que não há pergunta na fase
//   só-de-movimento; expandTurnNode chama checkTeleportUnlock; a fase de
//   movimento de P1 chama updateTeleportButtons/isP1MoveWindow), botões de UI no HTML
//   chamam useTeleport diretamente via onclick.
// ═══════════════════════════════════════════════════════════════════════════
// ─── TELEPORT ────────────────────────────────────────────────────────────────
import { state, P3_TELEPORT_THRESHOLD, safeTimeout } from "./02-state.js";
import { explorationPct } from "./05-algorithm.js";
import { checkWin, doP2Turn, moveToken } from "./08-turns.js";
import { addLog, showFeedback } from "./09-visuals.js";
import { setNodeClass } from "./09-visuals.js";

// Teleporte automático do P3: dispara uma única vez por partida. Só é
// checado DEPOIS que P3 acerta o palpite (mesma regra do teleporte manual
// de P1: só disponível após acertar o próximo nó) — a pergunta sempre
// acontece primeiro, sem exceção. Quando dispara, substitui só o passo de
// movimento daquele turno (não a pergunta, que já rolou). Na rodada
// só-de-movimento (doP3MoveOnly), como não há pergunta nenhuma, a checagem
// é logo no início da vez de P3, valendo por si só (mesma regra do manual
// de P1: sem nó a adivinhar, basta ser o turno dele). Nunca dispara durante
// a janela de movimento do P1 (P1 já jogou antes de P3 nessa rodada). Troca
// de lugar com P1 ou P2 (sorteado). Retorna o índice do alvo (0=P1, 1=P2),
// ou null se não disparou.
export function tryP3AutoTeleport() {
  if (state.p3TeleportUsed || state.playerFinished[2]) return null;
  if (explorationPct() < P3_TELEPORT_THRESHOLD) return null;
  state.p3TeleportUsed = true;
  const targetIdx = Math.random() < 0.5 ? 0 : 1;
  const targetPos = state.playerPos[targetIdx];
  const p3pos = state.playerPos[2];
  state.playerPos[targetIdx] = p3pos;
  state.playerPos[2] = targetPos;
  moveToken(targetIdx, state.playerPos[targetIdx]);
  moveToken(2, state.playerPos[2]);
  document.getElementById(`pos${targetIdx}`).textContent =
    state.playerPos[targetIdx];
  document.getElementById("pos2").textContent = state.playerPos[2];
  const label = targetIdx === 0 ? "P1" : "P2";
  showFeedback("⚡ P3 TELETRANSPORTOU!", "warn");
  addLog(`⚡ P3 trocou de lugar com ${label} automaticamente!`, "warn");
  return targetIdx;
}

export function checkTeleportUnlock(node) {
  if (state.teleportUsed) return;
  let unlock = false;
  if (state.algo === "BFS") {
    const cur = state.layerTracker[node] ?? 0;
    const next = state.bfsQueue[0];
    if (!next || (state.layerTracker[next] ?? 0) > cur) unlock = true;
  } else {
    if (state.step % 3 === 0) unlock = true;
  }
  if (unlock && !state.teleportReady) {
    state.teleportReady = true;
    addLog("⚡ Teletransporte disponível!", "info");
  }
  updateTeleportButtons();
}

// Habilita os botões de teletransporte apenas quando: já foi desbloqueado, ainda não
// foi usado, e é exatamente a janela em que P1 está escolhendo para onde mover
// (fase 'move' + aguardando clique) — seja logo após um acerto, seja na rodada
// só-de-movimento (sem nós restantes a expandir).
export function isP1MoveWindow() {
  return state.phase === "move" && state.waitingInput;
}

export function updateTeleportButtons() {
  const btn2 = document.getElementById("teleBtn2");
  const btn3 = document.getElementById("teleBtn3");
  const status = document.getElementById("teleStatus");
  if (state.teleportUsed) {
    btn2.disabled = true;
    btn3.disabled = true;
    status.textContent = "Usado";
    status.style.color = "var(--muted)";
    return;
  }
  if (!state.teleportReady) {
    btn2.disabled = true;
    btn3.disabled = true;
    status.textContent = "Bloqueado";
    status.style.color = "var(--muted)";
    return;
  }
  if (isP1MoveWindow()) {
    btn2.disabled = false;
    btn3.disabled = false;
    status.textContent = "⚡ Disponível!";
    status.style.color = "#f5c800";
  } else {
    btn2.disabled = true;
    btn3.disabled = true;
    status.textContent = "Desbloqueado — aguarde sua vez";
    status.style.color = "var(--muted)";
  }
}

export function useTeleport(targetIdx) {
  if (state.teleportUsed || !state.teleportReady || !isP1MoveWindow()) return;
  state.teleportUsed = true;
  state.teleportReady = false;

  state.waitingInput = false;
  setNodeClass(state.clickableNodes, "move-clickable", false);
  state.phase = "idle";
  updateTeleportButtons();

  const tmp = state.playerPos[0];
  state.playerPos[0] = state.playerPos[targetIdx];
  state.playerPos[targetIdx] = tmp;
  moveToken(0, state.playerPos[0]);
  moveToken(targetIdx, state.playerPos[targetIdx]);
  document.getElementById("pos0").textContent = state.playerPos[0];
  document.getElementById(`pos${targetIdx}`).textContent =
    state.playerPos[targetIdx];

  showFeedback("⚡ Teletransporte!", "info");
  addLog(
    `⚡ P1 trocou com <span>${["P1", "P2", "P3"][targetIdx]}</span>`,
    "info",
  );

  // O teleporte É o movimento do turno — encerra a vez do P1 (sem chance de mover de novo).
  safeTimeout(() => {
    if (checkWin(0, state.playerPos[0])) return;
    if (checkWin(targetIdx, state.playerPos[targetIdx])) return;
    const cb = state.afterP1MoveCallback;
    state.afterP1MoveCallback = null;
    if (cb) {
      safeTimeout(cb, 200);
    } else {
      safeTimeout(() => doP2Turn(), 200);
    }
  }, 530);
}

window.useTeleport = useTeleport;

// ═══════════════════════════════════════════════════════════════════════════
