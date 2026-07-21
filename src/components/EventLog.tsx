import { useEffect, useMemo, useRef, useState } from "react";
import type { LogTag, SimulationState } from "../simulation/types";
import type { SpeechEvent } from "../simulation/speech";
import { buildAgentLabelMap, formatSpeechDebugMeta, formatSpeechLogMessage } from "./speechDisplay";
import { formatEffectLine, formatInterpretationFactorLine, formatInterpretationLine } from "./speechEffectsDisplay";
import { useLang } from "../i18n/lang";
import type { Lang } from "../i18n/types";

type FilterKey = "all" | "observerJoiner" | "nucleus" | "groupConfirmed" | "leave" | "speech" | "speechEffect";

const FILTERS: Array<{ key: FilterKey; label: Record<Lang, string>; tag?: LogTag }> = [
  { key: "all", label: { en: "All events", ja: "全ログ" } },
  { key: "observerJoiner", label: { en: "observerJoiner only", ja: "observerJoinerのみ" }, tag: "observerJoiner" },
  { key: "nucleus", label: { en: "Core-forming events only", ja: "核形成イベントのみ" }, tag: "nucleus" },
  { key: "groupConfirmed", label: { en: "Group-confirmed events only", ja: "グループ成立イベントのみ" }, tag: "groupConfirmed" },
  { key: "leave", label: { en: "Leave events only", ja: "離脱イベントのみ" }, tag: "leave" },
  { key: "speech", label: { en: "Speech only", ja: "発言のみ" } },
  { key: "speechEffect", label: { en: "Speech effects only", ja: "発言効果のみ" } },
];

const UI = {
  en: {
    title: "Event log",
    show: "Show:",
    truncated: (shown: number, total: number) => `Showing only the latest ${shown} of ${total}.`,
    showAll: "Show all",
    empty: "No events yet.",
    noMatch: "No matching log entries.",
    factorBreakdown: "Interpretation factor breakdown",
  },
  ja: {
    title: "状態ログ",
    show: "表示:",
    truncated: (shown: number, total: number) => `直近${shown}件のみ表示中(全${total}件)。`,
    showAll: "すべて表示",
    empty: "まだイベントはありません。",
    noMatch: "該当するログはありません。",
    factorBreakdown: "解釈のfactor内訳",
  },
} as const;

// 発言効果(解釈/効果)の行が一度に大量になっても操作を妨げないよう、既定では末尾からこの件数だけ表示する
// (Issue #98の受入条件: 「長い履歴の折りたたみ・件数上限等を設け、既存観察UIを妨げない」)。
const ROW_DISPLAY_LIMIT = 200;

/**
 * 状態ログ(検証可能な出来事の記録)・発言ログ(`SpeechEvent`)・Phase 3の解釈/効果ログを
 * tick順にまとめた1行分の表示データ。`kind`で由来を判別できるようにし、発言/発言効果側には
 * 表示文言と別に構造化属性を確認できる補足行(meta)を持たせる(Issue #81/#98: 心の声/通常状態ログ/
 * 発言/発言効果をログ上で区別できることが目的)。認知(`SpeechReceptionEvent`)は、圏外を含め
 * 全agentに対して生成されうるため件数が跳ね上がりやすく、この時系列には含めない
 * (観察者ごとの認知/非認知の詳細はObserverJoinerInspector側で確認する)。
 */
type TimelineRow =
  | { kind: "state"; key: string; tick: number; message: string; tags: LogTag[] }
  | { kind: "speech"; key: string; tick: number; message: string; meta: string }
  | { kind: "speechInterpretation"; key: string; tick: number; message: string; meta: string }
  | { kind: "speechEffect"; key: string; tick: number; message: string; meta: string };

type Props = {
  state: SimulationState;
};

