CREATE TABLE "business_intake" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"version" text NOT NULL,
	"idea" text NOT NULL,
	"industry" text,
	"customers" text,
	"problem" text,
	"competitors" text,
	"value" text,
	"website" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_intake_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "business_intake_version_check" CHECK ("business_intake"."version" = 'intake-1'),
	CONSTRAINT "business_intake_idea_check" CHECK (char_length("business_intake"."idea") between 1 and 2000),
	CONSTRAINT "business_intake_industry_check" CHECK ("business_intake"."industry" is null or char_length("business_intake"."industry") between 1 and 2000),
	CONSTRAINT "business_intake_customers_check" CHECK ("business_intake"."customers" is null or char_length("business_intake"."customers") between 1 and 2000),
	CONSTRAINT "business_intake_problem_check" CHECK ("business_intake"."problem" is null or char_length("business_intake"."problem") between 1 and 2000),
	CONSTRAINT "business_intake_competitors_check" CHECK ("business_intake"."competitors" is null or char_length("business_intake"."competitors") between 1 and 2000),
	CONSTRAINT "business_intake_value_check" CHECK ("business_intake"."value" is null or char_length("business_intake"."value") between 1 and 2000),
	CONSTRAINT "business_intake_website_check" CHECK ("business_intake"."website" is null or char_length("business_intake"."website") between 1 and 2048)
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_id_workspace_unique" UNIQUE("id","workspace_id");
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_name_check" CHECK (char_length("project"."name") between 1 and 120);
--> statement-breakpoint
ALTER TABLE "business_intake" ADD CONSTRAINT "business_intake_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "business_intake" ADD CONSTRAINT "business_intake_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "business_intake_workspaceId_idx" ON "business_intake" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "business_intake_project_created_idx" ON "business_intake" USING btree ("project_id","created_at");