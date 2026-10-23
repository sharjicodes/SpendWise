ALTER TABLE "money_profile" ADD COLUMN "rent_living_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "rent_living_minor" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "money_profile" ADD COLUMN "savings_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "savings_minor" DROP DEFAULT;--> statement-breakpoint
CREATE UNIQUE INDEX "salary_cycle_owner_start_uq" ON "salary_cycle" USING btree ("user_id","starts_on");
