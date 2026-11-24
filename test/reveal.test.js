import { beforeEach, describe, expect, it } from "vitest";
import { state, THRESHOLD } from "../js/02-state.js";
import { loadGraph } from "../js/03-graph-setup.js";
import { buildGraph } from "../js/04-render.js";
import { checkDestReveal } from "../js/05-algorithm.js";
import { colorNode } from "../js/09-visuals.js";

describe("Revelação do destino", () => {
  beforeEach(() => {
    loadGraph(1);
    state.destRevealed = false;
    state.exploredNodes = new Set();
    state.logs = [];
    buildGraph();
  });

  it("mantém o identificador oculto mesmo após colorir o nó explorado", () => {
    colorNode(state.DEST);
    expect(document.getElementById(`label-${state.DEST}`).textContent).toBe("?");
    expect(document.getElementById(`label-${state.DEST}`).classList.contains("hidden")).toBe(true);
  });

  it("não revela o destino apenas por ter sido expandido antes de 75%", () => {
    state.exploredNodes.add(state.DEST);
    checkDestReveal(state.DEST);
    expect(state.destRevealed).toBe(false);
    expect(document.getElementById(`label-${state.DEST}`).textContent).toBe("?");
  });

  it("revela após explorar o destino e atingir 75%, restaurando o estilo", () => {
    colorNode(state.DEST);
    state.exploredNodes = new Set(Object.keys(state.NODES).slice(0, Math.ceil(THRESHOLD * 11)));
    state.exploredNodes.add(state.DEST);
    checkDestReveal(state.DEST);

    const label = document.getElementById(`label-${state.DEST}`);
    const circle = document.getElementById(`circle-${state.DEST}`);
    expect(state.destRevealed).toBe(true);
    expect(label.textContent).toBe(state.DEST);
    expect(label.classList.contains("hidden")).toBe(false);
    expect(circle.classList.contains("destination")).toBe(true);
    expect(circle.style.getPropertyValue("fill")).toBe("");
    expect(circle.style.getPropertyValue("stroke")).toBe("");
  });
});
