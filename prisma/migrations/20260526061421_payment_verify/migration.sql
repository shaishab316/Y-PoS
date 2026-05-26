-- AlterTable
ALTER TABLE "users" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessLogoUrl" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessPhone" TEXT;

-- CreateTable
CREATE TABLE "payment_verifies" (
    "id" SERIAL NOT NULL,
    "date" DATE,
    "totalAmount" DECIMAL(10,2),
    "actualAmount" DECIMAL(10,2),
    "remark" TEXT,
    "proofImages" TEXT[],
    "verifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" INTEGER,

    CONSTRAINT "payment_verifies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_verifies" ADD CONSTRAINT "payment_verifies_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
