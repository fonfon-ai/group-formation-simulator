import type { InterventionScenarioId } from "../simulation/interventions";
import {
  getInterventionById,
  INTERVENTION_SCENARIOS,
  interventionDescription,
  interventionExpectedEffect,
  interventionName,
} from "../simulation/interventions";
import { useLang } from "../i18n/lang";
import { interventionCategoryLabel } from "../i18n/labels";
import type { Lang } from "../i18n/types";

type Props = {
  interventionId: InterventionScenarioId;
  onInterventionChange: (interventionId: InterventionScenarioId) => void;
};

const UI = {
  en: { title: "Intervention scenario", intervention: "Intervention", expected: "Expected effect", category: "Category", metrics: "Metrics it tends to move" },
  ja: { title: "介入シナリオ", intervention: "介入", expected: "期待される効果", category: "分類", metrics: "効きやすい観察指標" },
} as const;

/** どの観察指標(Monte Carlo集計値)に効きやすいかの目安。engine.tsのロジックに基づく目視での対応付け */
const LIKELY_METRICS: Record<InterventionScenarioId, Record<Lang, string>> = {
  none: { en: "—", ja: "—" },
  "explicit-meeting-point": { en: "Avg. group-confirmed tick / group-failure rate", ja: "平均グループ成立tick / グループ不成立率" },
  "late-join-ok": { en: "Late-join success rate / observerJoiner join rate", ja: "後乗り成功率 / observerJoiner参加率" },
  "light-observer-invitation": { en: "observerJoiner join rate / observerJoiner leave rate", ja: "observerJoiner参加率 / observerJoiner離脱率" },
  "short-ambiguity-window": { en: "Group-failure rate / observerJoiner leave rate", ja: "グループ不成立率 / observerJoiner離脱率" },
  "predecided-venue": { en: "Late-join success rate / avg. group-confirmed tick", ja: "後乗り成功率 / 平均グループ成立tick" },
  "anonymous-low-pressure-intent": { en: "observerJoiner join rate / avg. group-confirmed tick", ja: "observerJoiner参加率 / 平均グループ成立tick" },
};

export function InterventionSelector({ interventionId, onInterventionChange }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  const scenario = getInterventionById(interventionId);

  return (
    <div className="panel intervention-selector">
      <h2>{t.title}</h2>
      <label className="field">
        <span>{t.intervention}</span>
        <select
          value={interventionId}
          onChange={(e) => onInterventionChange(e.target.value as InterventionScenarioId)}
        >
          {INTERVENTION_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {interventionName(s, lang)}
            </option>
          ))}
        </select>
      </label>

      <div className="intervention-description">
        <p className="intervention-description-text">{interventionDescription(scenario, lang)}</p>
        {scenario.id !== "none" && (
          <>
            <p className="intervention-description-row">
              <span className="intervention-description-label">{t.expected}</span>
              {interventionExpectedEffect(scenario, lang)}
            </p>
            <p className="intervention-description-row">
              <span className="intervention-description-label">{t.category}</span>
              {interventionCategoryLabel(scenario.category, lang)}
            </p>
            <p className="intervention-description-row">
              <span className="intervention-description-label">{t.metrics}</span>
              {LIKELY_METRICS[scenario.id][lang]}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
