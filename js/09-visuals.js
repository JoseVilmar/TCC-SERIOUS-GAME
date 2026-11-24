// ARQUIVO: 09-visuals.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Efeitos visuais e de feedback que não são "lógica de
//   jogo" — classes CSS nos nós, destaque/coloração/flash, desenho de
//   arestas percorridas, painel de fila/pilha, toasts de feedback, log de
//   eventos e texto de status.
// DEPENDE DE: 02-state.js (logs, bfsQueue, dfsStack, algo, graphId, correctNext).
// EXPÕE: setNodeClass(nodes,cls,on), highlightNode(id), colorNode(id),
//   flashNode(id,cls), markEdge(a,b), updateStructureDisplay(),
//   showFeedback(msg,type), addLog(msg,type), setStatus(msg)
// USADO POR: 05-algorithm.js (markEdge/highlightNode em expandNode),
//   08-turns.js (praticamente todo turno loga/atualiza status),
//   07-teleport.js (addLog/showFeedback), 10-lifecycle.js
// ═══════════════════════════════════════════════════════════════════════════
// ─── VISUAIS ─────────────────────────────────────────────────────────────────
import { state } from "./02-state.js";

export function setNodeClass(nodes, cls, on) {
  nodes.forEach((id) => {
    const c = document.getElementById(`circle-${id}`);
    if (!c) return;
    if (on) c.classList.add(cls);
    else c.classList.remove(cls);
  });
}
export function highlightNode(id) {
  document
    .querySelectorAll(".node-circle.current")
    .forEach((el) => el.classList.remove("current"));
  const c = document.getElementById(`circle-${id}`);
  if (c) c.classList.add("current");
}
export function colorNode(id) {
  const c = document.getElementById(`circle-${id}`);
  if (c) {
    c.style.fill = "var(--accent)";
    c.style.stroke = "#6644ff";
  }
  const l = document.getElementById(`label-${id}`);
  // Um nó expandido pode ser o destino antes do limiar de revelação.
  // A expansão não deve expor seu identificador antecipadamente.
  if (l && (id !== state.DEST || state.destRevealed)) {
    if (l.textContent === "?") l.textContent = id;
  }
}
export function flashNode(id, cls) {
  const c = document.getElementById(`circle-${id}`);
  if (!c) return;
  c.classList.add(cls);
  setTimeout(() => c.classList.remove(cls), 750);
}
export function markEdge(a, b) {
  const el = document.getElementById(`edge-${[a, b].sort().join("-")}`);
  if (el) el.classList.add("explored");
}
export function updateStructureDisplay() {
  const label = document.getElementById("structureLabel");
  const container = document.getElementById("queueDisplay");
  container.innerHTML = "";
  const baseLabel = state.algo === "BFS" ? "FILA (BFS)" : "PILHA (DFS)";

  if (state.graphId !== 1) {
    label.textContent = `${baseLabel} 🔒`;
    const div = document.createElement("div");
    div.className = "queue-item";
    div.style.color = "#333355";
    div.textContent = "— oculta neste grafo —";
    container.appendChild(div);
    return;
  }
  label.textContent = baseLabel;

  const items =
    state.algo === "BFS" ? [...state.bfsQueue] : [...state.dfsStack].reverse();
  items.slice(0, 8).forEach((n, i) => {
    const div = document.createElement("div");
    div.className = "queue-item" + (i === 0 ? " next" : "");
    div.textContent = `${i === 0 ? "▸ " : "  "}${n}`;
    container.appendChild(div);
  });
  if (!items.length) {
    const div = document.createElement("div");
    div.className = "queue-item";
    div.style.color = "#333355";
    div.textContent = "— vazia —";
    container.appendChild(div);
  }
}
export function showFeedback(msg, type) {
  const el = document.getElementById("feedbackToast");
  el.textContent = msg;
  el.className = `feedback-toast ${type} show`;
  setTimeout(() => el.classList.remove("show"), 1400);
}
export function addLog(msg, type = "") {
  state.logs.unshift({ msg, type });
  const container = document.getElementById("logList");
  container.innerHTML = "";
  state.logs.slice(0, 30).forEach(({ msg: m, type: t }) => {
    const div = document.createElement("div");
    div.className = `log-item ${t}`;
    div.innerHTML = m;
    container.appendChild(div);
  });
}
export function setStatus(msg) {
  document.getElementById("statusText").textContent = msg.toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
