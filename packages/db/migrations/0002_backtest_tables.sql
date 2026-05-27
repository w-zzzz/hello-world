CREATE TABLE "backtest_results" (
	"run_id" uuid PRIMARY KEY NOT NULL,
	"metrics" jsonb NOT NULL,
	"equity" jsonb NOT NULL,
	"trades" jsonb NOT NULL,
	"drawdown_periods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rolling" jsonb,
	"benchmark_metrics" jsonb,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backtest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preset" text,
	"config_hash" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "backtest_runs_status_check" CHECK ("backtest_runs"."status" in ('queued', 'running', 'succeeded', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "backtest_results" ADD CONSTRAINT "backtest_results_run_id_backtest_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."backtest_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backtest_runs_user_queued" ON "backtest_runs" USING btree ("user_id","queued_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "backtest_runs_config_hash_succeeded" ON "backtest_runs" USING btree ("config_hash") WHERE "backtest_runs"."status" = 'succeeded';