"use client";

// The tenant-aware shell: theming via CSS variables from config.branding.
// A top bar switches between the two areas — Personalization and Pricing —
// and the sidebar shows only that area's full menu (no more collapsible
// groups). Settings/Billing are tenant-wide, not specific to either area, so
// they stay in an always-visible "Account" footer below the area menu.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { areasConfig, type ModuleKey } from "@hpas/types";
import { clearSession, getSession, type Session } from "../lib/api";

type Area = "personalization" | "pricing";

interface NavLink {
  key: string;
  label: string;
  path: string;
}

// Module-gated Personalization items — each still only shows when its own
// module is enabled for the tenant.
const PERSONALIZATION_META: Partial<Record<ModuleKey, { label: string; path: string }>> = {
  insights: { label: "My Customers", path: "/insights" },
  customers: { label: "All Customers", path: "/customers" },
  segments: { label: "Segments", path: "/segments" },
  campaigns: { label: "Campaigns", path: "/campaigns" },
  menu: { label: "Master Data", path: "/menu" },
  data: { label: "Upload Data", path: "/data" },
  preferences: { label: "Preferences", path: "/preferences" },
};

// Recommendations/Item Settings are pricing-specific and always shown once
// the area itself is reachable — the area is locked (🔒 on the top-bar tab)
// rather than hidden when the module isn't enabled, so personalization-only
// tenants see it as an upsell (each page also 403s server-side and shows its
// own contact-admin message). Master Data (the menu catalog) still respects
// its own module flag, same as every other module-gated item.
const PRICING_META: Partial<Record<ModuleKey, { label: string; path: string }>> = {
  menu: { label: "Master Data", path: "/menu" },
};

// Tenant-wide, not specific to either area.
const ACCOUNT_META: Partial<Record<ModuleKey, { label: string; path: string }>> = {
  settings: { label: "Settings", path: "/settings" },
  billing: { label: "Billing", path: "/billing" },
};

const AREA_STORAGE_KEY = "hpas_active_area";

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<Session | null>(null);
  const [area, setArea] = useState<Area>("personalization");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSessionState(s);
    const stored = window.localStorage.getItem(AREA_STORAGE_KEY);
    const areas = areasConfig(s.tenant.config);
    if ((stored === "personalization" || stored === "pricing") && areas[stored]) {
      setArea(stored);
    } else if (!areas.personalization && areas.pricing) {
      setArea("pricing");
    }
  }, [router]);

  if (!session) return null;

  const { config } = session.tenant;
  const colors = config.branding.colors;
  const pricingEnabled = Boolean(config.modules.pricing?.enabled);
  const areas = areasConfig(config);

  function selectArea(next: Area) {
    setArea(next);
    window.localStorage.setItem(AREA_STORAGE_KEY, next);
  }

  const personalizationModuleLinks: NavLink[] = (
    Object.entries(PERSONALIZATION_META) as Array<[ModuleKey, { label: string; path: string }]>
  )
    .filter(([key]) => config.modules[key]?.enabled)
    .map(([key, meta]) => ({ key, label: meta.label, path: meta.path }));

  // Dashboard/Notifications/Settings aren't gated by their own module — they're
  // baseline views of whichever personalization data/features the tenant
  // already has.
  const personalizationLinks: NavLink[] = [
    { key: "personalization-dashboard", label: "Dashboard", path: "/personalization/dashboard" },
    ...personalizationModuleLinks,
    { key: "personalization-qr-codes", label: "QR Codes", path: "/personalization/qr-codes" },
    { key: "personalization-notifications", label: "Notifications", path: "/personalization/notifications" },
    { key: "personalization-settings", label: "Settings", path: "/personalization/settings" },
  ];

  const accountLinks: NavLink[] = (Object.entries(ACCOUNT_META) as Array<[ModuleKey, { label: string; path: string }]>)
    .filter(([key]) => config.modules[key]?.enabled)
    .map(([key, meta]) => ({ key, label: meta.label, path: meta.path }));

  const pricingModuleLinks: NavLink[] = (Object.entries(PRICING_META) as Array<[ModuleKey, { label: string; path: string }]>)
    .filter(([key]) => config.modules[key]?.enabled)
    .map(([key, meta]) => ({ key, label: meta.label, path: meta.path }));

  const pricingLinks: NavLink[] = [
    { key: "pricing-dashboard", label: "Dashboard", path: "/pricing/dashboard" },
    { key: "pricing-recommendations", label: "Recommendations", path: "/pricing" },
    { key: "pricing-pipelines", label: "Pipelines", path: "/pricing/pipelines" },
    { key: "pricing-item-settings", label: "Item Settings", path: "/pricing/settings" },
    ...pricingModuleLinks,
  ];

  const areaLinks = area === "personalization" ? personalizationLinks : pricingLinks;

  // Longest-prefix match, not a plain startsWith: "/pricing/settings" must
  // only light up "Item Settings" (path "/pricing/settings"), not also
  // "Recommendations" (path "/pricing", a prefix of it).
  const allLinks = [...personalizationLinks, ...pricingLinks, ...accountLinks];
  const activeLink = allLinks
    .filter((l) => pathname === l.path || pathname.startsWith(`${l.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  function navLink(link: NavLink) {
    return (
      <a
        key={link.key}
        href={link.path}
        className={`nav-link${activeLink?.key === link.key ? " active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          router.push(link.path);
        }}
      >
        {link.label}
      </a>
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
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot">{config.branding.shopName.slice(0, 1)}</span>
          <span>{config.branding.shopName}</span>
        </div>
        <div className="area-tabs">
          {areas.personalization && (
            <button
              className={`area-tab${area === "personalization" ? " active" : ""}`}
              onClick={() => selectArea("personalization")}
            >
              Personalization
            </button>
          )}
          {areas.pricing && (
            <button className={`area-tab${area === "pricing" ? " active" : ""}`} onClick={() => selectArea("pricing")}>
              Pricing{!pricingEnabled ? " 🔒" : ""}
            </button>
          )}
        </div>
      </header>
      <div className="shell-body">
        <aside className="sidebar">
          {(area === "personalization" ? areas.personalization : areas.pricing) && areaLinks.map(navLink)}
          {accountLinks.length > 0 && (
            <>
              <div className="nav-group-header" style={{ cursor: "default", marginTop: 12 }}>
                <span>Account</span>
              </div>
              {accountLinks.map(navLink)}
            </>
          )}
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
    </div>
  );
}
