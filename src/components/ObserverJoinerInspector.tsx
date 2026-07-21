import { buildObserverJoinerInspection } from "../simulation/inspection";
import type {
  GroupCandidateStatus,
  ObserverJoinerInspection,
  ObserverSpeechEffectDetail,
  ObserverSpeechHistoryEntry,
  SimParams,
  SimulationState,
} from "../simulation/types";
import { buildAgentLabelMap, formatSpeechDebugMeta, formatSpeechLogMessage } from "./speechDisplay";
import {
  formatActiveEffectStatusLine,
  formatAggregatedEffectSummary,
  formatContributionLine,
  formatEffectLine,
  formatInterpretationFactorLine,
  formatInterpretationLine,
  formatReceptionLine,
} from "./speechEffectsDisplay";
import { useLang } from "../i18n/lang";
import { agentStateLabel, groupStatusLabel, speechRelationLabel } from "../i18n/labels";

type Props = {
  state: SimulationState;
  params: SimParams;
};

// leaveMarginがこの値を下回ったら、まだ離脱していなくても注意表示にする
const LEAVE_MARGIN_WARNING_THRESHOLD = 0.15;

const UI = {
  en: {
    noRecord: "No speech-effect record (Phase 3 effects disabled, or this agent wasn't in reception range)",
    detailsSummary: "Speech-effect details",
    noReception: "No reception record",
    reasonNotHeard: (reason: string) => `Reason not heard: out of range (${reason})`,
    heardNoInterp: "Heard, but no interpretation record",
    neutralNoEffect: "The interpretation was neutral, so no effect occurred",
    noActiveEffects: "No speech effects are currently active.",
    duplicate: "(duplicate, not applied)",
    marginBeforeLeaving: "margin before leaving",
    aboutToLeave: " ⚠ about to leave",
    nearestGroupStatus: "nearest group status",
    nearestGroupSize: "nearest group size",
    nearestGroupDistance: "nearest group distance",
    attractivenessAfter: "attractiveness (after effects)",
    attractivenessBefore: "attractiveness (before effects)",
    ofWhichSpeechEffect: "of which, speech-effect adjustment",
    none: "none",
    relatedSpeech: "related speech",
    noRelatedSpeech: "No related speech yet.",
    activeEffectsHeader: "Currently active speech effects",
    title: "observerJoiner inspector",
    noObserver: "There is no observerJoiner.",
  },
  ja: {
    noRecord: "発言効果の記録なし(Phase 3効果が無効、またはこのagentが認知対象になっていない)",
    detailsSummary: "発言効果の詳細",
    noReception: "認知記録なし",
    reasonNotHeard: (reason: string) => `非認知理由: 圏外(${reason})`,
    heardNoInterp: "届いたが解釈記録なし",
    neutralNoEffect: "解釈が中立だったため効果は発生しなかった",
    noActiveEffects: "現在作用中の発言効果はありません。",
    duplicate: "(重複・不採用)",
    marginBeforeLeaving: "離脱までの余裕",
    aboutToLeave: " ⚠ 離脱間近",
    nearestGroupStatus: "nearest group status",
    nearestGroupSize: "nearest group人数",
    nearestGroupDistance: "nearest group距離",
    attractivenessAfter: "attractiveness(適用後)",
    attractivenessBefore: "attractiveness(適用前)",
    ofWhichSpeechEffect: "うち発言効果による補正",
    none: "なし",
    relatedSpeech: "関連する発言",
    noRelatedSpeech: "まだ関連する発言はありません。",
    activeEffectsHeader: "現在作用中の発言効果",
    title: "observerJoinerインスペクター",
    noObserver: "observerJoinerがいません。",
  },
} as const;

