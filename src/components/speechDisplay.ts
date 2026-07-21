import type { SpeechEvent, SpeechIntent } from "../simulation/speech";
import { resolveSpeechEventText } from "../simulation/speechTemplates";
import { formatTick } from "../simulation/time";
import type { Agent } from "../simulation/types";
import type { Lang } from "../i18n/types";
import { SPEECH_INTENT_LABELS } from "../i18n/labels";

/** `SpeechIntent`の表示ラベル。状態ログ・Inspectorの両方で使う。`lang`未指定時は英語。 */
export function speechIntentLabel(intent: SpeechIntent, lang: Lang = "en"): string {
  return SPEECH_INTENT_LABELS[intent][lang];
}

/** agentId → labelの検索用マップを組み立てる(EventLog/ObserverJoinerInspectorで共有) */
export function buildAgentLabelMap(agents: Agent[]): Map<string, string> {
  return new Map(agents.map((agent) => [agent.id, agent.label]));
}

/** agentId → 表示ラベルの解決。EventLog/ObserverJoinerInspectorに加え、speechEffectsDisplayでも共有する */
export function resolveLabel(agentId: string, labelById: Map<string, string>): string {
  return labelById.get(agentId) ?? agentId;
}

/**
 * 発言の宛先を表す短い句を返す。target(1:1)とaudience(周囲全体)は排他なので、
 * どちらも無ければundefined。`lang`未指定時は英語。
 */
export function formatSpeechDestination(
  event: SpeechEvent,
  labelById: Map<string, string>,
  lang: Lang = "en",
): string | undefined {
  if (event.target) {
    const label = resolveLabel(event.target, labelById);
    return lang === "ja" ? `${label}さんへ` : `to ${label}`;
  }
  if (event.audience === "nearby") {
    return lang === "ja" ? "周囲へ" : "to those nearby";
  }
  return undefined;
}

/**
 * 「誰が・誰に・何の意図で発言したか」を1行で読み取れる人間向けの短い表示文を組み立てる。
 * 構造化されたSpeechEventの主要属性(speaker/target・audience/intent)をこの文言だけから追跡できる。
 */
export function formatSpeechLogMessage(event: SpeechEvent, labelById: Map<string, string>, lang: Lang = "en"): string {
  const speakerLabel = resolveLabel(event.speakerId, labelById);
  const destination = formatSpeechDestination(event, labelById, lang);
  const text = resolveSpeechEventText(event, lang);
  const intent = speechIntentLabel(event.intent, lang);
  if (lang === "ja") {
    return `${formatTick(event.tick)} ${speakerLabel}さんが${destination ?? ""}「${text}」と発言(${intent})`;
  }
  return `${formatTick(event.tick)} ${speakerLabel} said${destination ? ` ${destination}` : ""}: "${text}" (${intent})`;
}

/**
 * デバッグ用途の補足行。構造化属性(intent/reason/speaker/target/audience)を対応付けるための
 * 言語非依存な開発者向け行(キーは常にコード識別子のまま)。
 */
export function formatSpeechDebugMeta(event: SpeechEvent, labelById: Map<string, string>): string {
  const parts = [`intent: ${event.intent}`, `reason: ${event.reason}`, `speaker: ${resolveLabel(event.speakerId, labelById)}`];
  if (event.target) parts.push(`target: ${resolveLabel(event.target, labelById)}`);
  if (event.audience) parts.push(`audience: ${event.audience}`);
  return parts.join(" / ");
}
