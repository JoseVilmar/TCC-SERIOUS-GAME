// ARQUIVO: 12-tutorial.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Tour guiado de primeiros passos — escurece a tela e
//   destaca, um de cada vez, os elementos principais da interface (seletor
//   de algoritmo, seletor de grafo, área do grafo, painel de jogadores,
//   botão iniciar), com um texto curto explicando cada um. Aparece sozinho
//   na primeira visita (guardado em localStorage, mesmo mecanismo já usado
//   pelo tema) e pode ser reaberto a qualquer momento pelo botão "❓" no
//   header.
// DEPENDE DE: 11-ui-layout.js (mobTab — garante que o painel certo esteja
//   visível no celular antes de destacar algo dentro dele).
// EXPÕE: TUTORIAL_STEPS (const), tutorialStepIndex (let),
//   positionTutorialStep(i), showTutorialStep(i), startTutorial(),
//   nextTutorialStep(), skipTutorial(), endTutorial()
// USADO POR: botão "❓" no header (onclick="startTutorial()"); o listener de
//   'load' logo abaixo mostra sozinho na primeira visita; positionTutorialStep
//   também é chamada pelo listener de 'resize' logo acima dele.
// ═══════════════════════════════════════════════════════════════════════════
// ─── TUTORIAL ─────────────────────────────────────────────────────────────
import { mobTab } from "./11-ui-layout.js";

export const TUTORIAL_STEPS = [
  {
    selector: "#algoSelectorGroup",
    title: "Escolha o algoritmo",
    text: "BFS explora o grafo em largura, usando uma fila. DFS explora em profundidade, usando uma pilha. A ordem que cada um visita os nós é diferente — é isso que você vai tentar prever a cada turno.",
  },
  {
    selector: "#graphSelectorGroup",
    title: "Escolha o grafo",
    text: "Grafo 1 é o mais simples, bom pra aprender a mecânica. Grafos 2 e 3 são maiores e mais desafiadores — inclusive escondem a fila/pilha, te forçando a raciocinar sozinho sobre o próximo passo do algoritmo.",
  },
  {
    selector: ".graph-area",
    title: "A cada turno, um palpite",
    text: "No seu turno, o jogo apresenta até 3 nós e pergunta qual deles o algoritmo vai visitar a seguir. Acerte pra escolher pra onde se mover; erre e você é empurrado pra longe do destino.",
    mobileTab: "graph",
  },
  {
    selector: "#playersSection",
    title: "Você não está sozinho",
    text: "Você é o P1 (verde). P2 e P3 são adversários controlados pelo jogo, competindo pra chegar primeiro ao destino, que começa oculto no grafo.",
    mobileTab: "left",
  },
  {
    selector: "#startBtn",
    title: "Pronto pra começar?",
    text: "Quando estiver tudo escolhido, aperte aqui pra iniciar a partida. Boa sorte!",
  },
];

export let tutorialStepIndex = 0;

export function positionTutorialStep(i) {
  const step = TUTORIAL_STEPS[i];
  const target = document.querySelector(step.selector);
  if (!target) {
    nextTutorialStep();
    return;
  }

  const rect = target.getBoundingClientRect();
  const pad = 8;
  const spot = document.getElementById("tutorialSpotlight");
  spot.style.left = rect.left - pad + "px";
  spot.style.top = rect.top - pad + "px";
  spot.style.width = rect.width + pad * 2 + "px";
  spot.style.height = rect.height + pad * 2 + "px";

  document.getElementById("tutorialStepCount").textContent =
    `${i + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById("tutorialTitle").textContent = step.title;
  document.getElementById("tutorialText").textContent = step.text;
  document.getElementById("tutorialNextBtn").textContent =
    i === TUTORIAL_STEPS.length - 1 ? "Entendi!" : "Próximo →";

  const tooltip = document.getElementById("tutorialTooltip");
  const margin = 16;
  const tooltipWidth = Math.min(300, window.innerWidth - margin * 2);
  tooltip.style.width = tooltipWidth + "px";

  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  left = Math.max(
    margin,
    Math.min(left, window.innerWidth - tooltipWidth - margin),
  );
  tooltip.style.left = left + "px";

  const gap = pad + 14;
  const tooltipHeight = tooltip.offsetHeight;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  let top;
  if (spaceBelow >= tooltipHeight + gap + margin) {
    top = rect.bottom + gap;
  } else if (spaceAbove >= tooltipHeight + gap + margin) {
    top = rect.top - gap - tooltipHeight;
  } else {
    top = window.innerHeight - tooltipHeight - margin;
  }
  top = Math.max(
    margin,
    Math.min(top, window.innerHeight - tooltipHeight - margin),
  );
  tooltip.style.top = top + "px";
}

export function showTutorialStep(i) {
  const step = TUTORIAL_STEPS[i];
  const isMobile = window.innerWidth <= 600;
  if (isMobile && step.mobileTab) {
    mobTab(step.mobileTab);
    setTimeout(() => positionTutorialStep(i), 60);
  } else {
    positionTutorialStep(i);
  }
}

export function startTutorial() {
  tutorialStepIndex = 0;
  document.getElementById("tutorialOverlay").classList.add("show");
  showTutorialStep(0);
}

export function nextTutorialStep() {
  tutorialStepIndex++;
  if (tutorialStepIndex >= TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }
  showTutorialStep(tutorialStepIndex);
}

export function skipTutorial() {
  endTutorial();
}

export function endTutorial() {
  document.getElementById("tutorialOverlay").classList.remove("show");
  localStorage.setItem("tutorialSeen", "1");
}

window.addEventListener("resize", () => {
  const overlay = document.getElementById("tutorialOverlay");
  if (overlay && overlay.classList.contains("show"))
    positionTutorialStep(tutorialStepIndex);
});

window.addEventListener("load", () => {
  if (!localStorage.getItem("tutorialSeen")) {
    setTimeout(startTutorial, 500);
  }
});

window.startTutorial = startTutorial;
window.nextTutorialStep = nextTutorialStep;
window.skipTutorial = skipTutorial;

// ═══════════════════════════════════════════════════════════════════════════
