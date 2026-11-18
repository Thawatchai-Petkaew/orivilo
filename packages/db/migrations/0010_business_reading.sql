CREATE TABLE "business_reading" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"intake_id" text NOT NULL,
	"job" text NOT NULL,
	"method" text NOT NULL,
	"reason" text,
	"model_id" text,
	"adapter_id" text,
	"adapter_version" text,
	"prompt_version" text,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_reading_one_per_job" UNIQUE("intake_id","job"),
	CONSTRAINT "business_reading_job_check" CHECK (char_length("business_reading"."job") between 1 and 40),
	CONSTRAINT "business_reading_method_check" CHECK ("business_reading"."method" in ('model', 'rule-based')),
	CONSTRAINT "business_reading_reason_check" CHECK ("business_reading"."reason" is null or "business_reading"."reason" in ('ai-not-configured', 'ai-failed', 'ai-rate-limited', 'ai-spend-cap')),
	CONSTRAINT "business_reading_model_id_check" CHECK ("business_reading"."model_id" is null or char_length("business_reading"."model_id") between 1 and 200),
	CONSTRAINT "business_reading_adapter_id_check" CHECK ("business_reading"."adapter_id" is null or char_length("business_reading"."adapter_id") between 1 and 40),
	CONSTRAINT "business_reading_adapter_version_check" CHECK ("business_reading"."adapter_version" is null or char_length("business_reading"."adapter_version") between 1 and 40),
	CONSTRAINT "business_reading_prompt_version_check" CHECK ("business_reading"."prompt_version" is null or char_length("business_reading"."prompt_version") between 1 and 40),
	CONSTRAINT "business_reading_shape" CHECK (("business_reading"."method" = 'model') = ("business_reading"."reason" is null and "business_reading"."model_id" is not null and "business_reading"."adapter_id" is not null and "business_reading"."adapter_version" is not null and "business_reading"."prompt_version" is not null) and ("business_reading"."method" <> 'rule-based' or "business_reading"."evidence" = '[]'::jsonb))
);
--> statement-breakpoint
ALTER TABLE "business_reading" ADD CONSTRAINT "business_reading_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reading" ADD CONSTRAINT "business_reading_intake_fk" FOREIGN KEY ("intake_id","workspace_id") REFERENCES "public"."business_intake"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_reading_workspaceId_idx" ON "business_reading" USING btree ("workspace_id");