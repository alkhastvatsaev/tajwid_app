const FAVORITES_KEY = "tajwid_favorites";
const COMPLETED_KEY = "tajwid_completed";
const LANG_KEY = "tajwid_lang";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function setFavorites(refs: string[]) {
  writeJson(FAVORITES_KEY, refs);
}

export function toggleFavorite(ref: string): string[] {
  const current = getFavorites();
  const next = current.includes(ref)
    ? current.filter((r) => r !== ref)
    : [...current, ref];
  setFavorites(next);
  return next;
}

export function getCompleted(): string[] {
  return readJson<string[]>(COMPLETED_KEY, []);
}

export function markCompleted(ref: string): string[] {
  const current = getCompleted();
  if (current.includes(ref)) return current;
  const next = [...current, ref];
  writeJson(COMPLETED_KEY, next);
  return next;
}

export type Lang = "fr" | "en" | "ru";

export function getStoredLang(): Lang {
  const lang = readJson<string>(LANG_KEY, "fr");
  if (lang === "en" || lang === "ru" || lang === "fr") return lang;
  return "fr";
}

export function setStoredLang(lang: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, lang);
}
