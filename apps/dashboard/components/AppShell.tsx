"use client";

// The tenant-aware shell: theming via CSS variables from config.branding,
// nav built from config.modules (enabled + order) — components never check
// which tenant they're rendering. A second shop with different colors and
// modules gets a different dashboard from the same code.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ModuleKey } from "@hpas/types";
import { clearSession, getSession, type Session } from "../lib/api";

interface NavLink {
  key: string;
  label: string;
  path: string;
}

// Customer-facing personalization features, grouped under one collapsible
// "Personalization" nav section (same idea as GK AIR's Empfehlungen group) —
// each still only appears when its module is enabled for the tenant.
const PERSONALIZATION_META: Partial<Record<ModuleKey, { label: string; path: string }>> = {
  insights: { label: "My Customers", path: "/insights" },
  customers: { label: "All Customers", path: "/customers" },
  segments: { label: "Segments", path: "/segments" },
  campaigns: { label: "Campaigns", path: "/campaigns" },
  loyalty: { label: "Counter", path: "/loyalty" },
};

// Pricing's sub-pages — always both present under the group; the group as a
// whole is locked (🔒) rather than hidden when the module isn't enabled, so
// personalization-only tenants see it as an upsell (each sub-page also 403s
// server-side and shows its own contact-admin message).
const PRICING_CHILDREN: NavLink[] = [
  { key: "pricing-recommendations", label: "Recommendations", path: "/pricing" },
  { key: "pricing-settings", label: "Item Settings", path: "/pricing/settings" },
];

// Everything else stays a flat top-level link, same as before.
const FLAT_MODULE_META: Partial<Record<ModuleKey, { label: string; path: string }>> = {
  menu: { label: "Menu", path: "/menu" },
  preferences: { label: "Preferences", path: "/preferences" },
  data: { label: "Upload Data", path: "/data" },
  settings: { label: "Settings", path: "/settings" },
  billing: { label: "Billing", path: "/billing" },
};

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<Session | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  const personalizationLinks: NavLink[] = (
    Object.entries(PERSONALIZATION_META) as Array<[ModuleKey, { label: string; path: string }]>
  )
    .filter(([key]) => config.modules[key]?.enabled)
    .map(([key, meta]) => ({ key, label: meta.label, path: meta.path }));

  const pricingEnabled = Boolean(config.modules.pricing?.enabled);

  const flatItems = (Object.entries(FLAT_MODULE_META) as Array<[ModuleKey, { label: string; path: string }]>)
    .filter(([key]) => config.modules[key]?.enabled)
    .map(([key, meta]) => ({ key, label: meta.label, path: meta.path, order: config.modules[key]!.order }))
    .sort((a, b) => a.order - b.order);

  function toggleGroup(groupKey: string) {
    setCollapsed((c) => ({ ...c, [groupKey]: !c[groupKey] }));
  }

  function renderGroup(groupKey: string, label: string, children: NavLink[], locked = false) {
    const isCollapsed = Boolean(collapsed[groupKey]);
    return (
      <div key={groupKey}>
        <div className="nav-group-header" onClick={() => toggleGroup(groupKey)}>
          <span>
            {label}
            {locked ? " 🔒" : ""}
          </span>
          <span className={`nav-chevron${isCollapsed ? "" : " open"}`}>›</span>
        </div>
        {!isCollapsed && (
          <div className="nav-group-children">
            {children.map((c) => (
              <a
                key={c.key}
                href={c.path}
                className={`nav-link${pathname.startsWith(c.path) ? " active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(c.path);
                }}
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

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
        {personalizationLinks.length > 0 && renderGroup("personalization", "Personalization", personalizationLinks)}
        {renderGroup("pricing", "Pricing", PRICING_CHILDREN, !pricingEnabled)}
        {flatItems.map((item) => (
          <a
            key={item.key}
            href={item.path}
            className={`nav-link${pathname.startsWith(item.path) ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(item.path);
            }}
          >
            {item.label}
          </a>
        ))}
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
