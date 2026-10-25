-- ORV-112: rate limit counters. Not workspace data, so the app role uses the whole table, as on
-- the auth tables in 0001; the limiter in @orivilo/auth is the only writer.
GRANT SELECT, INSERT, UPDATE, DELETE ON "rate_limit_counter" TO orivilo_app;
--> statement-breakpoint
ALTER TABLE "rate_limit_counter" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "app_rate_limit" ON "rate_limit_counter" TO orivilo_app USING (true) WITH CHECK (true);
--> statement-breakpoint
-- Nothing for any other role, whatever default privileges the host applies to new tables.
-- Named roles are revoked only where they exist, so the same file runs on CI Postgres.
REVOKE ALL ON "rate_limit_counter" FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON "rate_limit_counter" FROM %I', r);
    END IF;
  END LOOP;
END
$$;
