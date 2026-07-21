import { useLang } from "../i18n/lang";
import { LANGS, type Lang } from "../i18n/types";

const NATIVE_LABEL: Record<Lang, string> = {
  en: "English",
  ja: "日本語",
};

/**
 * 言語切替。英語/日本語の2択セグメントで、現在の言語を`aria-pressed`で示す。
 * 選択は`LanguageProvider`がlocalStorageへ保存する。
 */
export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="language-toggle" role="group" aria-label="Language / 言語">
      {LANGS.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          className={`language-toggle-btn${option === lang ? " is-active" : ""}`}
          aria-pressed={option === lang}
          onClick={() => setLang(option)}
        >
          {NATIVE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
