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

/**
 * Phase 3の因果イベント(認知/解釈/効果/現在の適用状況)を、状態ログ・observerJoiner Inspectorの
 * 両方で共通の日本語文言へ変換する表示専用ヘルパー(Issue #98)。`speechDisplay.ts`と同様、
 * 構造化イベントの属性から文言を生成するだけの純粋関数のみを持ち、シミュレーション状態や
 * 乱数を一切参照・変更しない。
 */

const DIMENSION_LABEL: Record<SpeechEffectDimension, string> = {
  stress: "stress accumulation rate",
  attractiveness: "circle attractiveness",
  approachProbability: "approach probability",
  leaveThreshold: "leave threshold",
};

export function speechEffectDimensionLabel(dimension: SpeechEffectDimension): string {
  return DIMENSION_LABEL[dimension];
}

const VALENCE_LABEL: Record<SpeechInterpretationValence, string> = {
  positive: "Positive",
  neutral: "Neutral (no effect)",
  negative: "Negative",
};

export function speechInterpretationValenceLabel(valence: SpeechInterpretationValence): string {
  return VALENCE_LABEL[valence];
}

const FACTOR_LABEL: Record<SpeechInterpretationFactor["key"], string> = {
  intentBase: "Base direction of the speech",
  conformity: "Conformity",
  influenceAvoidance: "Influence avoidance",
  relationshipTrust: "Trust in the relationship",
  receiverStress: "Receiver's stress",
  receiverState: "Receiver's state",
  receptionRelation: "Destination (target/nearby)",
  strength: "Strength of the speech",
};

export function speechInterpretationFactorLabel(key: SpeechInterpretationFactor["key"]): string {
  return FACTOR_LABEL[key];
}

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function formatSigned(value: number, digits = 3): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

/** 認知(`SpeechReceptionEvent`)を1行で読める文言にする。heard/非heardの両方を扱う */
export function formatReceptionLine(reception: SpeechReceptionEvent, labelById: Map<string, string>): string {
  const receiver = resolveLabel(reception.receiverId, labelById);
  const distanceText = `distance ${formatNumber(reception.distance, 1)} / audible threshold ${formatNumber(reception.threshold, 1)}`;
  return reception.heard
    ? `${formatTick(reception.tick)} reached ${receiver} (${distanceText})`
    : `${formatTick(reception.tick)} did not reach ${receiver} (out of range: ${distanceText})`;
}

/** 解釈(`SpeechInterpretationEvent`)を1行で読める文言にする */
export function formatInterpretationLine(interpretation: SpeechInterpretationEvent, labelById: Map<string, string>): string {
  const receiver = resolveLabel(interpretation.receiverId, labelById);
  const valence = speechInterpretationValenceLabel(interpretation.valence);
  const intensity = Math.round(interpretation.intensity * 100);
  return `${formatTick(interpretation.tick)} ${receiver}'s interpretation: ${valence} (intensity ${intensity}%)`;
}

/** 解釈のfactor内訳1件分を1行で読める文言にする */
export function formatInterpretationFactorLine(factor: SpeechInterpretationFactor): string {
  const label = speechInterpretationFactorLabel(factor.key);
  return `${label}: input ${formatNumber(factor.rawValue)} → contribution ${formatNumber(factor.contribution)}`;
}

/** 効果(`SpeechEffectEvent`)を1行で読める文言にする */
export function formatEffectLine(effect: SpeechEffectEvent, labelById: Map<string, string>): string {
  const receiver = resolveLabel(effect.receiverId, labelById);
  const dimension = speechEffectDimensionLabel(effect.dimension);
  return `${formatTick(effect.occurredTick)} effect of ${formatSigned(effect.outputValue)} on ${receiver}'s ${dimension} (lasts ${effect.durationTicks} ticks)`;
}

/** 現在の適用状況(`ObserverActiveEffectStatus`)を1行で読める文言にする。既に失効/置換済みの場合も明示する */
export function formatActiveEffectStatusLine(status: ObserverActiveEffectStatus | undefined): string {
  if (!status) return "Not currently active (expired, or superseded by the same speaker's later speech)";
  return `current ${formatSigned(status.currentStrength)} (initial ${formatSigned(status.initialStrength)}) / ${status.remainingTicks} ticks left`;
}

/** 集約結果(`AggregatedActiveEffect`)を1行で読める文言にする */
export function formatAggregatedEffectSummary(summary: AggregatedActiveEffect): string {
  const target = summary.targetGroupId ? ` (target circle: ${summary.targetGroupId})` : "";
  return `${speechEffectDimensionLabel(summary.dimension)}${target}: aggregate ${formatSigned(summary.value)}`;
}

/** 集約結果1件分の個別寄与(`ActiveEffectContribution`)を1行で読める文言にする */
export function formatContributionLine(contribution: ActiveEffectContribution, labelById: Map<string, string>): string {
  const speaker = resolveLabel(contribution.speakerId, labelById);
  return `speechEventId=${contribution.speechEventId} / speaker=${speaker} / intent=${contribution.intent} / value=${formatSigned(contribution.value)}`;
}
