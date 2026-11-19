CREATE TABLE "business_positioning_choice" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"intake_id" text NOT NULL,
	"kind" text NOT NULL,
	"statement" text,
	"draft_id" text,
	"option" smallint,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_positioning_choice_kind_check" CHECK ("business_positioning_choice"."kind" in ('picked', 'edited', 'written', 'skipped')),
	CONSTRAINT "business_positioning_choice_statement_check" CHECK ("business_positioning_choice"."statement" is null or char_length("business_positioning_choice"."statement") between 1 and 300),
	CONSTRAINT "business_positioning_choice_option_check" CHECK ("business_positioning_choice"."option" is null or "business_positioning_choice"."option" between 1 and 3),
	CONSTRAINT "business_positioning_choice_shape" CHECK (("business_positioning_choice"."kind" in ('picked', 'edited')) = ("business_positioning_choice"."draft_id" is not null and "business_positioning_choice"."option" is not null) and ("business_positioning_choice"."kind" <> 'skipped') = ("business_positioning_choice"."statement" is not null) and ("business_positioning_choice"."draft_id" is null) = ("business_positioning_choice"."option" is null))
);
--> statement-breakpoint
ALTER TABLE "business_positioning_choice" ADD CONSTRAINT "business_positioning_choice_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_positioning_choice" ADD CONSTRAINT "business_positioning_choice_intake_fk" FOREIGN KEY ("intake_id","workspace_id") REFERENCES "public"."business_intake"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_positioning_choice_workspaceId_idx" ON "business_positioning_choice" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "business_positioning_choice_intake_created_idx" ON "business_positioning_choice" USING btree ("intake_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_positioning_choice_one_agreed" ON "business_positioning_choice" USING btree ("intake_id") WHERE "business_positioning_choice"."kind" <> 'skipped';