function buildTimeline(state: SimulationState, labelById: Map<string, string>, lang: Lang): TimelineRow[] {
  const stateRows: TimelineRow[] = state.log.map((entry, i) => ({
    kind: "state",
    key: `state-${entry.tick}-${i}`,
    tick: entry.tick,
    message: entry.message,
    tags: entry.tags,
  }));
  const speechLog: SpeechEvent[] = state.speechLog ?? [];
  const speechRows: TimelineRow[] = speechLog.map((event) => ({
    kind: "speech",
    key: event.id,
    tick: event.tick,
    message: formatSpeechLogMessage(event, labelById, lang),
    meta: formatSpeechDebugMeta(event, labelById),
  }));
  const interpretationRows: TimelineRow[] = (state.speechInterpretationLog ?? []).map((interpretation) => ({
    kind: "speechInterpretation",
    key: interpretation.id,
    tick: interpretation.tick,
    message: formatInterpretationLine(interpretation, labelById, lang),
    meta: interpretation.factors.map((factor) => formatInterpretationFactorLine(factor, lang)).join(" / "),
  }));
  const effectRows: TimelineRow[] = (state.speechEffectLog ?? []).map((effect) => ({
    kind: "speechEffect",
    key: effect.id,
    tick: effect.occurredTick,
    message: formatEffectLine(effect, labelById, lang),
    meta: `speechEventId: ${effect.speechEventId} / reason: ${effect.reason} / speaker: ${labelById.get(effect.speakerId) ?? effect.speakerId}`,
  }));
  // 状態ログ→発言ログ→解釈ログ→効果ログの順に連結してからtickだけでソートする(Array#sortは
  // 安定ソートのため、同一tick内では連結順、各配列内は元の発生順という決定的な順序が保たれる)。
  return [...stateRows, ...speechRows, ...interpretationRows, ...effectRows].sort((a, b) => a.tick - b.tick);
}

export function EventLog({ state }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showAllRows, setShowAllRows] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const labelById = useMemo(() => buildAgentLabelMap(state.agents), [state.agents]);
  const timeline = useMemo(() => buildTimeline(state, labelById, lang), [state, labelById, lang]);

  const activeTag = FILTERS.find((f) => f.key === filter)?.tag;
  const filteredRows = useMemo(() => {
    if (filter === "all") return timeline;
    if (filter === "speech") return timeline.filter((row) => row.kind === "speech");
    if (filter === "speechEffect") {
      return timeline.filter((row) => row.kind === "speechInterpretation" || row.kind === "speechEffect");
    }
    return timeline.filter((row) => row.kind === "state" && activeTag !== undefined && row.tags.includes(activeTag));
  }, [timeline, filter, activeTag]);

  const isTruncated = !showAllRows && filteredRows.length > ROW_DISPLAY_LIMIT;
  const visibleRows = isTruncated ? filteredRows.slice(-ROW_DISPLAY_LIMIT) : filteredRows;

  // フィルタ変更・ログ追加のいずれでも、表示中のリスト末尾に追従させる。
  // scrollIntoViewはスクロール可能な祖先(モバイル1カラム時はページ全体)まで
  // スクロールさせ、初回表示やログ追加のたびにページが状態ログへ飛んでしまうため、
  // リスト自身のscrollTopだけを動かす。
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [visibleRows.length, filter]);

  // フィルタを切り替えるたびに、直近件数のみの表示へ戻す(すべて表示ボタンは現在のフィルタ限定)
  useEffect(() => {
    setShowAllRows(false);
  }, [filter]);

  return (
    <div className="panel event-log">
      <h2>{t.title}</h2>
      <div className="event-log-filters">
        <label className="event-log-filter-label" htmlFor="event-log-filter-select">
          {t.show}
        </label>
        <select
          id="event-log-filter-select"
          className="event-log-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterKey)}
        >
          {FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label[lang]}
            </option>
          ))}
        </select>
      </div>
      {isTruncated && (
        <p className="event-log-truncation-notice">
          {t.truncated(ROW_DISPLAY_LIMIT, filteredRows.length)}
          <button type="button" className="event-log-show-all-button" onClick={() => setShowAllRows(true)}>
            {t.showAll}
          </button>
        </p>
      )}
      <div className="event-log-list" ref={listRef}>
        {visibleRows.length === 0 && (
          <p className="event-log-empty">
            {timeline.length === 0 ? t.empty : t.noMatch}
          </p>
        )}
        {visibleRows.map((row) =>
          row.kind === "speech" ? (
            <div key={row.key} className="event-log-entry event-log-entry--speech">
              <div className="event-log-entry-message">💬 {row.message}</div>
              <div className="event-log-entry-meta">{row.meta}</div>
            </div>
          ) : row.kind === "speechInterpretation" ? (
            <div key={row.key} className="event-log-entry event-log-entry--speech-effect">
              <div className="event-log-entry-message">🧠 {row.message}</div>
              <details className="event-log-entry-meta-details">
                <summary>{t.factorBreakdown}</summary>
                <div className="event-log-entry-meta">{row.meta}</div>
              </details>
            </div>
          ) : row.kind === "speechEffect" ? (
            <div key={row.key} className="event-log-entry event-log-entry--speech-effect">
              <div className="event-log-entry-message">⚡ {row.message}</div>
              <div className="event-log-entry-meta">{row.meta}</div>
            </div>
          ) : (
            <div key={row.key} className="event-log-entry">
              {row.message}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
