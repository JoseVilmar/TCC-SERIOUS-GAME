// Setup DOM mínimo para testes. Cria os elementos acessados pelos módulos
// para que imports (especialmente 04-render.js) e funções como updateProgress não lancem erros.
const doc = globalThis.document;

function el(tag, id) {
  const e = doc.createElement(tag);
  e.id = id;
  doc.body.appendChild(e);
  return e;
}

// Container SVG do grafo (lido no tempo de importação por 04-render.js)
const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("id", "graph");
doc.body.appendChild(svg);

// tokens de jogador usados por moveToken
for (let i = 0; i < 3; i++) {
  const c = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("id", `player-${i}`);
  svg.appendChild(c);
}

// Conjunto mínimo de elementos DOM usados por visuals / lifecycle / teleport
[
  "pos0",
  "pos1",
  "pos2",
  "progressFill",
  "progressLabel",
  "queueDisplay",
  "startBtn",
  "teleBtn2",
  "teleBtn3",
  "teleStatus",
  "feedbackToast",
  "logList",
  "statusDot",
  "statusText",
  "correctCount",
  "wrongCount",
  "hintText",
  "winnerOverlay",
  "structureLabel",
].forEach((id) => {
  el("div", id);
});

// elementos turn-row e setas usados por updateTurnIndicator
for (let i = 0; i < 3; i++) {
  const tr = el("div", `turn-row-${i}`);
  tr.className = "player-item";
  el("span", `arrow${i}`);
}
