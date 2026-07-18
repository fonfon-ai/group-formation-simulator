/**
 * 心の声吹き出しの、テキスト折り返しと画面内配置(はみ出し補正)を計算する純粋関数群。
 * SimulationCanvasのSVG座標系(state.width/height, agent.x/y)にそのまま乗る値を返す前提で、
 * DOM計測(getBoundingClientRect等)には依存しない。折り返しは単語(スペース)境界を優先し、
 * 1単語が1行に収まらない場合のみ文字単位でハードブレークする。
 */

const MAX_CHARS_PER_LINE = 16;
const MAX_LINES = 3;
const CHAR_WIDTH_PX = 7;
const LINE_HEIGHT_PX = 13;
const PADDING_X_PX = 8;
const PADDING_Y_PX = 7;
const MAX_BUBBLE_WIDTH_PX = 140;
/** Canvas端からの最小マージン */
const EDGE_MARGIN_PX = 6;
/** 吹き出し下端とエージェント本体(円)の間の隙間。agent-labelがagent.y - r - 4付近に描画されるため、
 * それより上に出るだけの余白を確保する */
const GAP_ABOVE_AGENT_PX = 20;

export type ThoughtBubbleLayout = {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  lines: string[];
  /** 吹き出しが実際に指し示すべきエージェント上の座標(しっぽの先端) */
  tailX: number;
  tailY: number;
};

/** 簡易配置の候補位置。完全な物理レイアウトエンジンは導入せず、この4方向だけを試す */
export type ThoughtBubbleSide = "above" | "below" | "left" | "right";

const PLACEMENT_SIDES: readonly ThoughtBubbleSide[] = ["above", "below", "right", "left"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * テキストを単語(スペース)境界優先で`maxCharsPerLine`ごとに折り返し、`maxLines`を超える場合は
 * 最終行を省略記号で切り詰める。1単語が1行に収まらない場合のみ文字単位でハードブレークする。
 * 空文字列/空白のみを渡された場合は1行の空文字列を返す(呼び出し側で0行を特別扱いしなくてよいように)。
 */
export function wrapThoughtText(
  text: string,
  maxCharsPerLine: number = MAX_CHARS_PER_LINE,
  maxLines: number = MAX_LINES,
): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  const flush = () => {
    if (current.length > 0) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    let remaining = word;
    // 1行に収まらない長い単語は文字単位でハードブレークする。
    while (remaining.length > maxCharsPerLine) {
      flush();
      lines.push(remaining.slice(0, maxCharsPerLine));
      remaining = remaining.slice(maxCharsPerLine);
    }
    if (current.length === 0) {
      current = remaining;
    } else if (current.length + 1 + remaining.length <= maxCharsPerLine) {
      current += ` ${remaining}`;
    } else {
      flush();
      current = remaining;
    }
  }
  flush();

  if (lines.length <= maxLines) return lines.length > 0 ? lines : [""];

  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] =
    last.length >= maxCharsPerLine ? `${last.slice(0, Math.max(maxCharsPerLine - 1, 0))}…` : `${last}…`;
  return kept;
}

export type ThoughtBubbleLayoutInput = {
  agentX: number;
  agentY: number;
  agentRadius: number;
  text: string;
  canvasWidth: number;
  canvasHeight: number;
};

/**
 * エージェント座標を起点に、Canvas外へはみ出しにくい吹き出し位置を計算する。
 * `side`省略時(="above")は「エージェントの真上」が基本方針で、上に十分な余白がなければ
 * 下側に自動で切り替える。`side`を明示すると、`computeThoughtBubbleLayouts`が
 * 近接する複数吹き出し同士の重なりを避けるための候補位置として使う。
 * 左右/上下の端はCanvas内に収まるようクランプする(それでも入りきらない極端なケースでは
 * 吹き出しがエージェントから離れうるため、tailX/tailYで常に実座標を指し示す)。
 */
