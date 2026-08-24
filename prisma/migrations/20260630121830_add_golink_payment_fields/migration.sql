
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Processing', 'Succeeded', 'Failed');

-- AlterTable
ALTER TABLE "auto_debit_setups" ADD COLUMN     "golinkMandateId" TEXT;

-- AlterTable
ALTER TABLE "savings_transactions" ADD COLUMN     "golinkPaymentId" TEXT,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'Succeeded';

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_golinkPaymentId_key" ON "savings_transactions"("golinkPaymentId");