function formatRatio(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDistance(value: number): string {
  return value.toFixed(1);
}

/**
 * `entry`(発言1件)の認知/解釈/効果の因果詳細を折りたたみ表示する(Issue #98)。
 */
function SpeechEffectDetailBlock({
  detail,
  labelById,
}: {
  detail: ObserverSpeechEffectDetail;
  labelById: Map<string, string>;
}) {
  const { lang } = useLang();
  const t = UI[lang];

  if (!detail.reception && !detail.interpretation && !detail.effect) {
    return <p className="observer-inspector-effect-empty">{t.noRecord}</p>;
  }

  return (
    <details className="observer-inspector-effect-details">
      <summary>{t.detailsSummary}</summary>

      {detail.reception ? (
        <div className="observer-inspector-effect-line">{formatReceptionLine(detail.reception, labelById, lang)}</div>
      ) : (
        <div className="observer-inspector-effect-line">{t.noReception}</div>
      )}

      {detail.reception && !detail.reception.heard && (
        <p className="observer-inspector-effect-reason">{t.reasonNotHeard(detail.reception.reason)}</p>
      )}

      {detail.reception?.heard && !detail.interpretation && (
        <p className="observer-inspector-effect-reason">{t.heardNoInterp}</p>
      )}

      {detail.interpretation && (
        <>
          <div className="observer-inspector-effect-line">{formatInterpretationLine(detail.interpretation, labelById, lang)}</div>
          <ul className="observer-inspector-factor-list">
            {detail.interpretation.factors.map((factor) => (
              <li key={factor.key}>{formatInterpretationFactorLine(factor, lang)}</li>
            ))}
          </ul>
        </>
      )}

      {detail.interpretation && detail.interpretation.valence === "neutral" && !detail.effect && (
        <p className="observer-inspector-effect-reason">{t.neutralNoEffect}</p>
      )}

      {detail.effect && (
        <>
          <div className="observer-inspector-effect-line">{formatEffectLine(detail.effect, labelById, lang)}</div>
          <div className="observer-inspector-effect-line">{formatActiveEffectStatusLine(detail.activeEffectStatus, lang)}</div>
        </>
      )}
    </details>
  );
}

function SpeechHistoryEntry({
  entry,
  detail,
  labelById,
}: {
  entry: ObserverSpeechHistoryEntry;
  detail?: ObserverSpeechEffectDetail;
  labelById: Map<string, string>;
}) {
  const { lang } = useLang();
  return (
    <div className="observer-inspector-speech-entry">
      <div className="observer-inspector-speech-message">
        <span className="observer-inspector-speech-relation">{speechRelationLabel(entry.relation, lang)}</span>
        {formatSpeechLogMessage(entry.event, labelById, lang)}
      </div>
      <div className="observer-inspector-speech-meta">{formatSpeechDebugMeta(entry.event, labelById)}</div>
      {detail && <SpeechEffectDetailBlock detail={detail} labelById={labelById} />}
    </div>
  );
}

/**
 * 現在このagentに作用しているPhase 3効果を、dimensionごとの集約値+個別寄与で表示する(Issue #98)。
 */
function ActiveEffectSummaryList({
  summaries,
  labelById,
}: {
  summaries: ObserverJoinerInspection["activeEffectSummaries"];
  labelById: Map<string, string>;
}) {
  const { lang } = useLang();
  const t = UI[lang];
  if (summaries.length === 0) {
    return <p className="observer-inspector-speech-empty">{t.noActiveEffects}</p>;
  }
  return (
    <div className="observer-inspector-speech-list">
      {summaries.map((summary) => (
        <div key={`${summary.dimension}-${summary.targetGroupId ?? ""}`} className="observer-inspector-speech-entry">
          <div className="observer-inspector-speech-message">{formatAggregatedEffectSummary(summary, lang)}</div>
          {summary.positiveContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.positiveContributions.map((c) => (
                <li key={c.speechActiveEffectId}>+ {formatContributionLine(c, labelById, lang)}</li>
              ))}
            </ul>
          )}
          {summary.negativeContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.negativeContributions.map((c) => (
                <li key={c.speechActiveEffectId}>- {formatContributionLine(c, labelById, lang)}</li>
              ))}
            </ul>
          )}
          {summary.duplicateContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.duplicateContributions.map((c) => (
                <li key={c.speechActiveEffectId}>{t.duplicate} {formatContributionLine(c, labelById, lang)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function InspectionCard({
  inspection,
  labelById,
}: {
  inspection: ObserverJoinerInspection;
  labelById: Map<string, string>;
}) {
  const { lang } = useLang();
  const t = UI[lang];
  const isNearLeaving = inspection.leaveMargin <= LEAVE_MARGIN_WARNING_THRESHOLD;
  const hasNearestGroup = inspection.nearestGroupId !== undefined;

  return (
    <div className={`observer-inspector-card${isNearLeaving ? " observer-inspector-card--warning" : ""}`}>
      <div className="observer-inspector-row observer-inspector-row--header">
        <span className="observer-inspector-label-name">{inspection.label}</span>
        <span className="observer-inspector-state">{agentStateLabel(inspection.state, lang)}</span>
      </div>

      <div className="observer-inspector-row">
        <span>stress</span>
        <span>{formatRatio(inspection.stress)}</span>
      </div>
      <div className="observer-inspector-row">
        <span>willingness</span>
        <span>{formatRatio(inspection.willingness)}</span>
      </div>
      <div className="observer-inspector-row">
        <span>ambiguityTolerance</span>
        <span>{formatRatio(inspection.ambiguityTolerance)}</span>
      </div>
      <div className="observer-inspector-row">
        <span>influenceAvoidance</span>
        <span>{formatRatio(inspection.influenceAvoidance)}</span>
      </div>
      <div className="observer-inspector-row">
        <span>leaveThreshold</span>
        <span>{formatRatio(inspection.leaveThreshold)}</span>
      </div>
      <div className={`observer-inspector-row${isNearLeaving ? " observer-inspector-row--warning" : ""}`}>
        <span>{t.marginBeforeLeaving}</span>
        <span>
          {formatRatio(inspection.leaveMargin)}
          {isNearLeaving ? t.aboutToLeave : ""}
        </span>
      </div>

      <div className="observer-inspector-divider" />

      {hasNearestGroup ? (
        <>
          <div className="observer-inspector-row">
            <span>nearest group</span>
            <span>{inspection.nearestGroupId}</span>
          </div>
          <div className="observer-inspector-row">
            <span>{t.nearestGroupStatus}</span>
            <span>{groupStatusLabel(inspection.nearestGroupStatus as GroupCandidateStatus, lang)}</span>
          </div>
          <div className="observer-inspector-row">
            <span>{t.nearestGroupSize}</span>
            <span>{inspection.nearestGroupMemberCount}</span>
          </div>
          <div className="observer-inspector-row">
            <span>{t.nearestGroupDistance}</span>
            <span>{formatDistance(inspection.nearestGroupDistance as number)}</span>
          </div>
          <div className="observer-inspector-row">
            <span>{t.attractivenessAfter}</span>
            <span>{formatRatio(inspection.attractivenessScore as number)}</span>
          </div>
          {inspection.attractivenessScoreBeforeEffects !== undefined &&
            inspection.attractivenessScoreBeforeEffects !== inspection.attractivenessScore && (
              <>
                <div className="observer-inspector-row">
                  <span>{t.attractivenessBefore}</span>
                  <span>{formatRatio(inspection.attractivenessScoreBeforeEffects)}</span>
                </div>
                <div className="observer-inspector-row">
                  <span>{t.ofWhichSpeechEffect}</span>
                  <span>
                    {formatRatio(
                      (inspection.attractivenessScore as number) - inspection.attractivenessScoreBeforeEffects,
                    )}
                  </span>
                </div>
              </>
            )}
        </>
      ) : (
        <div className="observer-inspector-row">
          <span>nearest group</span>
          <span>{t.none}</span>
        </div>
      )}

      <div className="observer-inspector-divider" />

      <div className="observer-inspector-row observer-inspector-row--header">
        <span>{t.relatedSpeech}</span>
      </div>
      {inspection.speechHistory.length === 0 ? (
        <p className="observer-inspector-speech-empty">{t.noRelatedSpeech}</p>
      ) : (
        <div className="observer-inspector-speech-list">
          {inspection.speechHistory.map((entry, i) => (
            <SpeechHistoryEntry
              key={entry.event.id}
              entry={entry}
              detail={inspection.speechEffectDetails[i]}
              labelById={labelById}
            />
          ))}
        </div>
      )}

      <div className="observer-inspector-divider" />

      <div className="observer-inspector-row observer-inspector-row--header">
        <span>{t.activeEffectsHeader}</span>
      </div>
      <ActiveEffectSummaryList summaries={inspection.activeEffectSummaries} labelById={labelById} />
    </div>
  );
}

export function ObserverJoinerInspector({ state, params }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  const inspections = buildObserverJoinerInspection(state, params);
  const labelById = buildAgentLabelMap(state.agents);

  return (
    <div className="panel observer-inspector">
      <h2>{t.title}</h2>
      {inspections.length === 0 ? (
        <p className="observer-inspector-empty">{t.noObserver}</p>
      ) : (
        inspections.map((inspection) => (
          <InspectionCard key={inspection.agentId} inspection={inspection} labelById={labelById} />
        ))
      )}
    </div>
  );
}
