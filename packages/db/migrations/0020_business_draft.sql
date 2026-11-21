CREATE TABLE "business_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"intake_id" text NOT NULL,
	"job" text NOT NULL,
	"model_id" text NOT NULL,
	"adapter_id" text NOT NULL,
	"adapter_version" text NOT NULL,
	"prompt_version" text NOT NULL,
	"options" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_draft_one_per_job" UNIQUE("intake_id","job"),
	CONSTRAINT "business_draft_id_intake_workspace_unique" UNIQUE("id","intake_id","workspace_id"),
	CONSTRAINT "business_draft_job_check" CHECK (char_length("business_draft"."job") between 1 and 40),
	CONSTRAINT "business_draft_model_id_check" CHECK (char_length("business_draft"."model_id") between 1 and 200),
	CONSTRAINT "business_draft_adapter_id_check" CHECK (char_length("business_draft"."adapter_id") between 1 and 40),
	CONSTRAINT "business_draft_adapter_version_check" CHECK (char_length("business_draft"."adapter_version") between 1 and 40),
	CONSTRAINT "business_draft_prompt_version_check" CHECK (char_length("business_draft"."prompt_version") between 1 and 40),
	CONSTRAINT "business_draft_options_check" CHECK (jsonb_typeof("business_draft"."options") = 'array' and jsonb_array_length("business_draft"."options") between 2 and 3)
);
--> statement-breakpoint
ALTER TABLE "business_draft" ADD CONSTRAINT "business_draft_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_draft" ADD CONSTRAINT "business_draft_intake_fk" FOREIGN KEY ("intake_id","workspace_id") REFERENCES "public"."business_intake"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_draft_workspaceId_idx" ON "business_draft" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "business_positioning_choice" ADD CONSTRAINT "business_positioning_choice_draft_fk" FOREIGN KEY ("draft_id","intake_id","workspace_id") REFERENCES "public"."business_draft"("id","intake_id","workspace_id") ON DELETE cascade ON UPDATE no action;