-- ORV-35: saved directions follow the rules of 0001. The app role reads and writes rows of the
-- workspace the helper set, and an approved version can never be changed, even by that role.
ALTER TABLE "direction_version" ADD CONSTRAINT "direction_version_status_check" CHECK ("status" IN ('draft', 'approved'));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "direction", "direction_version" TO orivilo_app;
--> statement-breakpoint
ALTER TABLE "direction" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "direction_version" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "workspace_rows" ON "direction" TO orivilo_app
  USING (workspace_id = current_setting('app.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
--> statement-breakpoint
CREATE POLICY "workspace_rows" ON "direction_version" TO orivilo_app
  USING (workspace_id = current_setting('app.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
--> statement-breakpoint
-- Approved is final. Deleting stays possible (a direction or workspace removed as a whole).
CREATE FUNCTION direction_version_freeze() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'approved direction versions cannot change' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER direction_version_freeze BEFORE UPDATE ON "direction_version"
  FOR EACH ROW EXECUTE FUNCTION direction_version_freeze();
