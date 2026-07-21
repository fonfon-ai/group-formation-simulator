import { describe, expect, it } from "vitest";
import { isLang, LANGS, readInitialLang } from "./types";
import { agentStateLabel, applyModeLabel, groupStatusLabel, interventionCategoryLabel, speechRelationLabel } from "./labels";
import { getPresetById, presetDescription, presetName } from "../simulation/presets";
import {
  getInterventionById,
  interventionDescription,
  interventionExpectedEffect,
  interventionName,
} from "../simulation/interventions";
import { resolveSpeechText } from "../simulation/speechTemplates";
import { getExpressionVariantCount, resolveExpressionVariants } from "../simulation/expressionTemplates";
import { sliderLabel, SLIDERS } from "../components/sliderConfig";
import { buildAgentLabelMap, formatSpeechLogMessage } from "../components/speechDisplay";
import { formatEffectLine } from "../components/speechEffectsDisplay";
import { createSpeechEvent } from "../simulation/speech";
import type { Agent } from "../simulation/types";
import type { SpeechEffectEvent } from "../simulation/speechEffects";

function makeAgent(overrides: Partial<Agent>): Agent {
  return {
    id: "a",
    label: "A",
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

describe("lang utilities", () => {
  it("accepts only en/ja", () => {
    expect(isLang("en")).toBe(true);
    expect(isLang("ja")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
    expect(LANGS).toEqual(["en", "ja"]);
  });

  it("defaults to English outside a DOM (no window/localStorage in the node test env)", () => {
    expect(readInitialLang()).toBe("en");
  });
});

describe("shared labels are bilingual", () => {
  it("resolves distinct en/ja for enumerated labels", () => {
    expect(agentStateLabel("undecided", "en")).toBe("Undecided");
    expect(agentStateLabel("undecided", "ja")).toBe("未定");
    expect(groupStatusLabel("confirmed", "en")).toBe("Confirmed");
    expect(groupStatusLabel("confirmed", "ja")).toBe("成立済み");
    expect(speechRelationLabel("speaker", "ja")).toBe("話者");
    expect(interventionCategoryLabel("timeDesign", "ja")).toBe("時間設計");
    expect(applyModeLabel("immediate", "ja")).toBe("即時反映");
  });
});

describe("presets/interventions are bilingual with an English default", () => {
  it("resolves preset name/description per language, defaulting to English", () => {
    const natural = getPresetById("natural");
    expect(presetName(natural)).toBe(natural.name.en);
    expect(presetName(natural, "en")).toContain("next round");
    expect(presetName(natural, "ja")).toContain("二次会");
    expect(presetDescription(natural, "ja")).toContain("observerJoiner");
  });

  it("resolves intervention name/description/expectedEffect per language", () => {
    const scenario = getInterventionById("light-observer-invitation");
    expect(interventionName(scenario, "en")).toContain("nudge");
    expect(interventionName(scenario, "ja")).toContain("声かけ");
    expect(interventionDescription(scenario, "ja").length).toBeGreaterThan(0);
    expect(interventionExpectedEffect(scenario, "ja").length).toBeGreaterThan(0);
    // default is English
    expect(interventionName(scenario)).toBe(scenario.name.en);
  });
});

describe("generated content is bilingual", () => {
  it("resolves speech templates per language", () => {
    expect(resolveSpeechText("initiativeFormedCore", "en")).toBe("Shall we go somewhere next?");
    expect(resolveSpeechText("initiativeFormedCore", "ja")).toBe("もう一軒行く?");
  });

  it("keeps expression variant counts language-independent so the deterministic index stays valid", () => {
    for (const isObserverJoiner of [false, true]) {
      expect(resolveExpressionVariants("ambiguityStressExceeded", isObserverJoiner, "en").length).toBe(
        resolveExpressionVariants("ambiguityStressExceeded", isObserverJoiner, "ja").length,
      );
      expect(getExpressionVariantCount("ambiguityStressExceeded", isObserverJoiner)).toBe(
        resolveExpressionVariants("ambiguityStressExceeded", isObserverJoiner, "ja").length,
      );
    }
  });

  it("resolves slider labels per language", () => {
    const population = SLIDERS[0];
    expect(sliderLabel(population, "en")).toBe("Population");
    expect(sliderLabel(population, "ja")).toBe("人数");
  });
});

describe("display formatters switch structure by language", () => {
  it("formats a speech log line with Japanese sentence structure when lang=ja", () => {
    const labelById = buildAgentLabelMap([makeAgent({ id: "founder", label: "A" })]);
    const event = createSpeechEvent({
      tick: 5,
      speakerId: "founder",
      intent: "invite",
      reason: "initiativeFormedCore",
      audience: "nearby",
    });
    const en = formatSpeechLogMessage(event, labelById, "en");
    const ja = formatSpeechLogMessage(event, labelById, "ja");
    expect(en).toBe('00:15 A said to those nearby: "Shall we go somewhere next?" (Invite)');
    expect(ja).toBe("00:15 Aさんが周囲へ「もう一軒行く?」と発言(誘う)");
  });

  it("formats a speech-effect line per language", () => {
    const labelById = buildAgentLabelMap([makeAgent({ id: "observer", label: "D" })]);
    const effect: SpeechEffectEvent = {
      id: "effect-1",
      speechEventId: "speech-1",
      interpretationEventId: "interpretation-1",
      receiverId: "observer",
      speakerId: "helper",
      intent: "invite",
      reason: "lightObserverInvitation",
      occurredTick: 5,
      appliedTick: 5,
      dimension: "approachProbability",
      outputValue: 0.2,
      durationTicks: 5,
    };
    expect(formatEffectLine(effect, labelById, "en")).toContain("approach probability");
    expect(formatEffectLine(effect, labelById, "ja")).toContain("接近確率");
    expect(formatEffectLine(effect, labelById, "ja")).toContain("持続5tick");
  });
});
