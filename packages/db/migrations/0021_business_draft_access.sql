-- ORV-292: what a model drafted for the positioning of an intake is workspace data (ADR 0002). The app
-- role inserts and reads the rows of the workspace the helper set; it may not change or delete one.
GRANT SELECT, INSERT ON "business_draft" TO orivilo_app;
--> statement-breakpoint
ALTER TABLE "business_draft" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "workspace_rows" ON "business_draft" TO orivilo_app
  USING (workspace_id = current_setting('app.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
--> statement-breakpoint
-- Nothing for any other role, whatever default privileges the host applies to new tables.
REVOKE ALL ON "business_draft" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON "business_draft" FROM %I', r);
    END IF;
  END LOOP;
END
$$;
