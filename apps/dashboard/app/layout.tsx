import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "HPAS",
  description: "Customer engagement for your shop",
};

// Sets data-theme/data-font-size/data-density/data-reduce-motion on <html>
// before first paint, straight from localStorage — without this, the page
// would render with light-mode CSS then flash to dark once React hydrates
// and reads the same preference. Kept logic-identical to
// lib/prefs.ts#applyPrefsToDocument (that file re-applies on every change;
// this script only needs to run once, before hydration).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = window.localStorage.getItem("hpas_app_prefs");
    var prefs = raw ? JSON.parse(raw) : {};
    var theme = prefs.theme || "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-font-size", prefs.fontSize || "medium");
    root.setAttribute("data-density", prefs.density || "comfortable");
    root.setAttribute("data-reduce-motion", String(Boolean(prefs.reduceMotion)));
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
