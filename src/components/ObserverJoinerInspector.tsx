import { buildObserverJoinerInspection } from "../simulation/inspection";
import type {
  AgentState,
  GroupCandidateStatus,
  ObserverJoinerInspection,
  ObserverSpeechEffectDetail,
  ObserverSpeechHistoryEntry,
  SimParams,
  SimulationState,
  SpeechRelation,
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

type Props = {
  state: SimulationState;
  params: SimParams;
};

const SPEECH_RELATION_LABEL: Record<SpeechRelation, string> = {
  speaker: "Speaker",
  target: "Target",
  audience: "Nearby",
};

const AGENT_STATE_LABEL: Record<AgentState, string> = {
  undecided: "Undecided",
  forming: "Forming a circle",
  approaching: "Approaching",
  joined: "Joined",
  leaving: "Leaving",
  left: "Left",
};

const GROUP_STATUS_LABEL: Record<GroupCandidateStatus, string> = {
  forming: "Forming",
  confirmed: "Confirmed",
  dissolving: "Dissolving",
  dissolved: "Dissolved",
  expired: "Expired",
};

// leaveMarginがこの値を下回ったら、まだ離脱していなくても注意表示にする
const LEAVE_MARGIN_WARNING_THRESHOLD = 0.15;

function formatRatio(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDistance(value: number): string {
  return value.toFixed(1);
}

/**
 * `entry`(発言1件)の認知/解釈/効果の因果詳細を折りたたみ表示する(Issue #98)。
 * どの段まで進んだか(認知されなかった/解釈が中立だった/効果が既に失効した等)を、
 * 各段の有無から文言として明示する — 「非認知・効果なしの理由も確認できる」の受入条件に対応。
 */
function SpeechEffectDetailBlock({
  detail,
  labelById,
}: {
  detail: ObserverSpeechEffectDetail;
  labelById: Map<string, string>;
}) {
  if (!detail.reception && !detail.interpretation && !detail.effect) {
    return (
      <p className="observer-inspector-effect-empty">
        No speech-effect record (Phase 3 effects disabled, or this agent wasn't in reception range)
      </p>
    );
  }

  return (
    <details className="observer-inspector-effect-details">
      <summary>Speech-effect details</summary>

      {detail.reception ? (
        <div className="observer-inspector-effect-line">{formatReceptionLine(detail.reception, labelById)}</div>
      ) : (
        <div className="observer-inspector-effect-line">No reception record</div>
      )}

      {detail.reception && !detail.reception.heard && (
        <p className="observer-inspector-effect-reason">Reason not heard: out of range ({detail.reception.reason})</p>
      )}

      {detail.reception?.heard && !detail.interpretation && (
        <p className="observer-inspector-effect-reason">Heard, but no interpretation record</p>
      )}

      {detail.interpretation && (
        <>
          <div className="observer-inspector-effect-line">{formatInterpretationLine(detail.interpretation, labelById)}</div>
          <ul className="observer-inspector-factor-list">
            {detail.interpretation.factors.map((factor) => (
              <li key={factor.key}>{formatInterpretationFactorLine(factor)}</li>
            ))}
          </ul>
        </>
      )}

      {detail.interpretation && detail.interpretation.valence === "neutral" && !detail.effect && (
        <p className="observer-inspector-effect-reason">The interpretation was neutral, so no effect occurred</p>
      )}

      {detail.effect && (
        <>
          <div className="observer-inspector-effect-line">{formatEffectLine(detail.effect, labelById)}</div>
          <div className="observer-inspector-effect-line">{formatActiveEffectStatusLine(detail.activeEffectStatus)}</div>
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
  return (
    <div className="observer-inspector-speech-entry">
      <div className="observer-inspector-speech-message">
        <span className="observer-inspector-speech-relation">{SPEECH_RELATION_LABEL[entry.relation]}</span>
        {formatSpeechLogMessage(entry.event, labelById)}
      </div>
      <div className="observer-inspector-speech-meta">{formatSpeechDebugMeta(entry.event, labelById)}</div>
      {detail && <SpeechEffectDetailBlock detail={detail} labelById={labelById} />}
    </div>
  );
}

/**
 * 現在このagentに作用しているPhase 3効果を、dimensionごとの集約値+個別寄与(speechEventIdの列挙)で
 * 表示する(Issue #98)。複数の発言が同じdimensionへ寄与している場合、正/負/重複の内訳を分けて示す。
 */
function ActiveEffectSummaryList({
  summaries,
  labelById,
}: {
  summaries: ObserverJoinerInspection["activeEffectSummaries"];
  labelById: Map<string, string>;
}) {
  if (summaries.length === 0) {
    return <p className="observer-inspector-speech-empty">No speech effects are currently active.</p>;
  }
  return (
    <div className="observer-inspector-speech-list">
      {summaries.map((summary) => (
        <div key={`${summary.dimension}-${summary.targetGroupId ?? ""}`} className="observer-inspector-speech-entry">
          <div className="observer-inspector-speech-message">{formatAggregatedEffectSummary(summary)}</div>
          {summary.positiveContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.positiveContributions.map((c) => (
                <li key={c.speechActiveEffectId}>+ {formatContributionLine(c, labelById)}</li>
              ))}
            </ul>
          )}
          {summary.negativeContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.negativeContributions.map((c) => (
                <li key={c.speechActiveEffectId}>- {formatContributionLine(c, labelById)}</li>
              ))}
            </ul>
          )}
          {summary.duplicateContributions.length > 0 && (
            <ul className="observer-inspector-factor-list">
              {summary.duplicateContributions.map((c) => (
                <li key={c.speechActiveEffectId}>(duplicate, not applied) {formatContributionLine(c, labelById)}</li>
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
  const isNearLeaving = inspection.leaveMargin <= LEAVE_MARGIN_WARNING_THRESHOLD;
  const hasNearestGroup = inspection.nearestGroupId !== undefined;

  return (
    <div className={`observer-inspector-card${isNearLeaving ? " observer-inspector-card--warning" : ""}`}>
      <div className="observer-inspector-row observer-inspector-row--header">
        <span className="observer-inspector-label-name">{inspection.label}</span>
        <span className="observer-inspector-state">{AGENT_STATE_LABEL[inspection.state]}</span>
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
        <span>margin before leaving</span>
        <span>
          {formatRatio(inspection.leaveMargin)}
          {isNearLeaving ? " ⚠ about to leave" : ""}
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
            <span>nearest group status</span>
            <span>{GROUP_STATUS_LABEL[inspection.nearestGroupStatus as GroupCandidateStatus]}</span>
          </div>
          <div className="observer-inspector-row">
            <span>nearest group size</span>
            <span>{inspection.nearestGroupMemberCount}</span>
          </div>
          <div className="observer-inspector-row">
            <span>nearest group distance</span>
            <span>{formatDistance(inspection.nearestGroupDistance as number)}</span>
          </div>
          <div className="observer-inspector-row">
            <span>attractiveness (after effects)</span>
            <span>{formatRatio(inspection.attractivenessScore as number)}</span>
          </div>
          {inspection.attractivenessScoreBeforeEffects !== undefined &&
            inspection.attractivenessScoreBeforeEffects !== inspection.attractivenessScore && (
              <>
                <div className="observer-inspector-row">
                  <span>attractiveness (before effects)</span>
                  <span>{formatRatio(inspection.attractivenessScoreBeforeEffects)}</span>
                </div>
                <div className="observer-inspector-row">
                  <span>of which, speech-effect adjustment</span>
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
          <span>none</span>
        </div>
      )}

      <div className="observer-inspector-divider" />

      <div className="observer-inspector-row observer-inspector-row--header">
        <span>related speech</span>
      </div>
      {inspection.speechHistory.length === 0 ? (
        <p className="observer-inspector-speech-empty">No related speech yet.</p>
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
        <span>Currently active speech effects</span>
      </div>
      <ActiveEffectSummaryList summaries={inspection.activeEffectSummaries} labelById={labelById} />
    </div>
  );
}

export function ObserverJoinerInspector({ state, params }: Props) {
  const inspections = buildObserverJoinerInspection(state, params);
  const labelById = buildAgentLabelMap(state.agents);

  return (
    <div className="panel observer-inspector">
      <h2>observerJoiner inspector</h2>
      {inspections.length === 0 ? (
        <p className="observer-inspector-empty">There is no observerJoiner.</p>
      ) : (
        inspections.map((inspection) => (
          <InspectionCard key={inspection.agentId} inspection={inspection} labelById={labelById} />
        ))
      )}
    </div>
  );
}
