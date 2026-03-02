ALTER TABLE "pricing" DROP COLUMN IF EXISTS "maple_syrup_price_cents";
ALTER TABLE "pricing" ADD COLUMN "maple_syrup_pint_cents" integer NOT NULL DEFAULT 1200;
ALTER TABLE "pricing" ADD COLUMN "maple_syrup_quart_cents" integer NOT NULL DEFAULT 2000;
ALTER TABLE "pricing" ADD COLUMN "maple_syrup_half_gallon_cents" integer NOT NULL DEFAULT 3500;
ALTER TABLE "pricing" ADD COLUMN "maple_syrup_gallon_cents" integer NOT NULL DEFAULT 6000;
