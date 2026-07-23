"use client";

// Personalization > Notifications — platform-wide announcements (e.g.
// server maintenance windows), not tenant-authored. Read-only: the
// platform admin posts these directly, there's no in-app authoring UI.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";

interface PlatformNotification {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

const SEVERITY_BADGE: Record<PlatformNotification["severity"], string> = {
  info: "badge-type",
  warning: "badge-pending",
  critical: "badge-rejected",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ notifications: PlatformNotification[] }>("/notifications")
      .then((r) => setNotifications(r.notifications))
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <AppShell>
      <div className="page-title">Notifications</div>
      <div className="page-sub">Platform announcements — including planned server maintenance.</div>
      {error && <div className="error-text">{error}</div>}

      <div className="card">
        {!notifications ? (
          <div className="muted">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="muted">Nothing to show right now.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Message</th>
                <th className="num">Posted</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>
                    <span className={`badge ${SEVERITY_BADGE[n.severity]}`}>{n.severity}</span>
                  </td>
                  <td>{n.message}</td>
                  <td className="num muted">{new Date(n.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
