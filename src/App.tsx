import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { ControlPanel } from "./components/ControlPanel";
import { RESET_REQUIRED_PARAM_KEYS } from "./components/sliderConfig";
import { EventLog } from "./components/EventLog";
import { AgentLegend } from "./components/AgentLegend";
import { InterventionSelector } from "./components/InterventionSelector";
import { MonteCarloPanel } from "./components/MonteCarloPanel";
import { InterventionComparisonPanel } from "./components/InterventionComparisonPanel";
import { SpeechEffectsComparisonPanel } from "./components/SpeechEffectsComparisonPanel";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { ObserverJoinerInspector } from "./components/ObserverJoinerInspector";
import { SimulationSummaryPanel } from "./components/SimulationSummaryPanel";
import { ExpressionDisplaySettings } from "./components/ExpressionDisplaySettings";
import {
  DEFAULT_EXPRESSION_DISPLAY_SETTINGS,
  EXPRESSION_DISPLAY_DENSITY_MAX_CONCURRENT,
  filterThoughtsForDisplay,
  type ExpressionDisplaySettingsState,
} from "./components/expressionDisplayFilter";
import { SpeechBubbleDisplaySettings } from "./components/SpeechBubbleDisplaySettings";
import {
  DEFAULT_SPEECH_BUBBLE_DISPLAY_SETTINGS,
  type SpeechBubbleDisplaySettingsState,
} from "./components/speechBubbleDisplayFilter";
import { createInitialState, stepSimulation } from "./simulation/engine";
import { SeededRandom } from "./simulation/random";
import { getPresetById, PRESETS, presetName } from "./simulation/presets";
import { getInterventionById, interventionName } from "./simulation/interventions";
import type { InterventionScenarioId } from "./simulation/interventions";
import { useLang } from "./i18n/lang";
import { LanguageToggle } from "./components/LanguageToggle";
import type { SimParams, SimulationState } from "./simulation/types";
import { useActiveExpressions } from "./hooks/useActiveExpressions";
import { useActiveSpeechBubbles } from "./hooks/useActiveSpeechBubbles";
import { useIsMobile } from "./hooks/useIsMobile";

const TICK_INTERVAL_MS = 250;
const INITIAL_SEED = 12345;

const UI = {
  en: {
    title: "Group Formation Simulator",
    intro:
      "This prototype visualizes how a group forms during an ambiguous transition moment — " +
      "the kind where whether to go on to a next round is decided by the mood of the room. " +
      "The orange agents are people who want to go but don't want to move the room themselves (observerJoiner).",
    about: "About this simulator",
    finished: "(finished)",
    running: "(running)",
    paused: "(paused)",
    preset: "Preset:",
    intervention: "Intervention:",
  },
  ja: {
    title: "グループ形成過程シミュレーター",
    intro:
      "このプロトタイプは、二次会に行くかどうかがその場の空気で決まるような、曖昧な移行場面での" +
      "グループ形成過程を可視化します。オレンジ色のエージェントは" +
      "「行きたいが、自分の意思で場を動かしたくない人 (observerJoiner)」です。",
    about: "このシミュレーターについて",
    finished: "(終了)",
    running: "(実行中)",
    paused: "(一時停止)",
    preset: "プリセット:",
    intervention: "介入:",
  },
} as const;

