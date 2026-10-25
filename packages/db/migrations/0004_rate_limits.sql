CREATE TABLE "rate_limit_counter" (
	"key" text NOT NULL,
	"window_start" bigint NOT NULL,
	"window_end" bigint NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_limit_counter_key_window_start_window_end_pk" PRIMARY KEY("key","window_start","window_end"),
	CONSTRAINT "rate_limit_counter_count_check" CHECK ("rate_limit_counter"."count" >= 1),
	CONSTRAINT "rate_limit_counter_window_check" CHECK ("rate_limit_counter"."window_end" > "rate_limit_counter"."window_start"),
	CONSTRAINT "rate_limit_counter_key_check" CHECK (char_length("rate_limit_counter"."key") <= 200)
);
--> statement-breakpoint
CREATE INDEX "rate_limit_counter_window_end_idx" ON "rate_limit_counter" USING btree ("window_end");