-- CreateEnum
CREATE TYPE "PaymentVerificationStatus" AS ENUM ('PENDING', 'MATCH', 'MISMATCH');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "verificationStatus" "PaymentVerificationStatus" NOT NULL DEFAULT 'PENDING';
