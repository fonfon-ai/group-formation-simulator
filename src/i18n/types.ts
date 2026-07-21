/** Supported UI languages. `en` is the default for this English-facing fork; `ja` is the original. */
export type Lang = "en" | "ja";

export const LANGS: Lang[] = ["en", "ja"];

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ja";
}

const STORAGE_KEY = "ugs-lang";

/**
 * Read the initial language: a previously stored choice wins; otherwise default to English
 * (this is an English-facing fork). Guarded for non-DOM environments (SSR/tests).
 */
export function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // localStorage can throw (privacy mode, disabled storage) — fall back to the default.
  }
  return "en";
}

/** Persist the chosen language. Storage failures are ignored (the in-memory choice still applies). */
export function writeStoredLang(lang: Lang): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}
