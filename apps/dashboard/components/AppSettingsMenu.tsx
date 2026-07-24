"use client";

// Gear-icon menu in the top-right of the shell — personal display prefs
// (theme, font size, density, number format, language, motion), stored only
// in this browser via lib/prefs.ts. Distinct from the tenant-wide Settings
// page (branding/WhatsApp/billing), which is shop config, not per-person.

import { useEffect, useRef, useState } from "react";
import {
  applyPrefsToDocument,
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  type AppPrefs,
  type Density,
  type FontSize,
  type ThemeMode,
} from "../lib/prefs";

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

const FONT_OPTIONS: Array<{ value: FontSize; label: string }> = [
  { value: "small", label: "A" },
  { value: "medium", label: "A" },
  { value: "large", label: "A" },
];

const DENSITY_OPTIONS: Array<{ value: Density; label: string }> = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export default function AppSettingsMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_PREFS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function update(patch: Partial<AppPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  }

  return (
    <div className="app-settings" ref={ref}>
      <button
        className={`icon-btn${open ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Application settings"
        title="Application settings"
      >
        ⚙️
      </button>
      {open && (
        <div className="app-settings-panel" role="menu">
          <div className="app-settings-header">Display settings</div>

          <div className="app-settings-section">
            <div className="app-settings-label">Color scheme</div>
            <div className="segmented">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`segmented-btn${prefs.theme === opt.value ? " active" : ""}`}
                  onClick={() => update({ theme: opt.value })}
                >
                  <span aria-hidden>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="app-settings-section">
            <div className="app-settings-label">Font size</div>
            <div className="segmented">
              {FONT_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  className={`segmented-btn${prefs.fontSize === opt.value ? " active" : ""}`}
                  style={{ fontSize: `${0.85 + i * 0.15}rem` }}
                  onClick={() => update({ fontSize: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="app-settings-section">
            <div className="app-settings-label">Density</div>
            <div className="segmented">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`segmented-btn${prefs.density === opt.value ? " active" : ""}`}
                  onClick={() => update({ density: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="app-settings-section">
            <div className="app-settings-label">Number format</div>
            <div className="segmented">
              <button
                className={`segmented-btn${prefs.numberFormat === "en-IN" ? " active" : ""}`}
                onClick={() => update({ numberFormat: "en-IN" })}
              >
                1,00,000 (India)
              </button>
              <button
                className={`segmented-btn${prefs.numberFormat === "en-US" ? " active" : ""}`}
                onClick={() => update({ numberFormat: "en-US" })}
              >
                100,000
              </button>
            </div>
          </div>

          <div className="app-settings-section app-settings-row">
            <div className="app-settings-label" style={{ marginBottom: 0 }}>
              Reduce motion
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => update({ reduceMotion: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="app-settings-section">
            <div className="app-settings-label">Language</div>
            <select className="select" value={prefs.language} disabled>
              <option value="en">English</option>
            </select>
            <div className="app-settings-hint">More languages coming soon.</div>
          </div>

          <button
            className="btn btn-ghost app-settings-reset"
            onClick={() => {
              update(DEFAULT_PREFS);
            }}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

// Exported so AppShell can apply stored prefs once on mount (the inline
// script in layout.tsx only covers first paint; this covers the
// React-mounted lifetime, e.g. reacting to OS theme changes under "system").
export function useAppliedPrefs() {
  useEffect(() => {
    const prefs = loadPrefs();
    applyPrefsToDocument(prefs);
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPrefsToDocument(loadPrefs());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
}
