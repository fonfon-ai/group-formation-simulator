import type {
  AggregatedActiveEffect,
  ActiveEffectContribution,
  SpeechEffectDimension,
  SpeechEffectEvent,
  SpeechInterpretationEvent,
  SpeechInterpretationFactor,
  SpeechInterpretationValence,
  SpeechReceptionEvent,
} from "../simulation/speechEffects";
import type { ObserverActiveEffectStatus } from "../simulation/types";
import { formatTick } from "../simulation/time";
import { resolveLabel } from "./speechDisplay";
import type { Lang } from "../i18n/types";
import { EFFECT_DIMENSION_LABELS, FACTOR_LABELS, VALENCE_LABELS } from "../i18n/labels";

/**
 * Phase 3の因果イベント(認知/解釈/効果/現在の適用状況)を、状態ログ・observerJoiner Inspectorの
 * 両方で共通の表示文言へ変換する表示専用ヘルパー(Issue #98)。`lang`未指定時は英語。
 */

export function speechEffectDimensionLabel(dimension: SpeechEffectDimension, lang: Lang = "en"): string {
  return EFFECT_DIMENSION_LABELS[dimension][lang];
}

export function speechInterpretationValenceLabel(valence: SpeechInterpretationValence, lang: Lang = "en"): string {
  return VALENCE_LABELS[valence][lang];
}

export function speechInterpretationFactorLabel(key: SpeechInterpretationFactor["key"], lang: Lang = "en"): string {
  return FACTOR_LABELS[key][lang];
}

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function formatSigned(value: number, digits = 3): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

/** 認知(`SpeechReceptionEvent`)を1行で読める文言にする。heard/非heardの両方を扱う */
export function formatReceptionLine(reception: SpeechReceptionEvent, labelById: Map<string, string>, lang: Lang = "en"): string {
  const receiver = resolveLabel(reception.receiverId, labelById);
  const tick = formatTick(reception.tick);
  const d = formatNumber(reception.distance, 1);
  const t = formatNumber(reception.threshold, 1);
  if (lang === "ja") {
    const distanceText = `距離${d} / 可聴閾値${t}`;
    return reception.heard
      ? `${tick} ${receiver}さんに届いた(${distanceText})`
      : `${tick} ${receiver}さんには届かなかった(圏外: ${distanceText})`;
  }
  const distanceText = `distance ${d} / audible threshold ${t}`;
  return reception.heard
    ? `${tick} reached ${receiver} (${distanceText})`
    : `${tick} did not reach ${receiver} (out of range: ${distanceText})`;
}

/** 解釈(`SpeechInterpretationEvent`)を1行で読める文言にする */
export function formatInterpretationLine(interpretation: SpeechInterpretationEvent, labelById: Map<string, string>, lang: Lang = "en"): string {
  const receiver = resolveLabel(interpretation.receiverId, labelById);
  const valence = speechInterpretationValenceLabel(interpretation.valence, lang);
  const intensity = Math.round(interpretation.intensity * 100);
  const tick = formatTick(interpretation.tick);
  return lang === "ja"
    ? `${tick} ${receiver}さんの解釈: ${valence}(強度${intensity}%)`
    : `${tick} ${receiver}'s interpretation: ${valence} (intensity ${intensity}%)`;
}

/** 解釈のfactor内訳1件分を1行で読める文言にする */
export function formatInterpretationFactorLine(factor: SpeechInterpretationFactor, lang: Lang = "en"): string {
  const label = speechInterpretationFactorLabel(factor.key, lang);
  const raw = formatNumber(factor.rawValue);
  const contribution = formatNumber(factor.contribution);
  return lang === "ja"
    ? `${label}: 入力値${raw} → 寄与係数${contribution}`
    : `${label}: input ${raw} → contribution ${contribution}`;
}

/** 効果(`SpeechEffectEvent`)を1行で読める文言にする */
export function formatEffectLine(effect: SpeechEffectEvent, labelById: Map<string, string>, lang: Lang = "en"): string {
  const receiver = resolveLabel(effect.receiverId, labelById);
  const dimension = speechEffectDimensionLabel(effect.dimension, lang);
  const signed = formatSigned(effect.outputValue);
  const tick = formatTick(effect.occurredTick);
  return lang === "ja"
    ? `${tick} ${receiver}さんの${dimension}へ${signed}の効果(持続${effect.durationTicks}tick)`
    : `${tick} effect of ${signed} on ${receiver}'s ${dimension} (lasts ${effect.durationTicks} ticks)`;
}

/** 現在の適用状況(`ObserverActiveEffectStatus`)を1行で読める文言にする。既に失効/置換済みの場合も明示する */
export function formatActiveEffectStatusLine(status: ObserverActiveEffectStatus | undefined, lang: Lang = "en"): string {
  if (!status) {
    return lang === "ja"
      ? "現在は作用していない(失効済み、または同一話者の再発言により更新済み)"
      : "Not currently active (expired, or superseded by the same speaker's later speech)";
  }
  const cur = formatSigned(status.currentStrength);
  const init = formatSigned(status.initialStrength);
  return lang === "ja"
    ? `現在値${cur}(初期値${init}) / 残り${status.remainingTicks}tick`
    : `current ${cur} (initial ${init}) / ${status.remainingTicks} ticks left`;
}

/** 集約結果(`AggregatedActiveEffect`)を1行で読める文言にする */
export function formatAggregatedEffectSummary(summary: AggregatedActiveEffect, lang: Lang = "en"): string {
  const dimension = speechEffectDimensionLabel(summary.dimension, lang);
  const value = formatSigned(summary.value);
  if (lang === "ja") {
    const target = summary.targetGroupId ? `(対象輪: ${summary.targetGroupId})` : "";
    return `${dimension}${target}: 集約値${value}`;
  }
  const target = summary.targetGroupId ? ` (target circle: ${summary.targetGroupId})` : "";
  return `${dimension}${target}: aggregate ${value}`;
}

/** 集約結果1件分の個別寄与(`ActiveEffectContribution`)を1行で読める文言にする */
export function formatContributionLine(contribution: ActiveEffectContribution, labelById: Map<string, string>, lang: Lang = "en"): string {
  const speaker = resolveLabel(contribution.speakerId, labelById);
  const value = formatSigned(contribution.value);
  const speakerKey = lang === "ja" ? "話者" : "speaker";
  const valueKey = lang === "ja" ? "値" : "value";
  return `speechEventId=${contribution.speechEventId} / ${speakerKey}=${speaker} / intent=${contribution.intent} / ${valueKey}=${value}`;
}