function App() {
  const isMobile = useIsMobile();
  const { lang } = useLang();
  const t = UI[lang];
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [params, setParams] = useState<SimParams>(PRESETS[0].params);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [interventionId, setInterventionId] = useState<InterventionScenarioId>("none");
  const [running, setRunning] = useState(false);
  // Issue #98: 状態ログ/observerJoiner InspectorでPhase 3(発言効果)の因果を確認できるようにするため、
  // ここでデフォルト有効化する。以後のstepSimulation呼び出しは`state.speechEffectsEnabled`から
  // この設定を引き継ぐ(engine.ts参照)ので、都度渡し直す必要はない。
  const [simState, setSimState] = useState<SimulationState>(() =>
    createInitialState(INITIAL_SEED, PRESETS[0].params, { interventionId: "none" }, { enabled: true }),
  );
  // 現在のsimStateの生成に実際に使われたparams。Reset必須パラメータが
  // これとparamsとで食い違っている間は、変更がまだ反映されていないとみなす。
  const [appliedParams, setAppliedParams] = useState<SimParams>(PRESETS[0].params);
  // Reset・プリセット変更・seed変更・再実行のたびにインクリメントする。useActiveExpressionsは
  // この値の変化を「新しい実行が始まった」シグナルとして扱い、古い心の声吹き出しを破棄する。
  const [runId, setRunId] = useState(0);
  // 心の声の表示設定(ON/OFF・表示対象・表示密度)。表示層だけの設定であり、
  // Reset・プリセット変更・seed変更のいずれでもリセットされない(Issue #66の完了条件)。
  const [expressionDisplaySettings, setExpressionDisplaySettings] = useState<ExpressionDisplaySettingsState>(
    DEFAULT_EXPRESSION_DISPLAY_SETTINGS,
  );
  // 発言吹き出しの表示設定(ON/OFF)。心の声と同様、表示層だけの設定でありReset・プリセット変更・
  // seed変更のいずれでもリセットされない。
  const [speechBubbleDisplaySettings, setSpeechBubbleDisplaySettings] = useState<SpeechBubbleDisplaySettingsState>(
    DEFAULT_SPEECH_BUBBLE_DISPLAY_SETTINGS,
  );

  const rngRef = useRef(new SeededRandom(seed));

  const resetSimulation = useCallback(
    (nextSeed: number, nextParams: SimParams, nextInterventionId: InterventionScenarioId) => {
      rngRef.current = new SeededRandom(nextSeed);
      const initialState = createInitialState(
        nextSeed,
        nextParams,
        { interventionId: nextInterventionId },
        { enabled: true },
      );
      setSimState(initialState);
      setAppliedParams(nextParams);
      setRunId((id) => id + 1);
      setRunning(false);
    },
    [],
  );

  const activeThoughts = useActiveExpressions(simState, seed, `${runId}:${lang}`, {
    enabled: expressionDisplaySettings.enabled,
    maxConcurrent: EXPRESSION_DISPLAY_DENSITY_MAX_CONCURRENT[expressionDisplaySettings.density],
    lang,
  });
  const visibleThoughts = filterThoughtsForDisplay(activeThoughts, expressionDisplaySettings.target);

  const visibleSpeeches = useActiveSpeechBubbles(simState, `${runId}:${lang}`, {
    enabled: speechBubbleDisplaySettings.enabled,
    lang,
  });

  const hasPendingResetChanges = RESET_REQUIRED_PARAM_KEYS.some(
    (key) => params[key] !== appliedParams[key],
  );

  const handleStep = useCallback(() => {
    setSimState((prev) => stepSimulation(prev, params, rngRef.current, { interventionId }));
  }, [params, interventionId]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSimState((prev) => {
        if (prev.finished) {
          setRunning(false);
          return prev;
        }
        return stepSimulation(prev, params, rngRef.current, { interventionId });
      });
    }, TICK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [running, params, interventionId]);

  const handleStartPause = useCallback(() => {
    if (simState.finished) return;
    setRunning((r) => !r);
  }, [simState.finished]);

  const handlePauseForMonteCarlo = useCallback(() => {
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    resetSimulation(seed, params, interventionId);
  }, [resetSimulation, seed, params, interventionId]);

  const handleSeedChange = useCallback(
    (nextSeed: number) => {
      setSeed(nextSeed);
      resetSimulation(nextSeed, params, interventionId);
    },
    [resetSimulation, params, interventionId],
  );

  const handlePresetChange = useCallback(
    (nextPresetId: string) => {
      const preset = getPresetById(nextPresetId);
      setPresetId(preset.id);
      setParams(preset.params);
      resetSimulation(seed, preset.params, interventionId);
    },
    [resetSimulation, seed, interventionId],
  );

  const handleInterventionChange = useCallback(
    (nextInterventionId: InterventionScenarioId) => {
      setInterventionId(nextInterventionId);
      resetSimulation(seed, params, nextInterventionId);
    },
    [resetSimulation, seed, params],
  );

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-top">
          <h1>{t.title}</h1>
          <LanguageToggle />
        </div>
        {isMobile ? (
          <details className="app-intro-details">
            <summary>{t.about}</summary>
            <p>{t.intro}</p>
          </details>
        ) : (
          <p>{t.intro}</p>
        )}
        <p className="tick-status">
          Tick: {simState.tick} {simState.finished ? t.finished : running ? t.running : t.paused}
        </p>
        <p className="current-condition">
          {t.preset} {presetName(getPresetById(presetId), lang)} / seed: {seed} / {t.intervention}{" "}
          {interventionName(getInterventionById(interventionId), lang)}
        </p>
      </header>

      <main className="app-main">
        <aside className="sidebar-left">
          <ControlPanel
            running={running}
            seed={seed}
            presetId={presetId}
            params={params}
            onStartPause={handleStartPause}
            onReset={handleReset}
            onStep={handleStep}
            onSeedChange={handleSeedChange}
            onPresetChange={handlePresetChange}
            onParamsChange={setParams}
            hasPendingResetChanges={hasPendingResetChanges}
            collapseSliders={isMobile}
          />
          <ExpressionDisplaySettings
            settings={expressionDisplaySettings}
            onSettingsChange={setExpressionDisplaySettings}
          />
          <SpeechBubbleDisplaySettings
            settings={speechBubbleDisplaySettings}
            onSettingsChange={setSpeechBubbleDisplaySettings}
          />
          <InterventionSelector
            interventionId={interventionId}
            onInterventionChange={handleInterventionChange}
          />
          <AgentLegend />
          <MonteCarloPanel
            presetId={presetId}
            params={params}
            seed={seed}
            interventionId={interventionId}
            singleSimRunning={running}
            onBeforeRun={handlePauseForMonteCarlo}
          />
          <InterventionComparisonPanel
            presetId={presetId}
            params={params}
            seed={seed}
            interventionId={interventionId}
            singleSimRunning={running}
            onBeforeRun={handlePauseForMonteCarlo}
          />
          <SpeechEffectsComparisonPanel
            presetId={presetId}
            params={params}
            seed={seed}
            interventionId={interventionId}
            singleSimRunning={running}
            onBeforeRun={handlePauseForMonteCarlo}
          />
        </aside>

        <section className="center-stage">
          <SimulationCanvas
            agents={simState.agents}
            groupCandidates={simState.groupCandidates}
            width={simState.width}
            height={simState.height}
            thoughts={visibleThoughts}
            speeches={visibleSpeeches}
          />
        </section>

        <aside className="sidebar-right">
          <ObserverJoinerInspector state={simState} params={params} />
          <SimulationSummaryPanel state={simState} />
          <EventLog state={simState} />
        </aside>
      </main>
    </div>
  );
}

export default App;
