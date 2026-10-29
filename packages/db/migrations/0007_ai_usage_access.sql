-- ORV-121: AI usage records are workspace data (ADR 0002). The app role inserts and reads rows of
-- the workspace the helper set; it may not change or delete a record.
GRANT SELECT, INSERT ON "ai_usage" TO orivilo_app;
--> statement-breakpoint
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "workspace_rows" ON "ai_usage" TO orivilo_app
  USING (workspace_id = current_setting('app.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
--> statement-breakpoint
-- Nothing for any other role, whatever default privileges the host applies to new tables.
REVOKE ALL ON "ai_usage" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON "ai_usage" FROM %I', r);
    END IF;
  END LOOP;
END
$$;
