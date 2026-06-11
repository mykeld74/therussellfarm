UPDATE "bookings" SET "status" = 'confirmed' WHERE "status" = 'pending';--> statement-breakpoint
ALTER TYPE "public"."booking_status" RENAME TO "booking_status_old";--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled');--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "public"."booking_status" USING "status"::text::"public"."booking_status";--> statement-breakpoint
DROP TYPE "public"."booking_status_old";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'confirmed';
