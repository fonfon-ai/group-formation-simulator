import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LanguageContext } from "./lang";
import { readInitialLang, writeStoredLang, type Lang } from "./types";

/**
 * Provides the current language (persisted to localStorage, defaulting to English) and keeps
 * `<html lang>` in sync. Kept in its own file so it is the only export here (fast-refresh boundary).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeStoredLang(next);
  }, []);

  // Keep the document language in sync so assistive tech and the browser see the right lang.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
