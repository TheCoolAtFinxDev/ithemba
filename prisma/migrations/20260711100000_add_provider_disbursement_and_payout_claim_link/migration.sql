-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "disbursementEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment_payouts" ADD COLUMN     "claimId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "failureReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payment_payouts_claimId_key" ON "payment_payouts"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_payouts_idempotencyKey_key" ON "payment_payouts"("idempotencyKey");
