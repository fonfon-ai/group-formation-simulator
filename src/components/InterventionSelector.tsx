import type { InterventionCategory, InterventionScenarioId } from "../simulation/interventions";
import { getInterventionById, INTERVENTION_SCENARIOS } from "../simulation/interventions";

type Props = {
  interventionId: InterventionScenarioId;
  onInterventionChange: (interventionId: InterventionScenarioId) => void;
};

const CATEGORY_LABEL: Record<InterventionCategory, string> = {
  none: "—",
  publicCoordination: "Coordinating the setting",
  socialPermission: "Social permission",
  targetedSupport: "Targeted support",
  timeDesign: "Time design",
};

/** どの観察指標(Monte Carlo集計値)に効きやすいかの目安。engine.tsのロジックに基づく目視での対応付け */
const LIKELY_METRICS: Record<InterventionScenarioId, string> = {
  none: "—",
  "explicit-meeting-point": "Avg. group-confirmed tick / group-failure rate",
  "late-join-ok": "Late-join success rate / observerJoiner join rate",
  "light-observer-invitation": "observerJoiner join rate / observerJoiner leave rate",
  "short-ambiguity-window": "Group-failure rate / observerJoiner leave rate",
  "predecided-venue": "Late-join success rate / avg. group-confirmed tick",
  "anonymous-low-pressure-intent": "observerJoiner join rate / avg. group-confirmed tick",
};

export function InterventionSelector({ interventionId, onInterventionChange }: Props) {
  const scenario = getInterventionById(interventionId);

  return (
    <div className="panel intervention-selector">
      <h2>Intervention scenario</h2>
      <label className="field">
        <span>Intervention</span>
        <select
          value={interventionId}
          onChange={(e) => onInterventionChange(e.target.value as InterventionScenarioId)}
        >
          {INTERVENTION_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="intervention-description">
        <p className="intervention-description-text">{scenario.description}</p>
        {scenario.id !== "none" && (
          <>
            <p className="intervention-description-row">
              <span className="intervention-description-label">Expected effect</span>
              {scenario.expectedEffect}
            </p>
            <p className="intervention-description-row">
              <span className="intervention-description-label">Category</span>
              {CATEGORY_LABEL[scenario.category]}
            </p>
            <p className="intervention-description-row">
              <span className="intervention-description-label">Metrics it tends to move</span>
              {LIKELY_METRICS[scenario.id]}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
