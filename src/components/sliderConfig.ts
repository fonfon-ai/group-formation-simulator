import type { SimParams } from "../simulation/types";
import type { Localized } from "../simulation/presets";
import type { Lang } from "../i18n/types";

/**
 * "immediate": 実行中のシミュレーションにも次tickから反映される。
 * "resetRequired": 既存エージェント生成時にのみ使われるため、Reset(または
 * シード/プリセット変更による再生成)を行わないと現在の状態には反映されない。
 */
export type ApplyMode = "immediate" | "resetRequired";

export type SliderDef = {
  key: keyof SimParams;
  label: Localized;
  min: number;
  max: number;
  step: number;
  applyMode: ApplyMode;
};

export const SLIDERS: SliderDef[] = [
  { key: "populationSize", label: { en: "Population", ja: "人数" }, min: 5, max: 30, step: 1, applyMode: "resetRequired" },
  { key: "groupConfirmSize", label: { en: "People needed to confirm a next round", ja: "二次会成立に必要な人数" }, min: 2, max: 8, step: 1, applyMode: "immediate" },
  { key: "numLeaders", label: { en: "Number of leaders", ja: "主導者の人数" }, min: 0, max: 4, step: 1, applyMode: "resetRequired" },
  { key: "overallWillingness", label: { en: "Overall willingness to go on", ja: "全体の二次会意欲" }, min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "ambiguityDuration", label: { en: "Ambiguity duration (how long it's tolerated)", ja: "曖昧な時間の長さ(耐えられる長さ)" }, min: 0.3, max: 2, step: 0.1, applyMode: "immediate" },
  { key: "lateJoinEase", label: { en: "Ease of joining late", ja: "後乗り参加のしやすさ" }, min: 0, max: 1, step: 0.05, applyMode: "immediate" },
  { key: "existingTieStrength", label: { en: "Existing tie strength", ja: "既存関係性の強さ" }, min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerAmbiguityTolerance", label: { en: "observerJoiner ambiguity tolerance", ja: "observerJoinerの曖昧さ耐性" }, min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerInfluenceAvoidance", label: { en: "observerJoiner influence avoidance", ja: "observerJoinerの影響回避度" }, min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
  { key: "observerLeaveEase", label: { en: "observerJoiner ease of leaving", ja: "observerJoinerの帰宅しやすさ" }, min: 0, max: 1, step: 0.05, applyMode: "resetRequired" },
];

export function sliderLabel(slider: SliderDef, lang: Lang = "en"): string {
  return slider.label[lang];
}

/** Resetしないと現在のシミュレーション状態に反映されないパラメータのキー一覧 */
export const RESET_REQUIRED_PARAM_KEYS: (keyof SimParams)[] = SLIDERS.filter(
  (slider) => slider.applyMode === "resetRequired",
).map((slider) => slider.key);
