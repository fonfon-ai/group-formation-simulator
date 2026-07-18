import type { SimParams } from "./types";

export const DEFAULT_PARAMS: SimParams = {
  populationSize: 14,
  groupConfirmSize: 3,
  numLeaders: 1,
  overallWillingness: 0.55,
  ambiguityDuration: 1.0,
  lateJoinEase: 0.5,
  existingTieStrength: 0.3,
  observerAmbiguityTolerance: 0.25,
  observerInfluenceAvoidance: 0.9,
  observerLeaveEase: 0.6,
};

export type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  params: SimParams;
};

export const PRESETS: ScenarioPreset[] = [
  {
    id: "natural",
    name: "1. A next round forms naturally",
    description:
      "There's a leader and several people keen on a next round. A standard case where the observerJoiner can join easily too.",
    params: {
      ...DEFAULT_PARAMS,
      numLeaders: 2,
      overallWillingness: 0.7,
      lateJoinEase: 0.6,
      existingTieStrength: 0.2,
    },
  },
  {
    id: "ambiguous-dissolve",
    name: "2. Everyone drifts apart in ambiguity",
    description:
      "No leader; everyone waits and watches until time runs out. The observerJoiner tends to head home.",
    params: {
      ...DEFAULT_PARAMS,
      numLeaders: 0,
      overallWillingness: 0.35,
      ambiguityDuration: 0.6,
      lateJoinEase: 0.3,
      existingTieStrength: 0.2,
    },
  },
  {
    id: "strong-leader",
    name: "3. A strong leader drives the group",
    description:
      "A single strong leader forms a core early, and many people are drawn to it.",
    params: {
      ...DEFAULT_PARAMS,
      numLeaders: 1,
      overallWillingness: 0.6,
      lateJoinEase: 0.55,
      existingTieStrength: 0.15,
    },
  },
  {
    id: "late-join-culture",
    name: "4. A late-join-friendly culture",
    description:
      "The cost of joining an already-formed group is low. The observerJoiner joins easily.",
    params: {
      ...DEFAULT_PARAMS,
      numLeaders: 1,
      overallWillingness: 0.55,
      lateJoinEase: 0.85,
      existingTieStrength: 0.15,
    },
  },
  {
    id: "leftover-free-grouping",
    name: "5. Free-form grouping leaves people out",
    description:
      "There's no leader to bring everyone together; only pre-existing friend groups naturally coalesce. Ties are strong and there's little room to mix in later. The observerJoiner tends to end up isolated.",
    params: {
      ...DEFAULT_PARAMS,
      numLeaders: 0,
      overallWillingness: 0.5,
      lateJoinEase: 0.2,
      existingTieStrength: 0.85,
    },
  },
];

export function getPresetById(id: string): ScenarioPreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
