-- CreateTable
CREATE TABLE "additional_pricing_adjustments" (
    "id" SERIAL NOT NULL,
    "level" TEXT DEFAULT 'Unknown Adjustment',
    "percentage" DECIMAL(10,2),
    "fixedAmount" DECIMAL(10,2),
    "type" "PricingAdjustmentType" NOT NULL DEFAULT 'PERCENTAGE',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "additional_pricing_adjustments_pkey" PRIMARY KEY ("id")
);
