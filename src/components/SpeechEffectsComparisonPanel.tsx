import { useState } from "react";
import { compareSpeechEffects } from "../simulation/speechEffectsMonteCarlo";
import { getPresetById } from "../simulation/presets";
import { getInterventionById } from "../simulation/interventions";
import type { InterventionScenarioId } from "../simulation/interventions";
import type { SpeechEffectDimension } from "../simulation/speechEffects";
import type { SpeechEffectsComparisonResult, SimParams } from "../simulation/types";
import { isValidRunCount, MAX_RUNS, MIN_RUNS } from "./monteCarloPanelHelpers";
import {
  isSameSpeechEffectsComparisonCondition,
  type SpeechEffectsComparisonConditionSnapshot,
} from "./speechEffectsComparisonPanelHelpers";

type Props = {
  presetId: string;
  params: SimParams;
  seed: number;
  interventionId: InterventionScenarioId;
  singleSimRunning: boolean;
  onBeforeRun: () => void;
};

const DEFAULT_RUN_COUNT = 30;

const DIMENSION_LABEL: Record<SpeechEffectDimension, string> = {
  stress: "Stress (greet)",
  attractiveness: "Attractiveness (welcome)",
  approachProbability: "Approach probability (invite)",
  leaveThreshold: "Leave threshold (decline)",
};

const DIMENSIONS: SpeechEffectDimension[] = ["approachProbability", "attractiveness", "stress", "leaveThreshold"];

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
  const [runCountInput, setRunCountInput] = useState(String(DEFAULT_RUN_COUNT));
  const [result, setResult] = useState<SpeechEffectsComparisonResult | null>(null);
  const [resultCondition, setResultCondition] = useState<SpeechEffectsComparisonConditionSnapshot | null>(null);
  const [resultPresetName, setResultPresetName] = useState("");
  const [resultInterventionName, setResultInterventionName] = useState("");
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
    setResultPresetName(getPresetById(presetId).name);
    setResultInterventionName(getInterventionById(interventionId).name);
    setResultRuns(runCount);
  };

  return (
    <div className="panel monte-carlo-panel speech-effects-comparison-panel">
      <h2>Speech effects ON/OFF comparison</h2>
      <p className="monte-carlo-note">
        Keeping the current preset, parameters, intervention ({getInterventionById(interventionId).name}), and baseSeed
        fixed, this toggles only the Phase 3 speech effects (speech reception, interpretation, and state adjustments)
        OFF/ON and compares over the same seed sequence.
      </p>

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

      {singleSimRunning && <p className="monte-carlo-note">Running this will pause the single simulation.</p>}

      <button type="button" onClick={handleRun} disabled={!runCountValid}>
        Compare speech effects OFF/ON (baseSeed {seed}+)
      </button>

      {result === null ? (
        <p className="monte-carlo-empty">
          Run this to compare speech effects "OFF" and "ON" under identical conditions (preset, parameters, intervention, baseSeed, run count).
        </p>
      ) : (
        <>
          <p className="monte-carlo-condition">
            Conditions: {resultPresetName} / intervention: {resultInterventionName} / baseSeed {result.off.config.baseSeed}–
            {result.off.config.baseSeed + resultRuns - 1} ({resultRuns} runs)
          </p>
          {isStale && (
            <p className="monte-carlo-stale">These results are from different conditions. Re-run to update to the latest conditions.</p>
          )}

          <section className="intervention-comparison-summary">
            <div className="intervention-comparison-row intervention-comparison-header">
              <span></span>
              <span>Speech effects OFF</span>
              <span>Speech effects ON</span>
              <span>Delta</span>
            </div>
            <MetricRow
              label="observerJoiner join rate"
              off={formatRate(result.metrics.observerJoinerJoinRate.baseline)}
              on={formatRate(result.metrics.observerJoinerJoinRate.intervention)}
              delta={formatRateDelta(result.metrics.observerJoinerJoinRate.delta)}
            />
            <MetricRow
              label="observerJoiner leave rate"
              off={formatRate(result.metrics.observerJoinerLeaveRate.baseline)}
              on={formatRate(result.metrics.observerJoinerLeaveRate.intervention)}
              delta={formatRateDelta(result.metrics.observerJoinerLeaveRate.delta)}
            />
            <MetricRow
              label="Group-failure rate"
              off={formatRate(result.metrics.groupFailureRate.baseline)}
              on={formatRate(result.metrics.groupFailureRate.intervention)}
              delta={formatRateDelta(result.metrics.groupFailureRate.delta)}
            />
            <MetricRow
              label="Avg. group-confirmed tick"
              off={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.baseline)}
              on={formatOptionalTick(result.metrics.averageFirstGroupConfirmedTick.intervention)}
              delta={formatOptionalTickDelta(result.metrics.averageFirstGroupConfirmedTick.delta)}
            />
            <MetricRow
              label="Late-join success rate"
              off={formatRate(result.metrics.lateJoinSuccessRate.baseline)}
              on={formatRate(result.metrics.lateJoinSuccessRate.intervention)}
              delta={formatRateDelta(result.metrics.lateJoinSuccessRate.delta)}
            />
            <MetricRow
              label="Avg. joined count"
              off={formatCount(result.metrics.averageJoinedCount.baseline)}
              on={formatCount(result.metrics.averageJoinedCount.intervention)}
              delta={formatCountDelta(result.metrics.averageJoinedCount.delta)}
            />
            <MetricRow
              label="Avg. left count"
              off={formatCount(result.metrics.averageLeftCount.baseline)}
              on={formatCount(result.metrics.averageLeftCount.intervention)}
              delta={formatCountDelta(result.metrics.averageLeftCount.delta)}
            />
          </section>

          <section className="intervention-comparison-summary speech-effects-phase3-summary">
            <h3>Phase 3-specific metrics</h3>
            <div className="intervention-comparison-row intervention-comparison-header">
              <span></span>
              <span>Speech effects OFF</span>
              <span>Speech effects ON</span>
              <span>Delta</span>
            </div>
            <MetricRow
              label="observerJoiner speech-reception rate"
              off={formatRate(result.phase3Metrics.observerJoinerHeardSpeechRate.baseline)}
              on={formatRate(result.phase3Metrics.observerJoinerHeardSpeechRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.observerJoinerHeardSpeechRate.delta)}
            />
            <MetricRow
              label="Rate of runs with interpretation/effect"
              off={formatRate(result.phase3Metrics.interpretationOrEffectRate.baseline)}
              on={formatRate(result.phase3Metrics.interpretationOrEffectRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.interpretationOrEffectRate.delta)}
            />
            <MetricRow
              label="Rate of runs where speech effects influenced a transition"
              off={formatRate(result.phase3Metrics.transitionInfluencedRate.baseline)}
              on={formatRate(result.phase3Metrics.transitionInfluencedRate.intervention)}
              delta={formatRateDelta(result.phase3Metrics.transitionInfluencedRate.delta)}
            />
            {DIMENSIONS.map((dimension) => (
              <MetricRow
                key={dimension}
                label={`Avg. cumulative adjustment: ${DIMENSION_LABEL[dimension]}`}
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
