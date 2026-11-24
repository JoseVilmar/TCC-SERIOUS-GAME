// ARQUIVO: 02-state.js
// ─────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADE: Todo o estado mutável de uma partida — grafo carregado,
//   posições dos jogadores, fila/pilha do algoritmo, contadores, flags de
//   teleporte, log — e as constantes de configuração do jogo. É o único
//   arquivo que declara essas variáveis com `let`/`const`; todos os outros
//   apenas leem/escrevem nelas. Também expõe safeTimeout(), o substituto de
//   setTimeout() que todo o resto do jogo usa para agendar continuações.
// DEPENDE DE: nada. Deve carregar ANTES de qualquer arquivo que use estas
//   variáveis (na prática, quase todos os outros).
// EXPÕE: algo, graphId, NODES, EDGES, ADJACENCY, START, DEST, DIST, running,
//   phase, waitingInput, gameEpoch, playerPos, playerFinished, exploredNodes,
//   visitedNodes, bfsQueue, dfsStack, layerTracker, step, correctCount,
//   wrongCount, teleportUsed, teleportReady, destRevealed, p3TeleportUsed,
//   logs, correctNext, clickableNodes, roundCorrectNode, afterP1MoveCallback,
//   THRESHOLD, P3_TELEPORT_THRESHOLD, safeTimeout(fn, delay)
// USADO POR: 03-graph-setup, 04-render, 05-algorithm, 06-movement,
//   07-teleport, 08-turns, 09-visuals, 10-lifecycle (todos)
// ═══════════════════════════════════════════════════════════════════════════
// ─── STATE ────────────────────────────────────────────────────────────────────
export const state = {
  algo: "BFS",
  graphId: 1,
  NODES: {},
  EDGES: [],
  ADJACENCY: {},
  START: "A",
  DEST: "K",
  DIST: {},
  running: false,
  phase: "idle",
  waitingInput: false,
  gameEpoch: 0, // incrementado a cada resetGame()/startGame() — ver safeTimeout()
  playerPos: [],
  playerFinished: [],
  exploredNodes: new Set(), // nós que o algoritmo efetivamente expandiu
  visitedNodes: new Set(), // nós enfileirados/visitados pelo algoritmo
  bfsQueue: [],
  dfsStack: [],
  layerTracker: {},
  step: 0,
  correctCount: 0,
  wrongCount: 0,
  teleportUsed: false,
  teleportReady: false,
  destRevealed: false,
  p3TeleportUsed: false,
  logs: [],
  correctNext: null,
  clickableNodes: [],
  roundCorrectNode: null,
  afterP1MoveCallback: null, // callback pendente da fase só-de-movimento (ver 08-turns.js)
};

export const THRESHOLD = 0.75; // 75% explorado antes do destino ser revelado
export const P3_TELEPORT_THRESHOLD = 0.9; // 90% explorado → P3 teleporta (uma vez, dentro do turno dele)

// safeTimeout: substituto de setTimeout() para QUALQUER continuação do fluxo
// de jogo (turnos, movimento, teleporte, revelação de destino, fim de jogo).
// Guarda o "número da sessão" (gameEpoch) no momento em que foi agendado; se
// resetGame() ou startGame() rodar antes do timer disparar (ex.: jogador
// aperta Reset no meio de uma partida), gameEpoch muda e o callback vira
// no-op — evita que uma continuação da partida ANTERIOR mexa no estado da
// partida NOVA (nós explorados pela metade, posições inconsistentes etc.).
// Usar setTimeout() puro apenas para efeitos cosméticos autocontidos que não
// leem/escrevem estado do jogo (ex.: remover uma classe CSS de animação).
export function safeTimeout(fn, delay) {
  const epochAtSchedule = state.gameEpoch;
  return window.setTimeout(() => {
    if (state.gameEpoch !== epochAtSchedule) return; // partida foi resetada/reiniciada nesse meio tempo
    fn();
  }, delay);
}

// ═══════════════════════════════════════════════════════════════════════════
