import type { ExpressionDisplayDensity, ExpressionDisplaySettingsState, ExpressionDisplayTarget } from "./expressionDisplayFilter";
import { useLang } from "../i18n/lang";
import type { Lang } from "../i18n/types";

type Props = {
  settings: ExpressionDisplaySettingsState;
  onSettingsChange: (settings: ExpressionDisplaySettingsState) => void;
};

const TARGET_OPTIONS: Array<{ value: ExpressionDisplayTarget; label: Record<Lang, string> }> = [
  { value: "all", label: { en: "All agents", ja: "全エージェント" } },
  { value: "observerJoiner", label: { en: "observerJoiner only", ja: "observerJoinerのみ" } },
  { value: "important", label: { en: "Important events only", ja: "重要イベントのみ" } },
];

const DENSITY_OPTIONS: Array<{ value: ExpressionDisplayDensity; label: Record<Lang, string> }> = [
  { value: "few", label: { en: "Fewer", ja: "少なめ" } },
  { value: "standard", label: { en: "Standard", ja: "標準" } },
  { value: "many", label: { en: "More", ja: "多め" } },
];

const UI = {
  en: {
    title: "Inner voice",
    note: 'The "inner voice" is a non-intervening expression visible only to the observer, not something the agent actually says. Changing this display setting does not change the simulation result.',
    show: "Show inner voice",
    target: "Show for",
    density: "Density",
  },
  ja: {
    title: "心の声表示",
    note: "「心の声」は観察者にだけ見える非介入の表現で、エージェント本人の発言ではありません。この表示設定を変えてもシミュレーションの結果は変わりません。",
    show: "心の声を表示する",
    target: "表示対象",
    density: "表示密度",
  },
} as const;

export function ExpressionDisplaySettings({ settings, onSettingsChange }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  return (
    <div className="panel expression-display-settings">
      <h2>{t.title}</h2>
      <p className="expression-display-note">{t.note}</p>

      <label className="field expression-display-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
        />
        <span>{t.show}</span>
      </label>

      {settings.enabled && (
        <>
          <label className="field">
            <span>{t.target}</span>
            <select
              value={settings.target}
              onChange={(e) =>
                onSettingsChange({ ...settings, target: e.target.value as ExpressionDisplayTarget })
              }
            >
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[lang]}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t.density}</span>
            <select
              value={settings.density}
              onChange={(e) =>
                onSettingsChange({ ...settings, density: e.target.value as ExpressionDisplayDensity })
              }
            >
              {DENSITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[lang]}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
