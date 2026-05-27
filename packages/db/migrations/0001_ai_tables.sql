CREATE TABLE "ai_usage" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"sonnet_in" integer DEFAULT 0 NOT NULL,
	"sonnet_out" integer DEFAULT 0 NOT NULL,
	"opus_in" integer DEFAULT 0 NOT NULL,
	"opus_out" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "tutor_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" text,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tokens_in" integer,
	"tokens_out" integer,
	"cache_read_input_tokens" integer,
	"cache_creation_input_tokens" integer,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_messages_role_check" CHECK ("tutor_messages"."role" in ('user', 'assistant'))
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tutor_messages_conversation_created" ON "tutor_messages" USING btree ("conversation_id","created_at");
