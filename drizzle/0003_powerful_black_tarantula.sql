ALTER TABLE "money_profile" ADD COLUMN "credit_card_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "credit_card_minor" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "money_profile" ADD COLUMN "emi_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "emi_minor" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "money_profile" ADD COLUMN "others_minor" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "money_profile" ALTER COLUMN "others_minor" DROP DEFAULT;