export function computeThoughtBubbleLayout(
  { agentX, agentY, agentRadius, text, canvasWidth, canvasHeight }: ThoughtBubbleLayoutInput,
  side: ThoughtBubbleSide = "above",
): ThoughtBubbleLayout {
  const lines = wrapThoughtText(text);
  const longestLine = Math.max(...lines.map((line) => line.length), 1);
  const boxWidth = Math.min(MAX_BUBBLE_WIDTH_PX, PADDING_X_PX * 2 + longestLine * CHAR_WIDTH_PX);
  const boxHeight = PADDING_Y_PX * 2 + lines.length * LINE_HEIGHT_PX;

  if (side === "left" || side === "right") {
    const boxY = clamp(agentY - boxHeight / 2, EDGE_MARGIN_PX, canvasHeight - EDGE_MARGIN_PX - boxHeight);
    const preferredX =
      side === "left"
        ? agentX - agentRadius - GAP_ABOVE_AGENT_PX - boxWidth
        : agentX + agentRadius + GAP_ABOVE_AGENT_PX;
    const boxX = clamp(preferredX, EDGE_MARGIN_PX, canvasWidth - EDGE_MARGIN_PX - boxWidth);
    return {
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      lines,
      tailX: side === "left" ? agentX - agentRadius : agentX + agentRadius,
      tailY: agentY,
    };
  }

  const preferredAboveY = agentY - agentRadius - GAP_ABOVE_AGENT_PX - boxHeight;
  const canPlaceAbove = preferredAboveY >= EDGE_MARGIN_PX;
  const placeAbove = side === "above" ? canPlaceAbove : false;
  const boxY = placeAbove
    ? clamp(preferredAboveY, EDGE_MARGIN_PX, canvasHeight - EDGE_MARGIN_PX - boxHeight)
    : clamp(agentY + agentRadius + GAP_ABOVE_AGENT_PX, EDGE_MARGIN_PX, canvasHeight - EDGE_MARGIN_PX - boxHeight);
  const boxX = clamp(agentX - boxWidth / 2, EDGE_MARGIN_PX, canvasWidth - EDGE_MARGIN_PX - boxWidth);

  return {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    lines,
    tailX: agentX,
    tailY: agentY - agentRadius,
  };
}

function boxesOverlap(a: ThoughtBubbleLayout, b: ThoughtBubbleLayout): boolean {
  return (
    a.boxX < b.boxX + b.boxWidth &&
    a.boxX + a.boxWidth > b.boxX &&
    a.boxY < b.boxY + b.boxHeight &&
    a.boxY + a.boxHeight > b.boxY
  );
}

export type ThoughtBubblePlacementInput = ThoughtBubbleLayoutInput & { agentId: string };

/**
 * 複数の吹き出しを一括配置し、近接エージェント間の重なりを軽減する。
 * `inputs`の並び順を優先順位として扱い(呼び出し側で重要な吹き出しを先に渡す想定)、
 * 各吹き出しは`PLACEMENT_SIDES`の順で「まだ配置済みのどれとも重ならない」候補を探す。
 * 全候補が重なる場合は`computeThoughtBubbleLayout`の既定(above/below自動)にフォールバックする
 * (完全な衝突回避エンジンではないため、密集時の重なりを完全には保証しない)。
 */
export function computeThoughtBubbleLayouts(
  inputs: ThoughtBubblePlacementInput[],
): Map<string, ThoughtBubbleLayout> {
  const placed: ThoughtBubbleLayout[] = [];
  const result = new Map<string, ThoughtBubbleLayout>();

  for (const input of inputs) {
    let chosen: ThoughtBubbleLayout | undefined;
    for (const side of PLACEMENT_SIDES) {
      const candidate = computeThoughtBubbleLayout(input, side);
      if (!placed.some((box) => boxesOverlap(candidate, box))) {
        chosen = candidate;
        break;
      }
    }
    const layout = chosen ?? computeThoughtBubbleLayout(input);
    placed.push(layout);
    result.set(input.agentId, layout);
  }

  return result;
}
