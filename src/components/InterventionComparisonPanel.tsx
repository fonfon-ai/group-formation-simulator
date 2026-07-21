import { useState } from "react";
import { compareMonteCarloIntervention } from "../simulation/monteCarlo";
import { getPresetById, presetName } from "../simulation/presets";
import { getInterventionById, interventionName } from "../simulation/interventions";
import type { InterventionScenarioId } from "../simulation/interventions";
import type { MonteCarloComparisonResult, SimParams } from "../simulation/types";
import { isSameCondition, isValidRunCount, MAX_RUNS, MIN_RUNS } from "./monteCarloPanelHelpers";
import type { RunConditionSnapshot } from "./monteCarloPanelHelpers";
import { useLang } from "../i18n/lang";
import { MC_METRIC_LABELS } from "../i18n/labels";

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
    title: "Comparison vs. no intervention",
    disabled:
      '"No intervention" is selected, so there\'s nothing to compare. Pick an intervention scenario to see its difference from no intervention here.',
    runsLabel: `Number of runs (${MIN_RUNS}–${MAX_RUNS})`,
    error: `Enter the number of runs as an integer from ${MIN_RUNS} to ${MAX_RUNS}.`,
    pauseNote: "Running this will pause the single simulation.",
    runButton: (seed: number) => `Compare against no intervention (baseSeed ${seed}+)`,
    emptyPrompt: (interv: string) =>
      `Run this to compare "No intervention" and "${interv}" under identical conditions (preset, parameters, baseSeed, run count).`,
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `Conditions: ${preset} / intervention: ${interv} (vs. no intervention) / baseSeed ${a}–${b} (${runs} runs)`,
    stale: "These results are from different conditions. Re-run to update to the latest conditions.",
    noIntervention: "No intervention",
    delta: "Delta",
  },
  ja: {
    title: "介入なしとの比較",
    disabled: "「介入なし」が選択されているため比較できません。介入シナリオを選択すると、介入なしとの差分をここで確認できます。",
    runsLabel: `実行回数（${MIN_RUNS}〜${MAX_RUNS}）`,
    error: `実行回数は${MIN_RUNS}〜${MAX_RUNS}の整数で指定してください。`,
    pauseNote: "実行すると、単発シミュレーションは一時停止します。",
    runButton: (seed: number) => `介入なしと比較して実行（baseSeed ${seed}〜）`,
    emptyPrompt: (interv: string) =>
      `実行すると、「介入なし」と「${interv}」を同一条件(プリセット・パラメータ・baseSeed・実行回数)で比較できます。`,
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `条件: ${preset} / 介入: ${interv}(介入なしと比較) / baseSeed ${a}〜${b} (${runs}回)`,
    stale: "現在の条件と異なる結果です。再実行すると最新の条件で更新されます。",
    noIntervention: "介入なし",
    delta: "差分",
  },
} as const;

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatRateDelta(delta: number): string {
  const pt = delta * 100;
  return `${pt > 0 ? "+" : ""}${pt.toFixed(1)}pt`;
}

function formatOptionalTick(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(1);
}

