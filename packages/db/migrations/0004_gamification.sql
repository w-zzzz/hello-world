CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_zh" text NOT NULL,
	"description_en" text NOT NULL,
	"description_zh" text NOT NULL,
	"icon" text NOT NULL,
	"xp_bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_slug_unique" ON "achievements" USING btree ("slug");--> statement-breakpoint
-- Seed the canonical achievement catalog. Mirrors packages/gamification/src/achievements.ts.
-- ON CONFLICT DO NOTHING keeps the migration idempotent if reapplied against a DB that
-- already has these slugs (e.g. a partial replay).
INSERT INTO "achievements" ("slug","name_en","name_zh","description_en","description_zh","icon","xp_bonus") VALUES
  ('first-lesson','First Steps','迈出第一步','Complete your first lesson.','完成你的第一节课。','sparkles',25),
  ('five-lessons','Getting Started','渐入佳境','Complete 5 distinct lessons.','完成 5 节不同的课程。','award',50),
  ('ten-lessons','In the Groove','登堂入室','Complete 10 distinct lessons.','完成 10 节不同的课程。','award',75),
  ('track-a-complete','Market Fundamentals','市场基础大师','Complete every lesson in Track A.','完成 A 轨道所有课程。','trophy',200),
  ('track-b-complete','Indicator Master','指标大师','Complete every lesson in Track B.','完成 B 轨道所有课程。','trophy',500),
  ('track-c-complete','Signal Architect','信号构造师','Complete every lesson in Track C.','完成 C 轨道所有课程。','trophy',200),
  ('streak-7','One Week Streak','七日连击','Maintain a 7-day learning streak.','保持 7 天连续学习。','flame',100),
  ('streak-30','One Month Streak','月度连击','Maintain a 30-day learning streak.','保持 30 天连续学习。','flame',500)
ON CONFLICT ("slug") DO NOTHING;
