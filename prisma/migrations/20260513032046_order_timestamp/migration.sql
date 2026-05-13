-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3);
