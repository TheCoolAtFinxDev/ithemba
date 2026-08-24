-- CreateTable
CREATE TABLE "claim_line_items" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_line_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "claim_line_items" ADD CONSTRAINT "claim_line_items_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "provider_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
