/*
  Warnings:

  - You are about to drop the column `qrCode` on the `tables` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tables" DROP COLUMN "qrCode",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "tableNumber" SET DATA TYPE TEXT;
