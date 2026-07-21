import { useState } from "react";
import { runMonteCarlo } from "../simulation/monteCarlo";
import { getPresetById, presetName } from "../simulation/presets";
import { getInterventionById, interventionName } from "../simulation/interventions";
import type { InterventionScenarioId } from "../simulation/interventions";
import type { MonteCarloResult, ObserverJoinerRunSummary, SimParams } from "../simulation/types";
import { isSameCondition, isValidRunCount, MAX_RUNS, MIN_RUNS } from "./monteCarloPanelHelpers";
import type { RunConditionSnapshot } from "./monteCarloPanelHelpers";
import { useLang } from "../i18n/lang";
import { agentStateLabel } from "../i18n/labels";

type Props = {
  presetId: string;
  params: SimParams;
  seed: number;
  interventionId: InterventionScenarioId;
  singleSimRunning: boolean;
  onBeforeRun: () => void;
};

const DEFAULT_RUN_COUNT = 30;

const UI = {
  en: {
    title: "Monte Carlo run",
    runsLabel: `Number of runs (${MIN_RUNS}–${MAX_RUNS})`,
    error: `Enter the number of runs as an integer from ${MIN_RUNS} to ${MAX_RUNS}.`,
    pauseNote: "Running this will pause the single simulation.",
    runButton: (n: string, seed: number) => `Run ${n}× (baseSeed ${seed}+)`,
    empty: "Run Monte Carlo on the current conditions to see the probabilistic tendencies.",
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `Conditions: ${preset} / intervention: ${interv} / baseSeed ${a}–${b} (${runs} runs)`,
    stale: "These results are from different conditions. Re-run to update to the latest conditions.",
    joinRate: "observerJoiner join rate",
    leaveRate: "observerJoiner leave rate",
    groupFailure: "Group-failure rate",
    avgConfirmedTick: "Avg. group-confirmed tick",
    lateJoin: "Late-join success rate",
    avgJoined: "Avg. joined count",
    avgLeft: "Avg. left count",
    individualRuns: "Individual runs",
    groups: (n: number) => `${n} groups`,
  },
  ja: {
    title: "Monte Carlo実行",
    runsLabel: `実行回数（${MIN_RUNS}〜${MAX_RUNS}）`,
    error: `実行回数は${MIN_RUNS}〜${MAX_RUNS}の整数で指定してください。`,
    pauseNote: "実行すると、単発シミュレーションは一時停止します。",
    runButton: (n: string, seed: number) => `${n}回実行（baseSeed ${seed}〜）`,
    empty: "現在の条件でMonte Carloを実行すると、確率的傾向を確認できます。",
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `条件: ${preset} / 介入: ${interv} / baseSeed ${a}〜${b} (${runs}回)`,
    stale: "現在の条件と異なる結果です。再実行すると最新の条件で更新されます。",
    joinRate: "observerJoiner参加率",
    leaveRate: "observerJoiner離脱率",
    groupFailure: "グループ不成立率",
    avgConfirmedTick: "平均グループ成立tick",
    lateJoin: "後乗り成功率",
    avgJoined: "平均参加人数",
    avgLeft: "平均帰宅人数",
    individualRuns: "個別run一覧",
    groups: (n: number) => `${n}グループ`,
  },
} as const;

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
  const { lang } = useLang();
  const t = UI[lang];
  const [runCountInput, setRunCountInput] = useState(String(DEFAULT_RUN_COUNT));
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [resultCondition, setResultCondition] = useState<RunConditionSnapshot | null>(null);
  const [resultPresetId, setResultPresetId] = useState<string>(presetId);
  const [resultInterventionId, setResultInterventionId] = useState<InterventionScenarioId>(interventionId);

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
    setResultPresetId(presetId);
    setResultInterventionId(interventionId);
  };

  return (
    <div className="panel monte-carlo-panel">
      <h2>{t.title}</h2>

      <label className="field">
        <span>{t.runsLabel}</span>
        <input
          type="number"
          min={MIN_RUNS}
          max={MAX_RUNS}
          value={runCountInput}
          onChange={(e) => setRunCountInput(e.target.value)}
        />
      </label>
      {!runCountValid && <p className="monte-carlo-error">{t.error}</p>}

      {singleSimRunning && <p className="monte-carlo-note">{t.pauseNote}</p>}

      <button type="button" onClick={handleRun} disabled={!runCountValid}>
        {t.runButton(runCountInput, seed)}
      </button>

      {result === null ? (
        <p className="monte-carlo-empty">{t.empty}</p>
      ) : (
        <>
          <p className="monte-carlo-condition">
            {t.condition(
              presetName(getPresetById(resultPresetId), lang),
              interventionName(getInterventionById(resultInterventionId), lang),
              result.config.baseSeed,
              result.config.baseSeed + result.config.runs - 1,
              result.config.runs,
            )}
          </p>
          {isStale && <p className="monte-carlo-stale">{t.stale}</p>}

          <section className="monte-carlo-summary">
            <div className="monte-carlo-summary-row">
              <span>{t.joinRate}</span>
              <span>{formatRate(result.summary.observerJoinerJoinRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.leaveRate}</span>
              <span>{formatRate(result.summary.observerJoinerLeaveRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.groupFailure}</span>
              <span>{formatRate(result.summary.groupFailureRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.avgConfirmedTick}</span>
              <span>{formatOptionalTick(result.summary.averageFirstGroupConfirmedTick)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.lateJoin}</span>
              <span>{formatRate(result.summary.lateJoinSuccessRate)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.avgJoined}</span>
              <span>{formatAverage(result.summary.averageJoinedCount)}</span>
            </div>
            <div className="monte-carlo-summary-row">
              <span>{t.avgLeft}</span>
              <span>{formatAverage(result.summary.averageLeftCount)}</span>
            </div>
          </section>

          <section className="monte-carlo-runs">
            <h3>{t.individualRuns}</h3>
            <div className="monte-carlo-runs-list">
              {result.runs.map((run) => (
                <div className="monte-carlo-run-row" key={run.seed}>
                  <span>seed {run.seed}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => agentStateLabel(o.finalState, lang))}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => formatTick(o.joinedTick))}</span>
                  <span>{summarizeObservers(run.summary.observerJoiners, (o) => formatTick(o.leftTick))}</span>
                  <span>{formatTick(run.summary.firstGroupConfirmedTick)}</span>
                  <span>{t.groups(run.summary.confirmedGroupCount)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
