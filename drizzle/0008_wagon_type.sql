CREATE TYPE "public"."wagon_type" AS ENUM('horse', 'tractor');--> statement-breakpoint
ALTER TABLE "availability_slots" ADD COLUMN "wagon_type" "wagon_type" DEFAULT 'horse' NOT NULL;
