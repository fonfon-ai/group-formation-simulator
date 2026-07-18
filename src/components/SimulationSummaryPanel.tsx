import { buildSimulationSummary } from "../simulation/summary";
import type { AgentState, ObserverJoinerRunSummary, SimulationState } from "../simulation/types";

type Props = {
  state: SimulationState;
};

const AGENT_STATE_LABEL: Record<AgentState, string> = {
  undecided: "Undecided",
  forming: "Forming a circle",
  approaching: "Approaching",
  joined: "Joined",
  leaving: "Leaving",
  left: "Left",
};

const AGENT_STATE_ORDER: AgentState[] = ["undecided", "forming", "approaching", "joined", "leaving", "left"];

const NOT_OCCURRED = "not yet";
const NOT_JOINED = "not joined";
const NOT_LEFT = "not left";

function formatTick(tick: number | undefined, placeholder: string): string {
  return tick === undefined ? placeholder : `tick ${tick}`;
}

function joinedGroupKindLabel(summary: ObserverJoinerRunSummary): string {
  if (summary.joinedTick === undefined) return NOT_JOINED;
  return summary.joinedGroupStatus === "confirmed" ? "confirmed group" : "forming circle";
}

function ObserverJoinerSummaryCard({ summary }: { summary: ObserverJoinerRunSummary }) {
  return (
    <div className="simulation-summary-card">
      <div className="simulation-summary-row simulation-summary-row--header">
        <span className="simulation-summary-label-name">{summary.label}</span>
        <span className="simulation-summary-state">{AGENT_STATE_LABEL[summary.finalState]}</span>
      </div>
      <div className="simulation-summary-row">
        <span>joined at tick</span>
        <span>{formatTick(summary.joinedTick, NOT_JOINED)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>joined</span>
        <span>{joinedGroupKindLabel(summary)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>leave-started tick</span>
        <span>{formatTick(summary.leaveStartedTick, NOT_LEFT)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>left at tick</span>
        <span>{formatTick(summary.leftTick, NOT_LEFT)}</span>
      </div>
      <div className="simulation-summary-row">
        <span>late-join success</span>
        <span>{summary.lateJoinSucceeded ? "yes" : "no"}</span>
      </div>
    </div>
  );
}

export function SimulationSummaryPanel({ state }: Props) {
  const summary = buildSimulationSummary(state);

  return (
    <div className="panel simulation-summary">
      <h2>Final summary</h2>
      {!summary.finished && <p className="simulation-summary-provisional">Provisional tally as of now</p>}

      <section className="simulation-summary-section">
        <h3>End state</h3>
        <div className="simulation-summary-row">
          <span>Status</span>
          <span>{summary.finished ? "finished" : "running"}</span>
        </div>
        <div className="simulation-summary-row">
          <span>Finished at tick</span>
          <span>{formatTick(summary.finishedTick, NOT_OCCURRED)}</span>
        </div>
      </section>

      <section className="simulation-summary-section">
        <h3>Head count</h3>
        <div className="simulation-summary-row">
          <span>Joined</span>
          <span>{summary.joinedCount}</span>
        </div>
        <div className="simulation-summary-row">
          <span>Left</span>
          <span>{summary.leftCount}</span>
        </div>
        {AGENT_STATE_ORDER.map((agentState) => (
          <div className="simulation-summary-row" key={agentState}>
            <span>{AGENT_STATE_LABEL[agentState]}</span>
            <span>{summary.stateCounts[agentState]}</span>
          </div>
        ))}
      </section>

      <section className="simulation-summary-section">
        <h3>observerJoiner summary</h3>
        {summary.observerJoiners.length === 0 ? (
          <p className="simulation-summary-empty">There is no observerJoiner.</p>
        ) : (
          summary.observerJoiners.map((observer) => (
            <ObserverJoinerSummaryCard key={observer.agentId} summary={observer} />
          ))
        )}
      </section>

      <section className="simulation-summary-section">
        <h3>Group formation summary</h3>
        <div className="simulation-summary-row">
          <span>First core-forming tick</span>
          <span>{formatTick(summary.firstNucleusTick, NOT_OCCURRED)}</span>
        </div>
        <div className="simulation-summary-row">
          <span>First group-confirmed tick</span>
          <span>{formatTick(summary.firstGroupConfirmedTick, NOT_OCCURRED)}</span>
        </div>
        <div className="simulation-summary-row">
          <span>Confirmed group count</span>
          <span>{summary.confirmedGroupCount}</span>
        </div>
        <div className="simulation-summary-row">
          <span>Group failed to form</span>
          <span>{summary.groupFailure ? "yes" : "no"}</span>
        </div>
      </section>
    </div>
  );
}
