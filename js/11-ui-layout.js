// ARQUIVO: 11-ui-layout.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Coisas de interface que não são "jogo" — troca de aba
//   no layout mobile, tema claro/escuro (com persistência em localStorage),
//   e o bootstrap que roda quando a página termina de carregar (carrega o
//   grafo inicial e desenha o grafo pela primeira vez).
// DEPENDE DE: 03-graph-setup.js (loadGraph), 04-render.js (buildGraph),
//   02-state.js (running, graphId).
// ATENÇÃO: o listener de 'load' no final deste arquivo é o que efetivamente
//   "liga" o jogo (chama loadGraph + buildGraph pela primeira vez) — por
//   isso este arquivo precisa vir DEPOIS de 03-graph-setup.js e
//   04-render.js. Ele NÃO é o último arquivo da lista, porém: 12-tutorial.js
//   depende de mobTab() (definida aqui) e carrega DEPOIS deste, com seu
//   próprio listener de 'load' separado (mostra o tutorial na primeira
//   visita). Ambos os listeners de 'load' disparam de forma independente,
//   sem depender de ordem entre si.
// EXPÕE: mobTab(tab), initMobileLayout(), toggleTheme()
// USADO POR: botões de UI no HTML (onclick="mobTab(...)",
//   onclick="toggleTheme()"); o listener de 'load' se auto-executa.
// ═══════════════════════════════════════════════════════════════════════════
// ─── INTERFACE / LAYOUT ──────────────────────────────────────────────────────
import { loadGraph } from "./03-graph-setup.js";
import { buildGraph } from "./04-render.js";
import { state } from "./02-state.js";

export function mobTab(tab) {
  const isMobile = window.innerWidth <= 600;
  if (!isMobile) return;
  const left = document.querySelector(".panel-left");
  const right = document.querySelector(".panel-right");
  const tabs = document.querySelectorAll(".mob-tab");
  left.classList.remove("mob-active");
  right.classList.remove("mob-active");
  tabs.forEach((t) => t.classList.remove("active"));
  if (tab === "left") {
    left.classList.add("mob-active");
    tabs[0].classList.add("active");
  }
  if (tab === "right") {
    right.classList.add("mob-active");
    tabs[2].classList.add("active");
  }
  if (tab === "graph") {
    tabs[1].classList.add("active");
  }
}

// Em mobile, por padrão mostra o painel esquerdo ao iniciar
export function initMobileLayout() {
  if (window.innerWidth <= 600) {
    document.querySelector(".panel-left").classList.add("mob-active");
  }
}

window.addEventListener("load", () => {
  loadGraph(state.graphId);
  initMobileLayout();
  buildGraph();
  window.addEventListener("resize", () => {
    initMobileLayout();
    if (!state.running) buildGraph();
  });
});

export function toggleTheme() {
  document.body.classList.toggle("dark-mode");

  const btn = document.getElementById("themeToggle");

  if (document.body.classList.contains("dark-mode")) {
    btn.innerHTML = "☀️ Claro";
    localStorage.setItem("theme", "dark");
  } else {
    btn.innerHTML = "🌙 Noturno";
    localStorage.setItem("theme", "light");
  }
}

window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");

    const btn = document.getElementById("themeToggle");
    if (btn) btn.innerHTML = "☀️ Claro";
  }
});

window.mobTab = mobTab;
window.toggleTheme = toggleTheme;

// ═══════════════════════════════════════════════════════════════════════════
