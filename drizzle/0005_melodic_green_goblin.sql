ALTER TABLE "salary_cycle" ADD COLUMN "already_spent_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "salary_cycle" ALTER COLUMN "already_spent_minor" DROP DEFAULT;
