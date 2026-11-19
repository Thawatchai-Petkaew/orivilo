CREATE TABLE "business_foundation_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"node" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "business_foundation_entry_one_per_kind" UNIQUE("project_id","node","kind"),
	CONSTRAINT "business_foundation_entry_pair" CHECK (("business_foundation_entry"."node", "business_foundation_entry"."kind") in (('identity-frame', 'given'), ('identity-frame', 'skipped'), ('architecture', 'answered'), ('name', 'given'), ('core-idea', 'written'), ('core-idea', 'skipped'))),
	CONSTRAINT "business_foundation_entry_payload_shape" CHECK (jsonb_typeof("business_foundation_entry"."payload") = 'object' and ("business_foundation_entry"."kind" = 'skipped') = ("business_foundation_entry"."payload" = '{}'::jsonb)),
	CONSTRAINT "business_foundation_entry_text" CHECK ((("business_foundation_entry"."payload" ? 'person') is false or (jsonb_typeof("business_foundation_entry"."payload"->'person') = 'string' and char_length("business_foundation_entry"."payload"->>'person') between 1 and 2000)) and (("business_foundation_entry"."payload" ? 'never') is false or (jsonb_typeof("business_foundation_entry"."payload"->'never') = 'string' and char_length("business_foundation_entry"."payload"->>'never') between 1 and 2000)) and (("business_foundation_entry"."payload" ? 'remember') is false or (jsonb_typeof("business_foundation_entry"."payload"->'remember') = 'string' and char_length("business_foundation_entry"."payload"->>'remember') between 1 and 2000)) and (("business_foundation_entry"."payload" ? 'name') is false or (jsonb_typeof("business_foundation_entry"."payload"->'name') = 'string' and char_length("business_foundation_entry"."payload"->>'name') between 1 and 60)) and (("business_foundation_entry"."payload" ? 'statement') is false or (jsonb_typeof("business_foundation_entry"."payload"->'statement') = 'string' and char_length("business_foundation_entry"."payload"->>'statement') between 1 and 300)))
);
--> statement-breakpoint
ALTER TABLE "business_foundation_entry" ADD CONSTRAINT "business_foundation_entry_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_foundation_entry" ADD CONSTRAINT "business_foundation_entry_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_foundation_entry_workspaceId_idx" ON "business_foundation_entry" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "business_foundation_entry_project_created_idx" ON "business_foundation_entry" USING btree ("project_id","created_at");