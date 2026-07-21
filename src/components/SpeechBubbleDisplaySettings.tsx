import type { SpeechBubbleDisplaySettingsState } from "./speechBubbleDisplayFilter";
import { useLang } from "../i18n/lang";

type Props = {
  settings: SpeechBubbleDisplaySettingsState;
  onSettingsChange: (settings: SpeechBubbleDisplaySettingsState) => void;
};

const UI = {
  en: {
    title: "Speech",
    note: 'A "speech" is a line actually spoken toward other agents. Changing this display setting does not change the simulation result.',
    show: "Show speech bubbles",
  },
  ja: {
    title: "発言表示",
    note: "「発言」は他のエージェントへ向けて実際に発せられたセリフです。この表示設定を変えてもシミュレーションの結果は変わりません。",
    show: "発言吹き出しを表示する",
  },
} as const;

export function SpeechBubbleDisplaySettings({ settings, onSettingsChange }: Props) {
  const { lang } = useLang();
  const t = UI[lang];
  return (
    <div className="panel speech-bubble-display-settings">
      <h2>{t.title}</h2>
      <p className="speech-bubble-display-note">{t.note}</p>

      <label className="field speech-bubble-display-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
        />
        <span>{t.show}</span>
      </label>
    </div>
  );
}
