import type { SpeechEvent, SpeechReason } from "./speech";
import type { Lang } from "../i18n/types";

/**
 * `SpeechReason`ごとの発言テンプレート文言(言語別)。文言そのものはこのモジュールでのみ保持し、
 * `speech.ts`(発言生成境界)はここを参照しない(`textKey`の組み立てのみ担当)。
 * `lang`未指定時は英語にフォールバックする(既存の呼び出し・テストとの後方互換)。
 */
const TEMPLATES: Record<SpeechReason, Record<Lang, string>> = {
  initiativeFormedCore: { en: "Shall we go somewhere next?", ja: "もう一軒行く?" },
  cliqueFormedCore: { en: "Shall we go somewhere next?", ja: "もう一軒行く?" },
  formingGroupRecruitment: { en: "Want to join us over here?", ja: "こっちも一緒にどう?" },
  approachWelcome: { en: "Come on over, this way!", ja: "おいでおいで、こっちだよ" },
  joinGreeting: { en: "Made it — good to be here!", ja: "合流できた、よろしく!" },
  leaveDeclaration: { en: "I'll head home for today — see you next time!", ja: "今日はここで帰るね、また今度!" },
  lightObserverInvitation: { en: "Want to come along with us?", ja: "よかったら一緒に行く?" },
};

/** `reason`から実際の発言文言を解決する */
export function resolveSpeechText(reason: SpeechReason, lang: Lang = "en"): string {
  return TEMPLATES[reason][lang];
}

/**
 * `SpeechEvent`から実際の発言文言を解決する。表示側(UI)が`textKey`の文字列構造を
 * 直接パースしなくて済むようにする薄いラッパー(`resolveExpressionEventText`と同じ設計)。
 */
export function resolveSpeechEventText(event: SpeechEvent, lang: Lang = "en"): string {
  return resolveSpeechText(event.reason, lang);
}
