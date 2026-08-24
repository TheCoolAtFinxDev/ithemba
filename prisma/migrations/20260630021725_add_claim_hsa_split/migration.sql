-- AlterTable
ALTER TABLE "provider_claims" ADD COLUMN     "hsaCoveredAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "outOfPocketAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
