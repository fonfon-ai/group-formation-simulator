import type { SimParams } from "../simulation/types";

/**
 * "immediate": 実行中のシミュレーションにも次tickから反映される。
 * "resetRequired": 既存エージェント生成時にのみ使われるため、Reset(または
 * シード/プリセット変更による再生成)を行わないと現在の状態には反映されない。
 */
export type ApplyMode = "immediate" | "resetRequired";

export type SliderDef = {
  key: keyof SimParams;
  label: string;
  min: number;
  max: number;
  step: number;
  applyMode: ApplyMode;
};

export const SLIDERS: SliderDef[] = [
  { key: "populationSize", label: "Population", min: 5, max: 30, step: 1, applyMode: "resetRequired" },
  { key: "groupConfirmSize", label: "People needed to confirm a next round", min: 2, max: 8, step: 1, applyMode: "immediate" },
  { key: "numLeaders", label: "Number of leaders", min: 0, max: 4, step: 1, applyMode: "resetRequired" },
  { key: "overallWillingness", label: "Overall willingness to go on", min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "ambiguityDuration", label: "Ambiguity duration (how long it's tolerated)", min: 0.3, max: 2, step: 0.1, applyMode: "immediate" },
  { key: "lateJoinEase", label: "Ease of joining late", min: 0, max: 1, step: 0.05, applyMode: "immediate" },
  { key: "existingTieStrength", label: "Existing tie strength", min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerAmbiguityTolerance", label: "observerJoiner ambiguity tolerance", min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerInfluenceAvoidance", label: "observerJoiner influence avoidance", min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerLeaveEase", label: "observerJoiner ease of leaving", min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
];

/** Resetしないと現在のシミュレーション状態に反映されないパラメータのキー一覧 */
export const RESET_REQUIRED_PARAM_KEYS: (keyof SimParams)[] = SLIDERS.filter(
  (slider) => slider.applyMode === "resetRequired",
).map((slider) => slider.key);

export const APPLY_MODE_LABEL: Record<ApplyMode, string> = {
  immediate: "Live",
  resetRequired: "On reset",
};
