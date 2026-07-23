// Platform-wide notifications — deliberately not tenant-scoped (see
// migration 009's header comment). No writer here: rows are inserted
// directly by the platform admin.

import type { PlatformNotification } from "@hpas/types";
import { query } from "./client.js";

const mapPlatformNotification = (r: any): PlatformNotification => ({
  id: r.id,
  message: r.message,
  severity: r.severity,
  createdAt: r.created_at,
});

export async function listActivePlatformNotifications(): Promise<PlatformNotification[]> {
  const rows = await query(
    `SELECT * FROM platform_notifications WHERE active = true ORDER BY created_at DESC`
  );
  return rows.map(mapPlatformNotification);
}
