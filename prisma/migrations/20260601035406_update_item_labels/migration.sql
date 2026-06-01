/*
  Warnings:

  - The values [RECOMMENDED,FAVORITE,MUST_TRY,NEW,KIDS_CHOICE] on the enum `ItemLabel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ItemLabel_new" AS ENUM ('NEW_MENU', 'BEST_SELLER', 'CHEF_RECOMMENDATION', 'MENU_FAVORITE', 'SPICY', 'VEGETARIAN', 'SIGNATURE_MENU', 'KIDS_MENU', 'FAST_SERVE');
ALTER TABLE "items" ALTER COLUMN "labels" TYPE "ItemLabel_new"[] USING ("labels"::text::"ItemLabel_new"[]);
ALTER TYPE "ItemLabel" RENAME TO "ItemLabel_old";
ALTER TYPE "ItemLabel_new" RENAME TO "ItemLabel";
DROP TYPE "public"."ItemLabel_old";
COMMIT;
