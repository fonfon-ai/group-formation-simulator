import { createContext, useContext } from "react";
import type { Lang } from "./types";

export type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

// Default value is used when a component renders without a provider (e.g. renderToStaticMarkup
// in unit tests) — it resolves to English so those tests observe the English UI unchanged.
export const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

/** Access the current language and a setter. Falls back to English outside a provider. */
export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}
