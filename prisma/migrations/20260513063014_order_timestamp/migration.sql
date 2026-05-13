/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "updatedAt",
ADD COLUMN     "pickedUpAt" TIMESTAMP(3);
