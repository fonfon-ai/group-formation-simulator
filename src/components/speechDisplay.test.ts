import { describe, expect, it } from "vitest";
import { createSpeechEvent } from "../simulation/speech";
import {
  buildAgentLabelMap,
  formatSpeechDebugMeta,
  formatSpeechDestination,
  formatSpeechLogMessage,
  speechIntentLabel,
} from "./speechDisplay";
import type { Agent } from "../simulation/types";

function makeAgent(overrides: Partial<Agent>): Agent {
  return {
    id: "agent-x",
    label: "X",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    willingness: 0.5,
    initiative: 0.5,
    ambiguityTolerance: 0.5,
    influenceAvoidance: 0.5,
    conformity: 0.5,
    leaveThreshold: 0.5,
    isObserverJoiner: false,
    state: "undecided",
    stress: 0,
    ...overrides,
  };
}

describe("buildAgentLabelMap", () => {
  it("maps agent id to label", () => {
    const map = buildAgentLabelMap([makeAgent({ id: "a1", label: "Aさん" }), makeAgent({ id: "a2", label: "Bさん" })]);

    expect(map.get("a1")).toBe("Aさん");
    expect(map.get("a2")).toBe("Bさん");
    expect(map.get("missing")).toBeUndefined();
  });
});

describe("speechIntentLabel", () => {
  it("maps every SpeechIntent to a display label", () => {
    expect(speechIntentLabel("invite")).toBe("Invite");
    expect(speechIntentLabel("welcome")).toBe("Welcome");
    expect(speechIntentLabel("greet")).toBe("Greet");
    expect(speechIntentLabel("decline")).toBe("Decline");
  });
});

describe("formatSpeechDestination", () => {
  const labelById = buildAgentLabelMap([makeAgent({ id: "target-1", label: "B" })]);

  it("resolves a targeted (1:1) speech event to 'to <label>'", () => {
    const event = createSpeechEvent({
      tick: 1,
      speakerId: "speaker-1",
      intent: "invite",
      reason: "lightObserverInvitation",
      target: "target-1",
    });

    expect(formatSpeechDestination(event, labelById)).toBe("to B");
  });

  it("falls back to the raw id when the target has no known label", () => {
    const event = createSpeechEvent({
      tick: 1,
      speakerId: "speaker-1",
      intent: "invite",
      reason: "lightObserverInvitation",
      target: "unknown-id",
    });

    expect(formatSpeechDestination(event, labelById)).toBe("to unknown-id");
  });

  it("resolves a nearby-audience speech event to 'to those nearby'", () => {
    const event = createSpeechEvent({
      tick: 1,
      speakerId: "speaker-1",
      intent: "greet",
      reason: "joinGreeting",
      audience: "nearby",
    });

    expect(formatSpeechDestination(event, labelById)).toBe("to those nearby");
  });
});

describe("formatSpeechLogMessage", () => {
  it("produces a single human-readable line naming speaker, quoted text, destination, and intent", () => {
    const labelById = buildAgentLabelMap([
      makeAgent({ id: "founder", label: "A" }),
    ]);
    const event = createSpeechEvent({
      tick: 5,
      speakerId: "founder",
      intent: "invite",
      reason: "initiativeFormedCore",
      audience: "nearby",
    });

    const message = formatSpeechLogMessage(event, labelById);

    expect(message).toContain("A said");
    expect(message).toContain("Shall we go somewhere next?");
    expect(message).toContain("to those nearby");
    expect(message).toContain("Invite");
    expect(message).toBe('00:15 A said to those nearby: "Shall we go somewhere next?" (Invite)');
  });
});

describe("formatSpeechDebugMeta", () => {
  it("maps the short human-readable line to the SpeechEvent's structured attributes", () => {
    const labelById = buildAgentLabelMap([
      makeAgent({ id: "helper", label: "Cさん" }),
      makeAgent({ id: "observer", label: "Dさん" }),
    ]);
    const event = createSpeechEvent({
      tick: 5,
      speakerId: "helper",
      intent: "invite",
      reason: "lightObserverInvitation",
      target: "observer",
    });

    const meta = formatSpeechDebugMeta(event, labelById);

    expect(meta).toContain("intent: invite");
    expect(meta).toContain("reason: lightObserverInvitation");
    expect(meta).toContain("speaker: Cさん");
    expect(meta).toContain("target: Dさん");
    expect(meta).not.toContain("audience");
  });

  it("includes audience instead of target for broadcast speech events", () => {
    const labelById = buildAgentLabelMap([makeAgent({ id: "leaver", label: "Eさん" })]);
    const event = createSpeechEvent({
      tick: 8,
      speakerId: "leaver",
      intent: "decline",
      reason: "leaveDeclaration",
      audience: "nearby",
    });

    const meta = formatSpeechDebugMeta(event, labelById);

    expect(meta).toContain("audience: nearby");
    expect(meta).not.toContain("target:");
  });
});
