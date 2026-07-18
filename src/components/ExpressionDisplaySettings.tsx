import type { ExpressionDisplayDensity, ExpressionDisplaySettingsState, ExpressionDisplayTarget } from "./expressionDisplayFilter";

type Props = {
  settings: ExpressionDisplaySettingsState;
  onSettingsChange: (settings: ExpressionDisplaySettingsState) => void;
};

const TARGET_OPTIONS: Array<{ value: ExpressionDisplayTarget; label: string }> = [
  { value: "all", label: "All agents" },
  { value: "observerJoiner", label: "observerJoiner only" },
  { value: "important", label: "Important events only" },
];

const DENSITY_OPTIONS: Array<{ value: ExpressionDisplayDensity; label: string }> = [
  { value: "few", label: "Fewer" },
  { value: "standard", label: "Standard" },
  { value: "many", label: "More" },
];

/**
 * 心の声吹き出しの表示設定(ON/OFF・表示対象・表示密度)。常設ボタンを並べず、
 * checkbox 1つ + select 2つのみのコンパクトな構成にする(Issue #66「設定UIをコンパクトにする」)。
 * ここでの変更はApp.tsx側でSimulationCanvasへ渡す表示リストを絞り込むだけで、
 * シミュレーションstate・ログ・最終結果には一切影響しない。
 */
export function ExpressionDisplaySettings({ settings, onSettingsChange }: Props) {
  return (
    <div className="panel expression-display-settings">
      <h2>Inner voice</h2>
      <p className="expression-display-note">
        The "inner voice" is a non-intervening expression visible only to the observer, not something the agent actually says.
        Changing this display setting does not change the simulation result.
      </p>

      <label className="field expression-display-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
        />
        <span>Show inner voice</span>
      </label>

      {settings.enabled && (
        <>
          <label className="field">
            <span>Show for</span>
            <select
              value={settings.target}
              onChange={(e) =>
                onSettingsChange({ ...settings, target: e.target.value as ExpressionDisplayTarget })
              }
            >
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Density</span>
            <select
              value={settings.density}
              onChange={(e) =>
                onSettingsChange({ ...settings, density: e.target.value as ExpressionDisplayDensity })
              }
            >
              {DENSITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
