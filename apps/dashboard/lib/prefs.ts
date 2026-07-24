// Personal display preferences — these are per-browser (localStorage), not
// tenant business config. They live entirely on the client: nothing here is
// ever sent to the API. Distinct from tenant branding (config.branding.colors),
// which is shop-wide and admin-set; these are "how this person likes to look
// at the dashboard" and have no bearing on what the shop's customers see.

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";
export type Density = "comfortable" | "compact";
export type NumberFormat = "en-IN" | "en-US";
export type Language = "en";

export interface AppPrefs {
  theme: ThemeMode;
  fontSize: FontSize;
  density: Density;
  numberFormat: NumberFormat;
  reduceMotion: boolean;
  language: Language;
}

export const DEFAULT_PREFS: AppPrefs = {
  theme: "system",
  fontSize: "medium",
  density: "comfortable",
  numberFormat: "en-IN",
  reduceMotion: false,
  language: "en",
};

const STORAGE_KEY = "hpas_app_prefs";

export function loadPrefs(): AppPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: AppPrefs) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyPrefsToDocument(prefs);
}

// Applied to <html> as data-attributes so CSS alone can react — no
// per-component prop drilling. Kept in sync with the inline pre-paint
// script in app/layout.tsx (same attribute names/values).
export function applyPrefsToDocument(prefs: AppPrefs) {
  const root = document.documentElement;
  const resolvedTheme =
    prefs.theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : prefs.theme;
  root.setAttribute("data-theme", resolvedTheme);
  root.setAttribute("data-font-size", prefs.fontSize);
  root.setAttribute("data-density", prefs.density);
  root.setAttribute("data-reduce-motion", String(prefs.reduceMotion));
}

// Indian-shop-friendly number formatting (1,00,000 style) vs plain international
// grouping — a small but genuinely useful difference for this audience.
export function formatNumber(n: number, prefs: Pick<AppPrefs, "numberFormat">): string {
  return new Intl.NumberFormat(prefs.numberFormat).format(n);
}
