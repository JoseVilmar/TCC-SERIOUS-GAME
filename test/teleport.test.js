import { describe, it, expect, beforeEach, vi } from "vitest";
import { state, P3_TELEPORT_THRESHOLD } from "../js/02-state.js";
import { loadGraph } from "../js/03-graph-setup.js";
import { tryP3AutoTeleport } from "../js/07-teleport.js";

describe("Teleport (secondary)", () => {
  beforeEach(() => {
    loadGraph(1);
    state.p3TeleportUsed = false;
    state.playerFinished = [false, false, false];
    state.exploredNodes = new Set();
  });

  it("tryP3AutoTeleport swaps positions when threshold met", () => {
    loadGraph(1);
    // prepara posições dos jogadores
    state.playerPos = [state.START, state.START, state.START];
    state.playerFinished = [false, false, false];
    // marca nós suficientes como explorados para atingir o limiar
    const needed = Math.ceil(
      P3_TELEPORT_THRESHOLD * Object.keys(state.NODES).length,
    );
    const nodes = Object.keys(state.NODES);
    state.exploredNodes = new Set(nodes.slice(0, needed));

    const rnd = vi.spyOn(Math, "random").mockImplementation(() => 0.2); // escolhe targetIdx 0
    const ret = tryP3AutoTeleport();
    expect(ret === 0 || ret === 1).toBe(true);
    expect(state.p3TeleportUsed).toBe(true);
    rnd.mockRestore();
  });

  it("não permite o teletransporte automático antes de 90% e não repete o uso", () => {
    const nodes = Object.keys(state.NODES);
    const needed = Math.ceil(P3_TELEPORT_THRESHOLD * nodes.length);
    state.exploredNodes = new Set(nodes.slice(0, needed - 1));
    expect(tryP3AutoTeleport()).toBeNull();
    expect(state.p3TeleportUsed).toBe(false);

    state.exploredNodes.add(nodes[needed - 1]);
    expect(tryP3AutoTeleport()).not.toBeNull();
    expect(tryP3AutoTeleport()).toBeNull();
  });
});
