-- CreateEnum
CREATE TYPE "EmployerMemberStatus" AS ENUM ('Active', 'Suspended', 'Terminated');

-- CreateEnum
CREATE TYPE "EmployerPaymentMethod" AS ENUM ('Manual', 'Mpesa', 'EcoCash', 'Card', 'EFT', 'PaymentLink', 'Payslip');

-- CreateEnum
CREATE TYPE "BillingCycleStatus" AS ENUM ('Draft', 'Invoiced', 'AwaitingPayment', 'Paid', 'Overdue', 'Failed');

-- AlterEnum
ALTER TYPE "SavingsTransactionType" ADD VALUE 'EmployerContribution';

-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactUserProfileId" TEXT,
    "platformFeePerSeat" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_memberships" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "employeeRef" TEXT NOT NULL,
    "contributionAmount" DECIMAL(10,2) NOT NULL,
    "status" "EmployerMemberStatus" NOT NULL DEFAULT 'Active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "employer_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_billing_cycles" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "EmployerPaymentMethod" NOT NULL DEFAULT 'Manual',
    "golinkPaymentLink" TEXT,
    "golinkTransactionId" TEXT,
    "status" "BillingCycleStatus" NOT NULL DEFAULT 'Draft',
    "invoicedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_billing_line_items" (
    "id" TEXT NOT NULL,
    "billingCycleId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeRef" TEXT NOT NULL,
    "contributionAmount" DECIMAL(10,2) NOT NULL,
    "hsaCredited" BOOLEAN NOT NULL DEFAULT false,
    "hsaCreditedAt" TIMESTAMP(3),

    CONSTRAINT "employer_billing_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employers_contactUserProfileId_key" ON "employers"("contactUserProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_memberships_employerId_patientId_key" ON "employer_memberships"("employerId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_memberships_employerId_employeeRef_key" ON "employer_memberships"("employerId", "employeeRef");

-- CreateIndex
CREATE UNIQUE INDEX "employer_billing_cycles_invoiceNumber_key" ON "employer_billing_cycles"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employer_billing_cycles_employerId_billingMonth_key" ON "employer_billing_cycles"("employerId", "billingMonth");

-- CreateIndex
CREATE UNIQUE INDEX "employer_billing_line_items_billingCycleId_membershipId_key" ON "employer_billing_line_items"("billingCycleId", "membershipId");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_contactUserProfileId_fkey" FOREIGN KEY ("contactUserProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_memberships" ADD CONSTRAINT "employer_memberships_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_memberships" ADD CONSTRAINT "employer_memberships_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_billing_cycles" ADD CONSTRAINT "employer_billing_cycles_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_billing_line_items" ADD CONSTRAINT "employer_billing_line_items_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "employer_billing_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_billing_line_items" ADD CONSTRAINT "employer_billing_line_items_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "employer_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
