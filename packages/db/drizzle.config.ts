import { defineConfig } from "drizzle-kit";

// Generating needs no database; migrations run through src/migrate.ts with MIGRATION_DATABASE_URL.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
});
