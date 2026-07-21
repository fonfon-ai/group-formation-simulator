import type { SpeechEvent } from "../simulation/speech";
import { resolveSpeechEventText } from "../simulation/speechTemplates";
import { formatSpeechDestination } from "./speechDisplay";
import type { Lang } from "../i18n/types";

/**
 * `SpeechEvent`をCanvas上の発言吹き出し用の1本のテキストへ組み立てる。
 *
 * - 先頭に💬を付け、色に頼らず「これは発言(心の声ではない)」と分かる手がかりをテキストにも埋め込む。
 * - 宛先は吹き出し内で短く収まるよう compact 表記にする(ブロードキャストは英語 "nearby" / 日本語 "周囲へ")。
 *   状態ログ側(`formatSpeechDestination`)はより丁寧な "to those nearby" を使う。
 * - `lang`未指定時は英語。
 */
export function formatSpeechBubbleText(event: SpeechEvent, labelById: Map<string, string>, lang: Lang = "en"): string {
  const destination =
    event.audience === "nearby"
      ? lang === "ja"
        ? "周囲へ"
        : "nearby"
      : formatSpeechDestination(event, labelById, lang);
  const text = resolveSpeechEventText(event, lang);
  return `💬${text}${destination ? ` (${destination})` : ""}`;
}
