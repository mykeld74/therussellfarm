-- Switch slot capacity from "one group" to wagon seat units (adult=2, kid=1, full=16).
UPDATE "availability_slots" SET "max_capacity" = 16 WHERE "max_capacity" < 16;--> statement-breakpoint
ALTER TABLE "availability_slots" ALTER COLUMN "max_capacity" SET DEFAULT 16;
