CREATE TABLE "direction" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "direction_id_workspace_unique" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "direction_version" (
	"id" text PRIMARY KEY NOT NULL,
	"direction_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"status" text NOT NULL,
	"number" integer,
	"snapshot" jsonb NOT NULL,
	"fingerprint" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	CONSTRAINT "direction_version_number_unique" UNIQUE("direction_id","number"),
	CONSTRAINT "direction_version_approved_shape" CHECK (("direction_version"."status" = 'approved') = ("direction_version"."number" is not null and "direction_version"."approved_by" is not null and "direction_version"."approved_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "direction" ADD CONSTRAINT "direction_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direction" ADD CONSTRAINT "direction_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direction_version" ADD CONSTRAINT "direction_version_direction_fk" FOREIGN KEY ("direction_id","workspace_id") REFERENCES "public"."direction"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "direction_workspaceId_idx" ON "direction" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "direction_version_workspaceId_idx" ON "direction_version" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "direction_version_one_draft" ON "direction_version" USING btree ("direction_id") WHERE "direction_version"."status" = 'draft';