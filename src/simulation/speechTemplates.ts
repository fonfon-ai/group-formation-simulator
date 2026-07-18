import type { SpeechEvent, SpeechReason } from "./speech";

/**
 * `SpeechReason`ごとの発言テンプレート文言。文言そのものはこのモジュールでのみ保持し、
 * `speech.ts`(発言生成境界)はここを参照しない(`textKey`の組み立てのみ担当)。
 * engine.tsの状態ログで既に使われている引用文言と表記を揃えている。
 *
 * `ExpressionReason`用のテンプレート(`expressionTemplates.ts`)とは異なり、Phase 2時点では
 * バリエーション選択の仕組みは持たない(reasonごとに1文言のみ)。将来バリエーションが必要になった際は
 * `expressionTemplates.ts`と同様の決定的選択方式を追加すること。
 */
const TEMPLATES: Record<SpeechReason, string> = {
  initiativeFormedCore: "Shall we go somewhere next?",
  cliqueFormedCore: "Shall we go somewhere next?",
  formingGroupRecruitment: "Want to join us over here?",
  approachWelcome: "Come on over, this way!",
  joinGreeting: "Made it — good to be here!",
  leaveDeclaration: "I'll head home for today — see you next time!",
  lightObserverInvitation: "Want to come along with us?",
};

/** `reason`から実際の発言文言を解決する */
export function resolveSpeechText(reason: SpeechReason): string {
  return TEMPLATES[reason];
}

/**
 * `SpeechEvent`から実際の発言文言を解決する。表示側(UI)が`textKey`の文字列構造を
 * 直接パースしなくて済むようにする薄いラッパー(`resolveExpressionEventText`と同じ設計)。
 */
export function resolveSpeechEventText(event: SpeechEvent): string {
  return resolveSpeechText(event.reason);
}
