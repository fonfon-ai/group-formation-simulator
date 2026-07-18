import { useState } from "react";
import { runMonteCarlo } from "../simulation/monteCarlo";
import { getPresetById } from "../simulation/presets";
import { getInterventionById } from "../simulation/interventions";
import type { InterventionScenarioId } from "../simulation/interventions";
import type { AgentState, MonteCarloResult, ObserverJoinerRunSummary, SimParams } from "../simulation/types";
import { isSameCondition, isValidRunCount, MAX_RUNS, MIN_RUNS } from "./monteCarloPanelHelpers";
import type { RunConditionSnapshot } from "./monteCarloPanelHelpers";

type Props = {
  presetId: string;
  params: SimParams;
  seed: number;
  interventionId: InterventionScenarioId;
  singleSimRunning: boolean;
  onBeforeRun: () => void;
};

const DEFAULT_RUN_COUNT = 30;

const AGENT_STATE_LABEL: Record<AgentState, string> = {
  undecided: "Undecided",
  forming: "Forming a circle",
  approaching: "Approaching",
  joined: "Joined",
  leaving: "Leaving",
  left: "Left",
};

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatAverage(value: number): string {
  return value.toFixed(1);
}

function formatOptionalTick(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(1);
}

function formatTick(value: number | undefined): string {
  return value === undefined ? "—" : `tick ${value}`;
}

function summarizeObservers(
  observers: ObserverJoinerRunSummary[],
  render: (observer: ObserverJoinerRunSummary) => string,
): string {
  if (observers.length === 0) return "—";
  return observers.map(render).join(" / ");
}

export function MonteCarloPanel({ presetId, params, seed, interventionId, singleSimRunning, onBeforeRun }: Props) {
  const [runCountInput, setRunCountInput] = useState(String(DEFAULT_RUN_COUNT));
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [resultCondition, setResultCondition] = useState<RunConditionSnapshot | null>(null);
  const [resultPresetName, setResultPresetName] = useState("");
  const [resultInterventionName, setResultInterventionName] = useState("");

  const runCount = Number(runCountInput);
  const runCountValid = isValidRunCount(runCount);

  const currentCondition: RunConditionSnapshot = { presetId, seed, params, interventionId };
  const isStale = result !== null && resultCondition !== null && !isSameCondition(currentCondition, resultCondition);

  const handleRun = () => {
    if (!runCountValid) return;
    onBeforeRun();
    const monteCarloResult = runMonteCarlo({
      baseSeed: seed,
      runs: runCount,
      params,
      intervention: { interventionId },
    });
    setResult(monteCarloResult);
    setResultCondition(currentCondition);
    setResultPresetName(getPresetById(presetId).name);
    setResultInterventionName(getInterventionById(interventionId).name);
  };

  return (
    <div className="panel monte-carlo-panel">
      <h2>Monte Carlo run</h2>

      <label className="field">
        <span>
          Number of runs ({MIN_RUNS}–{MAX_RUNS})
        </span>
        <input
          type="number"
          min={MIN_RUNS}
          max={MAX_RUNS}
          value={runCountInput}
          onChange={(e) => setRunCountInput(e.target.value)}
        />
      </label>
      {!runCountValid && (
        <p className="monte-carlo-error">
          Enter the number of runs as an integer from {MIN_RUNS} to {MAX_RUNS}.
        </p>
      )}

      {singleSimRunning && (
        <p className="monte-carlo-note">Running this will pause the single simulation.</p>
      )}

      <button type="button" onClick={handleRun} disabled={!runCountValid}>
        Run {runCountInput}× (baseSeed {seed}+)
      </button>

      {result === null ? (
        <p className="monte-carlo-empty">
          Run Monte Carlo on the current conditions to see the probabilistic tendencies.
        </p>
      ) : (
        <>
          <p className="monte-carlo-condition">
            Conditions: {resultPresetName} / intervention: {resultInterventionName} / baseSeed {result.config.baseSeed}–
            {result.config.baseSeed + result.config.runs - 1} ({result.config.runs} runs)
          </p>
          {isStale && (
            <p className="monte-carlo-stale">
              These results are from different conditions. Re-run to update to the latest conditions.
            </p>
          )}

          <section className="monte-carlo-summary">
            <div className="monte-carlo-summary-row">
              <span>observerJoiner join rate</span>
              <span>{formatRate(result.summary.observerJoinerJoinRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>observerJoiner leave rate</span>
              <span>{formatRate(result.summary.observerJoinerLeaveRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>Group-failure rate</span>
              <span>{formatRate(result.summary.groupFailureRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>Avg. group-confirmed tick</span>
              <span>{formatOptionalTick(result.summary.averageFirstGroupConfirmedTick)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>Late-join success rate</span>
              <span>{formatRate(result.summary.lateJoinSuccessRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>Avg. joined count</span>
              <span>{formatAverage(result.summary.averageJoinedCount)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>Avg. left count</span>
              <span>{formatAverage(result.summary.averageLeftCount)}</span>
            </div>
          </section>

          <section className="monte-carlo-runs">
            <h3>Individual runs</h3>
            <div className="monte-carlo-runs-list">
              {result.runs.map((run) => (
                <div className="monte-carlo-run-row" key={run.seed}>
                  <span>seed {run.seed}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => AGENT_STATE_LABEL[o.finalState])}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => formatTick(o.joinedTick))}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => formatTick(o.leftTick))}</span>
                  <span>{formatTick(run.summary.firstGroupConfirmedTick)}</span>
                  <span>{run.summary.confirmedGroupCount} groups</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
