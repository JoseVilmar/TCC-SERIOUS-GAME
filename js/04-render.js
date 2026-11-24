// ARQUIVO: 04-render.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Desenhar o grafo em SVG (nós, arestas, rótulos) e
//   funções auxiliares de posicionamento/raio usadas pelo resto do jogo
//   para animar tokens e badges sobre o grafo já desenhado.
// DEPENDE DE: 02-state.js (NODES/EDGES/graphId/START/DEST).
// ATENÇÃO: `const svg = document.getElementById('graph')` roda IMEDIATAMENTE
//   ao carregar este arquivo (fora de função) — o elemento <svg id="graph">
//   já precisa existir no HTML nesse momento. Por isso este script (e todos
//   que vierem depois) deve ficar no fim do <body>, depois do markup do
//   grafo, nunca no <head>.
// EXPÕE: svg, getPos(id), buildGraph(), addBadge(id,text,dy,col),
//   getNodeRadius()
// USADO POR: praticamente todos os módulos de jogo (08-turns, 09-visuals,
//   05-algorithm) para desenhar/animar sobre o grafo.
// ═══════════════════════════════════════════════════════════════════════════
// ─── SVG ─────────────────────────────────────────────────────────────────────
import { state } from "./02-state.js";
import { onNodeClick } from "./08-turns.js";

export const svg = document.getElementById("graph");
let W, H;
export function getPos(id) {
  return { x: state.NODES[id].x * W, y: state.NODES[id].y * H };
}

export function buildGraph() {
  W = svg.clientWidth;
  H = svg.clientHeight;
  svg.innerHTML = "";
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `<filter id="glow"><feGaussianBlur stdDeviation="3" result="cb"/>
    <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  svg.appendChild(defs);

  // arestas
  const eg = document.createElementNS("http://www.w3.org/2000/svg", "g");
  state.EDGES.forEach(([a, b]) => {
    const pa = getPos(a),
      pb = getPos(b);
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", pa.x);
    l.setAttribute("y1", pa.y);
    l.setAttribute("x2", pb.x);
    l.setAttribute("y2", pb.y);
    l.setAttribute("class", "edge");
    l.id = `edge-${[a, b].sort().join("-")}`;
    eg.appendChild(l);
  });
  svg.appendChild(eg);

  // nós
  const r = getNodeRadius();
  const fs = state.graphId === 1 ? 11 : state.graphId === 2 ? 10 : 9;
  const ng = document.createElementNS("http://www.w3.org/2000/svg", "g");
  Object.keys(state.NODES).forEach((id) => {
    const p = getPos(id);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = `node-${id}`;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", r);
    const isDest = id === state.DEST;
    c.setAttribute("class", isDest ? "node-circle hidden-dest" : "node-circle");
    c.id = `circle-${id}`;
    c.addEventListener("click", () => onNodeClick(id));
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", p.x);
    lbl.setAttribute("y", p.y);
    lbl.setAttribute("class", isDest ? "node-label hidden" : "node-label");
    lbl.setAttribute("font-size", fs);
    lbl.id = `label-${id}`;
    lbl.textContent = isDest ? "?" : id;
    g.appendChild(c);
    g.appendChild(lbl);
    ng.appendChild(g);
  });
  svg.appendChild(ng);

  // tokens dos jogadores
  const pg = document.createElementNS("http://www.w3.org/2000/svg", "g");
  [0, 1, 2].forEach((i) => {
    const p = getPos(state.START);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x + (i - 1) * 14);
    c.setAttribute("cy", p.y - (r + 10));
    c.setAttribute("r", state.graphId === 1 ? 7 : 6);
    c.setAttribute("fill", ["#00f5a0", "#f5004a", "#f5c800"][i]);
    c.setAttribute("class", "player-token");
    c.setAttribute("filter", "url(#glow)");
    c.id = `player-${i}`;
    pg.appendChild(c);
  });
  svg.appendChild(pg);

  addBadge(state.START, "▶ INÍCIO", r + 12);
  // badge do destino oculto até ser revelado
}

export function addBadge(id, text, dy, col = "#444466") {
  const p = getPos(id);
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", p.x);
  t.setAttribute("y", p.y + dy);
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("fill", col);
  t.setAttribute("font-family", "Space Mono, monospace");
  t.setAttribute("font-size", "9");
  t.setAttribute("letter-spacing", "2");
  t.textContent = text;
  t.id = `badge-${id}`;
  svg.appendChild(t);
}

export function getNodeRadius() {
  return state.graphId === 1 ? 20 : state.graphId === 2 ? 17 : 14;
}

// ═══════════════════════════════════════════════════════════════════════════
