import { buildSimulationSummary } from "../simulation/summary";
import type { AgentState, ObserverJoinerRunSummary, SimulationState } from "../simulation/types";
import { useLang } from "../i18n/lang";
import type { Lang } from "../i18n/types";
import { agentStateLabel } from "../i18n/labels";

type Props = {
  state: SimulationState;
};

const AGENT_STATE_ORDER: AgentState[] = ["undecided", "forming", "approaching", "joined", "leaving", "left"];

const UI = {
  en: {
    title: "Final summary",
    provisional: "Provisional tally as of now",
    endState: "End state",
    status: "Status",
    finished: "finished",
    running: "running",
    finishedAtTick: "Finished at tick",
    headCount: "Head count",
    joined: "Joined",
    left: "Left",
    observerSummary: "observerJoiner summary",
    noObserver: "There is no observerJoiner.",
    groupSummary: "Group formation summary",
    firstNucleus: "First core-forming tick",
    firstConfirmed: "First group-confirmed tick",
    confirmedCount: "Confirmed group count",
    groupFailed: "Group failed to form",
    yes: "yes",
    no: "no",
    joinedAtTick: "joined at tick",
    joinedWhere: "joined",
    leaveStartedTick: "leave-started tick",
    leftAtTick: "left at tick",
    lateJoin: "late-join success",
    lateJoinYes: "yes",
    notOccurred: "not yet",
    notJoined: "not joined",
    notLeft: "not left",
    confirmedGroup: "confirmed group",
    formingCircle: "forming circle",
  },
  ja: {
    title: "終了サマリー",
    provisional: "現在時点の暫定集計",
    endState: "終了状態",
    status: "状態",
    finished: "終了済み",
    running: "実行中",
    finishedAtTick: "終了tick",
    headCount: "人数サマリー",
    joined: "参加人数",
    left: "帰宅人数",
    observerSummary: "observerJoinerサマリー",
    noObserver: "observerJoinerがいません。",
    groupSummary: "グループ形成サマリー",
    firstNucleus: "最初の核形成tick",
    firstConfirmed: "最初のグループ成立tick",
    confirmedCount: "成立グループ数",
    groupFailed: "グループ不成立",
    yes: "はい",
    no: "いいえ",
    joinedAtTick: "参加tick",
    joinedWhere: "参加先",
    leaveStartedTick: "離脱開始tick",
    leftAtTick: "帰宅完了tick",
    lateJoin: "後乗り成功",
    lateJoinYes: "成功",
    notOccurred: "未発生",
    notJoined: "未参加",
    notLeft: "未離脱",
    confirmedGroup: "成立済みグループ",
    formingCircle: "未確定の輪",
  },
} as const;

type UiText = (typeof UI)[Lang];

function formatTick(tick: number | undefined, placeholder: string): string {
  return tick === undefined ? placeholder : `tick ${tick}`;
}

function joinedGroupKindLabel(summary: ObserverJoinerRunSummary, t: UiText): string {
  if (summary.joinedTick === undefined) return t.notJoined;
  return summary.joinedGroupStatus === "confirmed" ? t.confirmedGroup : t.formingCircle;
}

function ObserverJoinerSummaryCard({ summary, lang, t }: { summary: ObserverJoinerRunSummary; lang: Lang; t: UiText }) {
  return (
    <div className="simulation-summary-card">
      <div className="simulation-summary-row simulation-summary-row--header">
        <span className="simulation-summary-label-name">{summary.label}</span>
        <span className="simulation-summary-state">{agentStateLabel(summary.finalState, lang)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>{t.joinedAtTick}</span>
        <span>{formatTick(summary.joinedTick, t.notJoined)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>{t.joinedWhere}</span>
        <span>{joinedGroupKindLabel(summary, t)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>{t.leaveStartedTick}</span>
        <span>{formatTick(summary.leaveStartedTick, t.notLeft)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>{t.leftAtTick}</span>
        <span>{formatTick(summary.leftTick, t.notLeft)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>{t.lateJoin}</span>
        <span>{summary.lateJoinSucceeded ? t.lateJoinYes : t.no}</span>
      </div>
    </div>
  );
}

export function SimulationSummaryPanel({ state }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  const summary = buildSimulationSummary(state);

  return (
    <div className="panel simulation-summary">
      <h2>{t.title}</h2>
      {!summary.finished && <p className="simulation-summary-provisional">{t.provisional}</p>}

      <section className="simulation-summary-section">
        <h3>{t.endState}</h3>
        <div className="simulation-summary-row">
          <span>{t.status}</span>
          <span>{summary.finished ? t.finished : t.running}</span>
        </div>
        <div className="simulation-summary-row">
          <span>{t.finishedAtTick}</span>
          <span>{formatTick(summary.finishedTick, t.notOccurred)}</span>
        </div>
      </section>

      <section className="simulation-summary-section">
        <h3>{t.headCount}</h3>
        <div className="simulation-summary-row">
          <span>{t.joined}</span>
          <span>{summary.joinedCount}</span>
        </div>
        <div className="simulation-summary-row">
          <span>{t.left}</span>
          <span>{summary.leftCount}</span>
        </div>
        {AGENT_STATE_ORDER.map((agentState) => (
          <div className="simulation-summary-row" key={agentState}>
            <span>{agentStateLabel(agentState, lang)}</span>
            <span>{summary.stateCounts[agentState]}</span>
          </div>
        ))}
      </section>

      <section className="simulation-summary-section">
        <h3>{t.observerSummary}</h3>
        {summary.observerJoiners.length === 0 ? (
          <p className="simulation-summary-empty">{t.noObserver}</p>
        ) : (
          summary.observerJoiners.map((observer) => (
            <ObserverJoinerSummaryCard key={observer.agentId} summary={observer} lang={lang} t={t} />
          ))
        )}
      </section>

      <section className="simulation-summary-section">
        <h3>{t.groupSummary}</h3>
        <div className="simulation-summary-row">
          <span>{t.firstNucleus}</span>
          <span>{formatTick(summary.firstNucleusTick, t.notOccurred)}</span>
        </div>
        <div className="simulation-summary-row">
          <span>{t.firstConfirmed}</span>
          <span>{formatTick(summary.firstGroupConfirmedTick, t.notOccurred)}</span>
        </div>
        <div className="simulation-summary-row">
          <span>{t.confirmedCount}</span>
          <span>{summary.confirmedGroupCount}</span>
        </div>
        <div className="simulation-summary-row">
          <span>{t.groupFailed}</span>
          <span>{summary.groupFailure ? t.yes : t.no}</span>
        </div>
      </section>
    </div>
  );
}
