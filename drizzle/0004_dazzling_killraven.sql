ALTER TABLE "money_profile" ADD COLUMN "other_commitments_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "other_commitments_minor" DROP DEFAULT;
