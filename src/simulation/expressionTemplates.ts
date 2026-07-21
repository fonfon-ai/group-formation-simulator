import type { ExpressionEvent, ExpressionReason } from "./expression";
import type { Lang } from "../i18n/types";

/**
 * `ExpressionReason`ごとの心の声テンプレート集(言語別)。`expression.ts`はここから取得した
 * `variantCount`をもとに決定的にインデックスを選ぶだけで、文言の中身には関与しない。
 *
 * 言語間でバリエーション数を揃えておくこと(同じseed・tick・agentで選ばれるインデックスは
 * 言語非依存に決まり、`resolveExpressionText`はそのインデックスで各言語の配列を引くため、
 * どの言語でも有効なインデックスになる必要がある)。`lang`未指定時は英語にフォールバックする。
 */
type TemplateVariants = {
  general: Record<Lang, readonly string[]>;
  observerJoiner?: Record<Lang, readonly string[]>;
};

const TEMPLATES: Record<ExpressionReason, TemplateVariants> = {
  initiativeFormedCore: {
    general: {
      en: ["Alright, let me speak up", "Maybe I'll suggest a next round"],
      ja: ["よし、声をかけてみよう", "もう一軒、誘ってみるか"],
    },
  },
  cliqueFormedCore: {
    general: {
      en: ["Let's gather the usual crew", "With this crew we could go on"],
      ja: ["いつものメンバーで集まろうか", "この面子ならもう一軒行けそうだ"],
    },
  },
  approachedFormingGroup: {
    general: {
      en: ["A circle's forming — I'll head over", "That circle over there, let's go"],
      ja: ["輪が見えてきた。近づいてみようかな", "あそこの輪、行ってみよう"],
    },
  },
  approachedConfirmedGroup: {
    general: {
      en: ["I'll join that settled group", "Looks like I could get in there"],
      ja: ["もう決まってるグループに合流しよう", "あそこなら入れそうだ"],
    },
  },
  arrivedAtFormingGroup: {
    general: {
      en: ["Made it into the circle", "Joined up just fine"],
      ja: ["よし、輪に加われた", "無事に合流できた"],
    },
    observerJoiner: {
      en: ["Good, I slipped in naturally", "Easier to join than I expected"],
      ja: ["よかった、自然に入れた", "思ったより自然に加われた"],
    },
  },
  arrivedAtConfirmedGroup: {
    general: {
      en: ["Made it into the group", "Glad I got in on time"],
      ja: ["グループに参加できた", "間に合ってよかった"],
    },
    observerJoiner: {
      en: ["Good, I slipped in naturally", "Glad I could still join late"],
      ja: ["よかった、自然に入れた", "後からでも入れてよかった"],
    },
  },
  ambiguityStressExceeded: {
    general: {
      en: ["I'll head home for today", "No point waiting any longer"],
      ja: ["今日はもう帰ろう", "これ以上待つのはやめておこう"],
    },
    observerJoiner: {
      en: ["I'll head home for today", "I'll pass this time after all"],
      ja: ["今日はもう帰ろう", "やっぱり今日はやめておこう"],
    },
  },
  reachedScreenEdge: {
    general: {
      en: ["Heading home now", "And off I went from the venue"],
      ja: ["帰り道につく", "そのまま会場を後にした"],
    },
  },
  receivedLightInvitation: {
    general: {
      en: ["Someone reached out to me", "Nice to be invited — a little relief"],
      ja: ["声をかけてもらえた", "誘ってもらえて少しほっとした"],
    },
    observerJoiner: {
      en: ["Someone reached out to me", "Being invited puts me a bit at ease"],
      ja: ["声をかけてもらえた", "誘ってもらえて少し気が楽になった"],
    },
  },
  stressCrossedRisingThreshold: {
    general: {
      en: ["Still undecided… getting tired", "This is dragging on, I feel it"],
      ja: ["まだ決まらないのか…少し疲れてきた", "そろそろ長いな、と感じ始めた"],
    },
    observerJoiner: {
      en: ["Still undecided… getting tired", "This mood is wearing on me"],
      ja: ["まだ決まらないのか…少し疲れてきた", "この空気、少し疲れるな"],
    },
  },
  stressNearLeaveThreshold: {
    general: {
      en: ["Maybe I should head home soon", "It might be time to call it"],
      ja: ["そろそろ帰った方がよさそうだ", "潮時かもしれない"],
    },
    observerJoiner: {
      en: ["Maybe I should head home soon", "It's probably about time to go"],
      ja: ["そろそろ帰った方がよさそうだ", "そろそろ潮時かもしれない"],
    },
  },
  nearbyGroupUnapproached: {
    general: {
      en: ["Want to join, but it feels awkward now…", "Hard to find the moment to speak up"],
      ja: ["行きたいけど、今入るのは少し気まずいな…", "声をかけるタイミングが難しい"],
    },
    observerJoiner: {
      en: ["Want to join, but it feels awkward now…", "There's a circle, but I hate to butt in"],
      ja: ["行きたいけど、今入るのは少し気まずいな…", "輪はあるけど、自分から入るのは気が引ける"],
    },
  },
  noJoinableGroupNearby: {
    general: {
      en: ["No circle in sight nearby", "I'll wait and see a bit longer"],
      ja: ["近くに輪が見当たらないな", "もう少し様子を見てみよう"],
    },
    observerJoiner: {
      en: ["No circle in sight nearby", "No circle to join yet — I'll wait"],
      ja: ["近くに輪が見当たらないな", "行けそうな輪がまだないから、様子を見よう"],
    },
  },
};

/** `reason`に対応するテンプレート配列を返す。observerJoiner専用の言い回しがなければgeneralを返す */
export function resolveExpressionVariants(
  reason: ExpressionReason,
  isObserverJoiner: boolean,
  lang: Lang = "en",
): readonly string[] {
  const entry = TEMPLATES[reason];
  return isObserverJoiner && entry.observerJoiner ? entry.observerJoiner[lang] : entry.general[lang];
}

/**
 * `pickTextVariant`が決定的にインデックスを選ぶための、実際に存在するバリエーション数。
 * バリエーション数は言語間で揃えているため言語非依存(英語の長さを代表値として使う)。
 */
export function getExpressionVariantCount(reason: ExpressionReason, isObserverJoiner: boolean): number {
  return resolveExpressionVariants(reason, isObserverJoiner, "en").length;
}

/** `reason`+`variantIndex`から実際の表示文言を解決する。`ExpressionEvent.textKey`の解決に使う想定 */
export function resolveExpressionText(
  reason: ExpressionReason,
  isObserverJoiner: boolean,
  variantIndex: number,
  lang: Lang = "en",
): string {
  const variants = resolveExpressionVariants(reason, isObserverJoiner, lang);
  return variants[variantIndex % variants.length];
}

const TEXT_KEY_VARIANT_PATTERN = /\.v(\d+)$/;

/**
 * `ExpressionEvent`から実際の表示文言を解決する。`textKey`(`thought.${reason}.v${variant}`)から
 * バリアント番号を取り出し、`event.reason`と合わせて`resolveExpressionText`に渡すだけの薄いラッパー。
 */
export function resolveExpressionEventText(
  event: ExpressionEvent,
  isObserverJoiner: boolean,
  lang: Lang = "en",
): string {
  const match = TEXT_KEY_VARIANT_PATTERN.exec(event.textKey);
  const variantIndex = match ? Number(match[1]) : 0;
  return resolveExpressionText(event.reason, isObserverJoiner, variantIndex, lang);
}
