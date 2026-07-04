"use client";

// The tenant-aware shell: theming via CSS variables from config.branding,
// nav built from config.modules (enabled + order) — components never check
// which tenant they're rendering. A second shop with different colors and
// modules gets a different dashboard from the same code.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ModuleKey } from "@hpas/types";
import { clearSession, getSession, type Session } from "../lib/api";

const MODULE_META: Record<ModuleKey, { label: string; path: string }> = {
  insights: { label: "My Customers", path: "/insights" },
  segments: { label: "Segments", path: "/segments" },
  campaigns: { label: "Campaigns", path: "/campaigns" },
  loyalty: { label: "Counter", path: "/loyalty" },
  menu: { label: "Menu", path: "/menu" },
  preferences: { label: "Preferences", path: "/preferences" },
  data: { label: "Upload Data", path: "/data" },
  settings: { label: "Settings", path: "/settings" },
};

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSessionState(s);
  }, [router]);

  if (!session) return null;

  const { config } = session.tenant;
  const colors = config.branding.colors;

  const navItems = (Object.entries(config.modules) as Array<[ModuleKey, { enabled: boolean; order: number }]>)
    .filter(([key, m]) => m.enabled && MODULE_META[key])
    .sort((a, b) => a[1].order - b[1].order);

  return (
    <div
      className="shell"
      style={
        {
          "--primary": colors.primary,
          "--accent": colors.accent,
          "--bg": colors.background,
        } as React.CSSProperties
      }
    >
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot">{config.branding.shopName.slice(0, 1)}</span>
          <span>{config.branding.shopName}</span>
        </div>
        {navItems.map(([key]) => {
          const meta = MODULE_META[key];
          return (
            <a
              key={key}
              href={meta.path}
              className={`nav-link${pathname.startsWith(meta.path) ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(meta.path);
              }}
            >
              {meta.label}
            </a>
          );
        })}
        <button
          className="logout"
          onClick={() => {
            clearSession();
            router.replace("/");
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
