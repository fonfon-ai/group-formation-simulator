import { useState } from "react";
import { compareSpeechEffects } from "../simulation/speechEffectsMonteCarlo";
import { getPresetById, presetName } from "../simulation/presets";
import { getInterventionById, interventionName } from "../simulation/interventions";
import type { InterventionScenarioId } from "../simulation/interventions";
import type { SpeechEffectDimension } from "../simulation/speechEffects";
import type { SpeechEffectsComparisonResult, SimParams } from "../simulation/types";
import { isValidRunCount, MAX_RUNS, MIN_RUNS } from "./monteCarloPanelHelpers";
import {
  isSameSpeechEffectsComparisonCondition,
  type SpeechEffectsComparisonConditionSnapshot,
} from "./speechEffectsComparisonPanelHelpers";
import { useLang } from "../i18n/lang";
import { MC_METRIC_LABELS } from "../i18n/labels";
import type { Lang } from "../i18n/types";

type Props = {
  presetId: string;
  params: SimParams;
  seed: number;
  interventionId: InterventionScenarioId;
  singleSimRunning: boolean;
  onBeforeRun: () => void;
};

const DEFAULT_RUN_COUNT = 30;

const DIMENSION_LABEL: Record<SpeechEffectDimension, Record<Lang, string>> = {
  stress: { en: "Stress (greet)", ja: "ストレス(greet)" },
  attractiveness: { en: "Attractiveness (welcome)", ja: "魅力度(welcome)" },
  approachProbability: { en: "Approach probability (invite)", ja: "接近確率(invite)" },
  leaveThreshold: { en: "Leave threshold (decline)", ja: "離脱しきい値(decline)" },
};

const DIMENSIONS: SpeechEffectDimension[] = ["approachProbability", "attractiveness", "stress", "leaveThreshold"];

