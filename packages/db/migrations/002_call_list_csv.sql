-- Call-list CSVs are generated per campaign send and need to survive on a
-- read-only/ephemeral serverless filesystem, so they're stored in the DB
-- and served on demand rather than written to local disk.
ALTER TABLE campaigns ADD COLUMN call_list_csv TEXT;
