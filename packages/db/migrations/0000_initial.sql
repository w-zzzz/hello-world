CREATE TYPE "public"."xp_event_kind" AS ENUM('lesson_complete', 'quiz_perfect', 'streak_bonus', 'daily_challenge', 'achievement');--> statement-breakpoint
CREATE TABLE "lesson_completions" (
	"user_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score" numeric(5, 2),
	"attempts" integer DEFAULT 1 NOT NULL,
	"time_spent_s" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lesson_completions_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"longest" integer DEFAULT 0 NOT NULL,
	"last_active_date" date DEFAULT CURRENT_DATE NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text,
	"dev_session_id" text,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"locale" text DEFAULT 'zh' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prefs" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "xp_event_kind" NOT NULL,
	"amount" integer NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_unique" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_unique" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_dev_session_id_unique" ON "users" USING btree ("dev_session_id");--> statement-breakpoint
CREATE INDEX "xp_events_user_created" ON "xp_events" USING btree ("user_id","created_at" DESC);