const UI = {
  en: {
    title: "Speech effects ON/OFF comparison",
    note: (interv: string) =>
      `Keeping the current preset, parameters, intervention (${interv}), and baseSeed fixed, this toggles only the Phase 3 speech effects (speech reception, interpretation, and state adjustments) OFF/ON and compares over the same seed sequence.`,
    runsLabel: `Number of runs (${MIN_RUNS}–${MAX_RUNS})`,
    error: `Enter the number of runs as an integer from ${MIN_RUNS} to ${MAX_RUNS}.`,
    pauseNote: "Running this will pause the single simulation.",
    runButton: (seed: number) => `Compare speech effects OFF/ON (baseSeed ${seed}+)`,
    empty:
      'Run this to compare speech effects "OFF" and "ON" under identical conditions (preset, parameters, intervention, baseSeed, run count).',
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `Conditions: ${preset} / intervention: ${interv} / baseSeed ${a}–${b} (${runs} runs)`,
    stale: "These results are from different conditions. Re-run to update to the latest conditions.",
    off: "Speech effects OFF",
    on: "Speech effects ON",
    delta: "Delta",
    phase3Title: "Phase 3-specific metrics",
    heardRate: "observerJoiner speech-reception rate",
    interpEffectRate: "Rate of runs with interpretation/effect",
    transitionRate: "Rate of runs where speech effects influenced a transition",
    avgAdjustment: (dim: string) => `Avg. cumulative adjustment: ${dim}`,
  },
  ja: {
    title: "発言効果ON/OFFの比較",
    note: (interv: string) =>
      `現在のプリセット・パラメータ・介入(${interv})・baseSeedを固定したまま、Phase 3発言効果(発言の認知・解釈・状態への補正)だけをOFF/ONで切り替えて、同じseed列で比較します。`,
    runsLabel: `実行回数（${MIN_RUNS}〜${MAX_RUNS}）`,
    error: `実行回数は${MIN_RUNS}〜${MAX_RUNS}の整数で指定してください。`,
    pauseNote: "実行すると、単発シミュレーションは一時停止します。",
    runButton: (seed: number) => `発言効果OFF/ONを比較して実行（baseSeed ${seed}〜）`,
    empty: "実行すると、発言効果「OFF」と「ON」を同一条件(プリセット・パラメータ・介入・baseSeed・実行回数)で比較できます。",
    condition: (preset: string, interv: string, a: number, b: number, runs: number) =>
      `条件: ${preset} / 介入: ${interv} / baseSeed ${a}〜${b} (${runs}回)`,
    stale: "現在の条件と異なる結果です。再実行すると最新の条件で更新されます。",
    off: "発言効果OFF",
    on: "発言効果ON",
    delta: "差分",
    phase3Title: "Phase 3固有指標",
    heardRate: "observerJoiner発言認知率",
    interpEffectRate: "解釈/効果が発生したrun率",
    transitionRate: "状態遷移へ発言効果が寄与したrun率",
    avgAdjustment: (dim: string) => `平均累積補正: ${dim}`,
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

function formatCorrection(value: number): string {
  return value.toFixed(3);
}

function formatCorrectionDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`;
}

type MetricRowProps = {
  label: string;
  off: string;
  on: string;
  delta: string;
};

function MetricRow({ label, off, on, delta }: MetricRowProps) {
  return (
    <div className="intervention-comparison-row">
      <span>{label}</span>
      <span>{off}</span>
      <span>{on}</span>
      <span>{delta}</span>
    </div>
  );
}

export function SpeechEffectsComparisonPanel({
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
  const [result, setResult] = useState<SpeechEffectsComparisonResult | null>(null);
  const [resultCondition, setResultCondition] = useState<SpeechEffectsComparisonConditionSnapshot | null>(null);
  const [resultPresetId, setResultPresetId] = useState<string>(presetId);
  const [resultInterventionId, setResultInterventionId] = useState<InterventionScenarioId>(interventionId);
  const [resultRuns, setResultRuns] = useState(0);

  const runCount = Number(runCountInput);
  const runCountValid = isValidRunCount(runCount);

  const currentCondition: SpeechEffectsComparisonConditionSnapshot = {
    presetId,
    seed,
    params,
    interventionId,
    speechEffectsOff: { enabled: false },
    speechEffectsOn: { enabled: true },
  };
  const isStale =
    result !== null &&
    resultCondition !== null &&
    !isSameSpeechEffectsComparisonCondition(currentCondition, resultCondition);

  const handleRun = () => {
    if (!runCountValid) return;
    onBeforeRun();
    const comparison = compareSpeechEffects({
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

  return (
    <div className="panel monte-carlo-panel speech-effects-comparison-panel">
      <h2>{t.title}</h2>
      <p className="monte-carlo-note">{t.note(interventionName(getInterventionById(interventionId), lang))}</p>

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
        <p className="monte-carlo-empty">{t.empty}</p>
      ) : (
        <>
          <p className="monte-carlo-condition">
            {t.condition(
              presetName(getPresetById(resultPresetId), lang),
              interventionName(getInterventionById(resultInterventionId), lang),
              result.off.config.baseSeed,
              result.off.config.baseSeed + resultRuns - 1,
              resultRuns,
            )}
          </p>
          {isStale && <p className="monte-carlo-stale">{t.stale}</p>}

          <section className="intervention-comparison-summary">
            <div className="intervention-comparison-row intervention-comparison-header">
              <span></span>
              <span>{t.off}</span>
              <span>{t.on}</span>
              <span>{t.delta}</span>
            </div>
            <MetricRow
              label={MC_METRIC_LABELS.observerJoinerJoinRate[lang]}
              off={formatRate(result.metrics.observerJoinerJoinRate.baseline)}
              on={formatRate(result.metrics.observerJoinerJoinRate.intervention)}
              delta={formatRateDelta(result.metrics.observerJoinerJoinRate.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.observerJoinerLeaveRate[lang]}
              off={formatRate(result.metrics.observerJoinerLeaveRate.baseline)}
              on={formatRate(result.metrics.observerJoinerLeaveRate.intervention)}
              delta={formatRateDelta(result.metrics.observerJoinerLeaveRate.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.groupFailureRate[lang]}
              off={formatRate(result.metrics.groupFailureRate.baseline)}
              on={formatRate(result.metrics.groupFailureRate.intervention)}
              delta={formatRateDelta(result.metrics.groupFailureRate.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.averageFirstGroupConfirmedTick[lang]}
              off={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.baseline)}
              on={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.intervention)}
              delta={formatOptionalTickDelta(result.metrics.averageFirstGroupConfirmedTick.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.lateJoinSuccessRate[lang]}
              off={formatRate(result.metrics.lateJoinSuccessRate.baseline)}
              on={formatRate(result.metrics.lateJoinSuccessRate.intervention)}
              delta={formatRateDelta(result.metrics.lateJoinSuccessRate.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.averageJoinedCount[lang]}
              off={formatCount(result.metrics.averageJoinedCount.baseline)}
              on={formatCount(result.metrics.averageJoinedCount.intervention)}
              delta={formatCountDelta(result.metrics.averageJoinedCount.delta)}
            />
            <MetricRow
              label={MC_METRIC_LABELS.averageLeftCount[lang]}
              off={formatCount(result.metrics.averageLeftCount.baseline)}
              on={formatCount(result.metrics.averageLeftCount.intervention)}
              delta={formatCountDelta(result.metrics.averageLeftCount.delta)}
            />
          </section>

          <section className="intervention-comparison-summary speech-effects-phase3-summary">
            <h3>{t.phase3Title}</h3>
            <div className="intervention-comparison-row intervention-comparison-header">
              <span></span>
              <span>{t.off}</span>
              <span>{t.on}</span>
              <span>{t.delta}</span>
            </div>
            <MetricRow
              label={t.heardRate}
              off={formatRate(result.phase3Metrics.observerJoinerHeardSpeechRate.baseline)}
              on={formatRate(result.phase3Metrics.observerJoinerHeardSpeechRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.observerJoinerHeardSpeechRate.delta)}
            />
            <MetricRow
              label={t.interpEffectRate}
              off={formatRate(result.phase3Metrics.interpretationOrEffectRate.baseline)}
              on={formatRate(result.phase3Metrics.interpretationOrEffectRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.interpretationOrEffectRate.delta)}
            />
            <MetricRow
              label={t.transitionRate}
              off={formatRate(result.phase3Metrics.transitionInfluencedRate.baseline)}
              on={formatRate(result.phase3Metrics.transitionInfluencedRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.transitionInfluencedRate.delta)}
            />
            {DIMENSIONS.map((dimension) => (
              <MetricRow
                key={dimension}
                label={t.avgAdjustment(DIMENSION_LABEL[dimension][lang])}
                off={formatCorrection(result.phase3Metrics.dimensionTotals[dimension].baseline)}
                on={formatCorrection(result.phase3Metrics.dimensionTotals[dimension].intervention)}
                delta={formatCorrectionDelta(result.phase3Metrics.dimensionTotals[dimension].delta)}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
