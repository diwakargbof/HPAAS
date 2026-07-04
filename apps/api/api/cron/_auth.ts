// Shared guard for cron-triggered endpoints. Vercel Cron automatically
// sends `Authorization: Bearer $CRON_SECRET` on scheduled invocations when
// the CRON_SECRET env var is set on the project — this rejects anyone else
// who guesses the URL. Set CRON_SECRET in Vercel project settings; there is
// no safe default, so an unset secret fails closed (every request is
// rejected) rather than silently allowing unauthenticated calls.

import type { IncomingMessage, ServerResponse } from "node:http";

export function isAuthorizedCronRequest(req: IncomingMessage): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.authorization === `Bearer ${secret}`;
}

export function rejectUnauthorized(res: ServerResponse): void {
  res.statusCode = 401;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "unauthorized" }));
}
