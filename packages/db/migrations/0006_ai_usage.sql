CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"job" text NOT NULL,
	"model" text NOT NULL,
	"cost_micro_usd" bigint,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ai_usage_job_check" CHECK (char_length("ai_usage"."job") between 1 and 40),
	CONSTRAINT "ai_usage_model_check" CHECK (char_length("ai_usage"."model") between 1 and 200),
	CONSTRAINT "ai_usage_cost_check" CHECK ("ai_usage"."cost_micro_usd" >= 0),
	CONSTRAINT "ai_usage_currency_check" CHECK ("ai_usage"."currency" = 'USD')
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_workspace_created_idx" ON "ai_usage" USING btree ("workspace_id","created_at");