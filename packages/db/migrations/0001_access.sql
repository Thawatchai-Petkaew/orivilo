-- ADR 0002: the app logs in as orivilo_app, which reads and writes rows and nothing else.
-- The owner creates the login role once with a password of their choosing; when it is missing
-- (CI, a fresh database) it is created without login so the grants below still apply.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'orivilo_app') THEN
    CREATE ROLE orivilo_app NOLOGIN NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- another migration run created it at the same moment
END
$$;
--> statement-breakpoint
ALTER ROLE orivilo_app NOBYPASSRLS NOCREATEDB NOCREATEROLE NOSUPERUSER;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO orivilo_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "user", "session", "account", "verification", "organization", "member", "invitation", "project" TO orivilo_app;
--> statement-breakpoint
-- Every table has row security, whether or not the project enables it automatically.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Better Auth reads its own tables before any workspace is known, so the app role may use them
-- whole; the authorization helper is the wall there. Any other role (anon, authenticated) gets
-- nothing, because no policy names it.
CREATE POLICY "app_auth" ON "user" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "session" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "account" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "verification" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "organization" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "member" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "app_auth" ON "invitation" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
-- Tenant tables: only the workspace the helper set for this transaction. With no setting the
-- comparison is null, so nothing is visible and nothing can be written (default deny).
CREATE POLICY "workspace_rows" ON "project" TO orivilo_app
  USING (workspace_id = current_setting('app.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
