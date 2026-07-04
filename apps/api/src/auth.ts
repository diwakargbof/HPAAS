// Two auth paths, both resolving to a Tenant on req:
//  - API-key auth (X-API-Key) for machine ingestion (POS integrations)
//  - Session-token auth (Bearer) for the dashboard
//
// The session is a signed HMAC token — deliberately minimal, but shaped
// like real auth (login endpoint, opaque bearer token, middleware) so a
// proper IdP swap later only replaces token issue/verify, not routes.

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Tenant } from "@hpas/types";
import { getTenantByApiKey, getTenantBySlug } from "@hpas/db";

const SECRET = () => process.env.AUTH_SECRET ?? "dev-secret-change-me";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
}

export function issueSessionToken(tenantSlug: string, ttlHours = 24 * 7): string {
  const expires = Date.now() + ttlHours * 3600_000;
  const payload = `${tenantSlug}.${expires}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  const [slug, expiresStr] = payload.split(".");
  if (Date.now() > Number(expiresStr)) return null;
  return slug;
}

/** POST /v1/auth/login — { tenant, password } → { token, tenant config } */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { tenant: slug, password } = req.body ?? {};
  const demoPassword = process.env.DEMO_PASSWORD ?? "demo";
  if (!slug || password !== demoPassword) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const tenant = await getTenantBySlug(String(slug).toLowerCase());
  if (!tenant) {
    res.status(401).json({ error: "unknown tenant" });
    return;
  }
  res.json({
    token: issueSessionToken(tenant.config.slug),
    tenant: { id: tenant.id, name: tenant.name, config: tenant.config },
  });
}

/** Machine auth for ingestion: X-API-Key header. */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = req.header("x-api-key");
  if (!key) {
    res.status(401).json({ error: "missing X-API-Key" });
    return;
  }
  const tenant = await getTenantByApiKey(key);
  if (!tenant) {
    res.status(401).json({ error: "invalid API key" });
    return;
  }
  req.tenant = tenant;
  next();
}

/** Dashboard auth: Authorization: Bearer <session token>. */
export async function sessionAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const slug = token ? verifySessionToken(token) : null;
  if (!slug) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    res.status(401).json({ error: "unknown tenant" });
    return;
  }
  req.tenant = tenant;
  next();
}
