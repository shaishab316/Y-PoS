-- AlterTable
ALTER TABLE "payment_verifies" ADD COLUMN     "actualIncomeCash" DECIMAL(10,2),
ADD COLUMN     "actualSales" DECIMAL(10,2),
ADD COLUMN     "actualTransfer" DECIMAL(10,2),
ADD COLUMN     "cashDeposit" TEXT[],
ADD COLUMN     "cashIn" DECIMAL(10,2),
ADD COLUMN     "closingCash" DECIMAL(10,2),
ADD COLUMN     "expenseRemark" TEXT,
ADD COLUMN     "expensesCash" DECIMAL(10,2),
ADD COLUMN     "incomeCash" DECIMAL(10,2),
ADD COLUMN     "incomeTransfer" DECIMAL(10,2),
ADD COLUMN     "openingCash" DECIMAL(10,2),
ADD COLUMN     "totalOpeningCash" DECIMAL(10,2),
ADD COLUMN     "totalSales" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "payment_verifies_date_idx" ON "payment_verifies"("date");
