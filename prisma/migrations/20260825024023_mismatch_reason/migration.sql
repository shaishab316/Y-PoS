-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "correctAmount" DECIMAL(10,2),
ADD COLUMN     "mismatchReason" TEXT;
