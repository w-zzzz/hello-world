CREATE UNIQUE INDEX "xp_events_lesson_complete_unique"
  ON "xp_events" ("user_id","ref_id") WHERE "kind" = 'lesson_complete';
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"hit_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "rate_limits_user_action_hit" ON "rate_limits" USING btree ("user_id","action","hit_at" DESC NULLS LAST);