function formatOptionalTickDelta(delta: number | undefined): string {
  return delta === undefined ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}tick`;
}

function formatCount(value: number): string {
  return value.toFixed(1);
}

function formatCountDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
}

type MetricRowProps = {
  label: string;
  baseline: string;
  intervention: string;
  delta: string;
};

function MetricRow({ label, baseline, intervention, delta }: MetricRowProps) {
  return (
    <div className="intervention-comparison-row">
      <span>{label}</span>
      <span>{baseline}</span>
      <span>{intervention}</span>
      <span>{delta}</span>
    </div>
  );
}

export function InterventionComparisonPanel({
  presetId,
  params,
  seed,
  interventionId,
  singleSimRunning,
  onBeforeRun,
}: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  const [runCountInput, setRunCountInput] = useState(String(DEFAULT_RUN_COUNT));
  const [result, setResult] = useState<MonteCarloComparisonResult | null>(null);
  const [resultCondition, setResultCondition] = useState<RunConditionSnapshot | null>(null);
  const [resultPresetId, setResultPresetId] = useState<string>(presetId);
  const [resultInterventionId, setResultInterventionId] = useState<InterventionScenarioId>(interventionId);
  const [resultRuns, setResultRuns] = useState(0);

  const runCount = Number(runCountInput);
  const runCountValid = isValidRunCount(runCount);
  const isNone = interventionId === "none";

  const currentCondition: RunConditionSnapshot = { presetId, seed, params, interventionId };
  const isStale = result !== null && resultCondition !== null && !isSameCondition(currentCondition, resultCondition);

  const handleRun = () => {
    if (!runCountValid || isNone) return;
    onBeforeRun();
    const comparison = compareMonteCarloIntervention({
      baseSeed: seed,
      runs: runCount,
      params,
      intervention: { interventionId },
    });
    setResult(comparison);
    setResultCondition(currentCondition);
    setResultPresetId(presetId);
    setResultInterventionId(interventionId);
    setResultRuns(runCount);
  };

  const resultInterventionLabel = interventionName(getInterventionById(resultInterventionId), lang);

  return (
    <div className="panel monte-carlo-panel intervention-comparison-panel">
      <h2>{t.title}</h2>

      {isNone ? (
        <p className="monte-carlo-empty">{t.disabled}</p>
      ) : (
        <>
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
            {t.runButton(seed)}
          </button>

          {result === null ? (
            <p className="monte-carlo-empty">
              {t.emptyPrompt(interventionName(getInterventionById(interventionId), lang))}
            </p>
          ) : (
            <>
              <p className="monte-carlo-condition">
                {t.condition(
                  presetName(getPresetById(resultPresetId), lang),
                  resultInterventionLabel,
                  result.baseline.config.baseSeed,
                  result.baseline.config.baseSeed + resultRuns - 1,
                  resultRuns,
                )}
              </p>
              {isStale && <p className="monte-carlo-stale">{t.stale}</p>}

              <section className="intervention-comparison-summary">
                <div className="intervention-comparison-row intervention-comparison-header">
                  <span></span>
                  <span>{t.noIntervention}</span>
                  <span>{resultInterventionLabel}</span>
                  <span>{t.delta}</span>
                </div>
                <MetricRow
                  label={MC_METRIC_LABELS.observerJoinerJoinRate[lang]}
                  baseline={formatRate(result.metrics.observerJoinerJoinRate.baseline)}
                  intervention={formatRate(result.metrics.observerJoinerJoinRate.intervention)}
                  delta={formatRateDelta(result.metrics.observerJoinerJoinRate.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.observerJoinerLeaveRate[lang]}
                  baseline={formatRate(result.metrics.observerJoinerLeaveRate.baseline)}
                  intervention={formatRate(result.metrics.observerJoinerLeaveRate.intervention)}
                  delta={formatRateDelta(result.metrics.observerJoinerLeaveRate.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.groupFailureRate[lang]}
                  baseline={formatRate(result.metrics.groupFailureRate.baseline)}
                  intervention={formatRate(result.metrics.groupFailureRate.intervention)}
                  delta={formatRateDelta(result.metrics.groupFailureRate.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.averageFirstGroupConfirmedTick[lang]}
                  baseline={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.baseline)}
                  intervention={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.intervention)}
                  delta={formatOptionalTickDelta(result.metrics.averageFirstGroupConfirmedTick.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.lateJoinSuccessRate[lang]}
                  baseline={formatRate(result.metrics.lateJoinSuccessRate.baseline)}
                  intervention={formatRate(result.metrics.lateJoinSuccessRate.intervention)}
                  delta={formatRateDelta(result.metrics.lateJoinSuccessRate.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.averageJoinedCount[lang]}
                  baseline={formatCount(result.metrics.averageJoinedCount.baseline)}
                  intervention={formatCount(result.metrics.averageJoinedCount.intervention)}
                  delta={formatCountDelta(result.metrics.averageJoinedCount.delta)}
                />
                <MetricRow
                  label={MC_METRIC_LABELS.averageLeftCount[lang]}
                  baseline={formatCount(result.metrics.averageLeftCount.baseline)}
                  intervention={formatCount(result.metrics.averageLeftCount.intervention)}
                  delta={formatCountDelta(result.metrics.averageLeftCount.delta)}
                />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
