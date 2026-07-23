-- Platform-wide notifications (e.g. "server maintenance on Sunday 2am IST")
-- shown to every tenant. Deliberately NOT tenant-scoped — this is platform
-- infrastructure content, not tenant business data, so it's the one
-- exception to "every business-table query takes tenant_id". No authoring
-- UI: post one via a direct INSERT (see KNOWLEDGE_GRAPH.md).

CREATE TABLE platform_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message    TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
