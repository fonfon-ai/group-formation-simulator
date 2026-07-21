import type { Lang } from "./types";
import type { AgentState, GroupCandidateStatus, SpeechRelation } from "../simulation/types";
import type { SpeechIntent } from "../simulation/speech";
import type {
  SpeechEffectDimension,
  SpeechInterpretationFactor,
  SpeechInterpretationValence,
} from "../simulation/speechEffects";
import type { InterventionCategory } from "../simulation/interventions";
import type { ApplyMode } from "../components/sliderConfig";

/**
 * Shared, enumerated UI labels that are reused across the simulation display layer and multiple
 * components. Centralized here (rather than duplicated per component) because the same enum values
 * render in several places. Each entry carries both languages; resolver helpers take a `lang`.
 * Component-specific chrome (headings, notes, buttons) lives locally in each component instead.
 */

type Loc = Record<Lang, string>;

export const AGENT_STATE_LABELS: Record<AgentState, Loc> = {
  undecided: { en: "Undecided", ja: "未定" },
  forming: { en: "Forming a circle", ja: "輪を形成中" },
  approaching: { en: "Approaching", ja: "接近中" },
  joined: { en: "Joined", ja: "参加済み" },
  leaving: { en: "Leaving", ja: "離脱中" },
  left: { en: "Left", ja: "離脱済み" },
};

export const GROUP_STATUS_LABELS: Record<GroupCandidateStatus, Loc> = {
  forming: { en: "Forming", ja: "形成中" },
  confirmed: { en: "Confirmed", ja: "成立済み" },
  dissolving: { en: "Dissolving", ja: "解散中" },
  dissolved: { en: "Dissolved", ja: "解散済み" },
  expired: { en: "Expired", ja: "期限切れ" },
};

export const SPEECH_RELATION_LABELS: Record<SpeechRelation, Loc> = {
  speaker: { en: "Speaker", ja: "話者" },
  target: { en: "Target", ja: "対象" },
  audience: { en: "Nearby", ja: "周囲" },
};

export const SPEECH_INTENT_LABELS: Record<SpeechIntent, Loc> = {
  invite: { en: "Invite", ja: "誘う" },
  welcome: { en: "Welcome", ja: "歓迎" },
  greet: { en: "Greet", ja: "挨拶" },
  decline: { en: "Decline", ja: "辞退" },
};

export const EFFECT_DIMENSION_LABELS: Record<SpeechEffectDimension, Loc> = {
  stress: { en: "stress accumulation rate", ja: "ストレス蓄積率" },
  attractiveness: { en: "circle attractiveness", ja: "輪の魅力度" },
  approachProbability: { en: "approach probability", ja: "接近確率" },
  leaveThreshold: { en: "leave threshold", ja: "離脱しきい値" },
};

export const VALENCE_LABELS: Record<SpeechInterpretationValence, Loc> = {
  positive: { en: "Positive", ja: "好意的" },
  neutral: { en: "Neutral (no effect)", ja: "中立(効果なし)" },
  negative: { en: "Negative", ja: "否定的" },
};

export const FACTOR_LABELS: Record<SpeechInterpretationFactor["key"], Loc> = {
  intentBase: { en: "Base direction of the speech", ja: "発言の基礎方向" },
  conformity: { en: "Conformity", ja: "同調傾向" },
  influenceAvoidance: { en: "Influence avoidance", ja: "影響回避度" },
  relationshipTrust: { en: "Trust in the relationship", ja: "関係性への信頼" },
  receiverStress: { en: "Receiver's stress", ja: "受け手のストレス" },
  receiverState: { en: "Receiver's state", ja: "受け手の状態" },
  receptionRelation: { en: "Destination (target/nearby)", ja: "宛先(対象/周囲)" },
  strength: { en: "Strength of the speech", ja: "発言の強さ" },
};

export const INTERVENTION_CATEGORY_LABELS: Record<InterventionCategory, Loc> = {
  none: { en: "—", ja: "—" },
  publicCoordination: { en: "Coordinating the setting", ja: "場の調整" },
  socialPermission: { en: "Social permission", ja: "社会的許可" },
  targetedSupport: { en: "Targeted support", ja: "個別への働きかけ" },
  timeDesign: { en: "Time design", ja: "時間設計" },
};

export const APPLY_MODE_LABELS: Record<ApplyMode, Loc> = {
  immediate: { en: "Live", ja: "即時反映" },
  resetRequired: { en: "On reset", ja: "Resetで反映" },
};

/** The seven shared Monte Carlo summary/comparison metric labels (used by the run and both comparison panels). */
export const MC_METRIC_LABELS = {
  observerJoinerJoinRate: { en: "observerJoiner join rate", ja: "observerJoiner参加率" },
  observerJoinerLeaveRate: { en: "observerJoiner leave rate", ja: "observerJoiner離脱率" },
  groupFailureRate: { en: "Group-failure rate", ja: "グループ不成立率" },
  averageFirstGroupConfirmedTick: { en: "Avg. group-confirmed tick", ja: "平均グループ成立tick" },
  lateJoinSuccessRate: { en: "Late-join success rate", ja: "後乗り成功率" },
  averageJoinedCount: { en: "Avg. joined count", ja: "平均参加人数" },
  averageLeftCount: { en: "Avg. left count", ja: "平均帰宅人数" },
} satisfies Record<string, Loc>;

export function agentStateLabel(state: AgentState, lang: Lang): string {
  return AGENT_STATE_LABELS[state][lang];
}
export function groupStatusLabel(status: GroupCandidateStatus, lang: Lang): string {
  return GROUP_STATUS_LABELS[status][lang];
}
export function speechRelationLabel(relation: SpeechRelation, lang: Lang): string {
  return SPEECH_RELATION_LABELS[relation][lang];
}
export function interventionCategoryLabel(category: InterventionCategory, lang: Lang): string {
  return INTERVENTION_CATEGORY_LABELS[category][lang];
}
export function applyModeLabel(mode: ApplyMode, lang: Lang): string {
  return APPLY_MODE_LABELS[mode][lang];
}
