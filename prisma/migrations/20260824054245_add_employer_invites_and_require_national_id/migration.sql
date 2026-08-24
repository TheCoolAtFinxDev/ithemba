/*
  Warnings:

  - Made the column `nationalId` on table `patients` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EmployerInviteStatus" AS ENUM ('Pending', 'Accepted', 'Expired', 'Cancelled');

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "nationalId" SET NOT NULL;

-- CreateTable
CREATE TABLE "employer_invites" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "employeeRef" TEXT NOT NULL,
    "contributionAmount" DECIMAL(10,2) NOT NULL,
    "status" "EmployerInviteStatus" NOT NULL DEFAULT 'Pending',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "employer_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employer_invites_token_key" ON "employer_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "employer_invites_employerId_employeeRef_key" ON "employer_invites"("employerId", "employeeRef");

-- AddForeignKey
ALTER TABLE "employer_invites" ADD CONSTRAINT "employer_invites_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
