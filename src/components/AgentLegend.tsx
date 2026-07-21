import { useLang } from "../i18n/lang";
import type { Lang } from "../i18n/types";

const ITEMS: Array<{ color: string; label: Record<Lang, string> }> = [
  { color: "#9ca3af", label: { en: "gray: undecided", ja: "gray: 未定" } },
  { color: "#3b82f6", label: { en: "blue: leaning toward going on to a next round", ja: "blue: 二次会に向かう意思が強まりつつある" } },
  { color: "#22c55e", label: { en: "green: joined a circle/group (forming circle or confirmed group)", ja: "green: 輪/グループに合流済み(形成中の輪 or 成立済みグループ)" } },
  { color: "#ef4444", label: { en: "red: heading home", ja: "red: 帰宅方向" } },
  { color: "#a855f7", label: { en: "purple: leader / person forming a core", ja: "purple: 主導者・核を作っている人" } },
  { color: "#f97316", label: { en: "orange: observerJoiner type (the one to watch)", ja: "orange: observerJoiner型(注目対象)" } },
];

const UI = {
  en: {
    title: "Legend",
    note: "The larger the circle, the more initiative that person has. A thick orange outline marks the observerJoiner type (someone who wants to go but doesn't want to move the room themselves).",
  },
  ja: {
    title: "凡例",
    note: "円が大きいほど主導性が高い人です。オレンジの太枠は observerJoiner 型(行きたいが自分の意思で場を動かしたくない人)を示します。",
  },
} as const;

export function AgentLegend() {
  const { lang } = useLang();
  const t = UI[lang];
  return (
    <div className="panel legend">
      <h2>{t.title}</h2>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.color}>
            <span className="dot" style={{ backgroundColor: item.color }} />
            {item.label[lang]}
          </li>
        ))}
      </ul>
      <p className="legend-note">{t.note}</p>
    </div>
  );
}
