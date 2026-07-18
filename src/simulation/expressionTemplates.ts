import type { ExpressionEvent, ExpressionReason } from "./expression";

/**
 * `ExpressionReason`ごとの心の声テンプレート集。文言そのものはこのモジュールでのみ保持し、
 * `expression.ts`はここから取得した`variantCount`をもとに決定的にインデックスを選ぶだけで、
 * 文言の中身には関与しない(UI側も同様、テキストの再解釈はしない)。
 *
 * `observerJoiner`はobserverJoiner専用の言い回しがある場合のみ上書きに使う。
 * 未指定ならgeneralを共有する(一般エージェントとの言い回しの区別は、必要な局面にだけ設ける)。
 *
 * 文言は状態と矛盾しないこと、断定的な性格診断に見えないことを優先し、
 * 吹き出し内で読み切れる短さに留めている。
 */
type TemplateVariants = {
  general: readonly string[];
  observerJoiner?: readonly string[];
};

const TEMPLATES: Record<ExpressionReason, TemplateVariants> = {
  initiativeFormedCore: {
    general: ["Alright, let me speak up", "Maybe I'll suggest a next round"],
  },
  cliqueFormedCore: {
    general: ["Let's gather the usual crew", "With this crew we could go on"],
  },
  approachedFormingGroup: {
    general: ["A circle's forming — I'll head over", "That circle over there, let's go"],
  },
  approachedConfirmedGroup: {
    general: ["I'll join that settled group", "Looks like I could get in there"],
  },
  arrivedAtFormingGroup: {
    general: ["Made it into the circle", "Joined up just fine"],
    observerJoiner: ["Good, I slipped in naturally", "Easier to join than I expected"],
  },
  arrivedAtConfirmedGroup: {
    general: ["Made it into the group", "Glad I got in on time"],
    observerJoiner: ["Good, I slipped in naturally", "Glad I could still join late"],
  },
  ambiguityStressExceeded: {
    general: ["I'll head home for today", "No point waiting any longer"],
    observerJoiner: ["I'll head home for today", "I'll pass this time after all"],
  },
  reachedScreenEdge: {
    general: ["Heading home now", "And off I went from the venue"],
  },
  receivedLightInvitation: {
    general: ["Someone reached out to me", "Nice to be invited — a little relief"],
    observerJoiner: ["Someone reached out to me", "Being invited puts me a bit at ease"],
  },
  stressCrossedRisingThreshold: {
    general: ["Still undecided… getting tired", "This is dragging on, I feel it"],
    observerJoiner: ["Still undecided… getting tired", "This mood is wearing on me"],
  },
  stressNearLeaveThreshold: {
    general: ["Maybe I should head home soon", "It might be time to call it"],
    observerJoiner: ["Maybe I should head home soon", "It's probably about time to go"],
  },
  nearbyGroupUnapproached: {
    general: ["Want to join, but it feels awkward now…", "Hard to find the moment to speak up"],
    observerJoiner: ["Want to join, but it feels awkward now…", "There's a circle, but I hate to butt in"],
  },
  noJoinableGroupNearby: {
    general: ["No circle in sight nearby", "I'll wait and see a bit longer"],
    observerJoiner: ["No circle in sight nearby", "No circle to join yet — I'll wait"],
  },
};

/** `reason`に対応するテンプレート配列を返す。observerJoiner専用の言い回しがなければgeneralを返す */
export function resolveExpressionVariants(reason: ExpressionReason, isObserverJoiner: boolean): readonly string[] {
  const entry = TEMPLATES[reason];
  return isObserverJoiner && entry.observerJoiner ? entry.observerJoiner : entry.general;
}

/** `pickTextVariant`が決定的にインデックスを選ぶための、実際に存在するバリエーション数 */
export function getExpressionVariantCount(reason: ExpressionReason, isObserverJoiner: boolean): number {
  return resolveExpressionVariants(reason, isObserverJoiner).length;
}

/** `reason`+`variantIndex`から実際の表示文言を解決する。`ExpressionEvent.textKey`の解決に使う想定 */
export function resolveExpressionText(reason: ExpressionReason, isObserverJoiner: boolean, variantIndex: number): string {
  const variants = resolveExpressionVariants(reason, isObserverJoiner);
  return variants[variantIndex % variants.length];
}

const TEXT_KEY_VARIANT_PATTERN = /\.v(\d+)$/;

/**
 * `ExpressionEvent`から実際の表示文言を解決する。`textKey`(`thought.${reason}.v${variant}`)から
 * バリアント番号を取り出し、`event.reason`と合わせて`resolveExpressionText`に渡すだけの薄いラッパー。
 * 表示側(UI)がtextKeyの文字列構造を直接パースしなくて済むようにする。
 */
export function resolveExpressionEventText(event: ExpressionEvent, isObserverJoiner: boolean): string {
  const match = TEXT_KEY_VARIANT_PATTERN.exec(event.textKey);
  const variantIndex = match ? Number(match[1]) : 0;
  return resolveExpressionText(event.reason, isObserverJoiner, variantIndex);
}
