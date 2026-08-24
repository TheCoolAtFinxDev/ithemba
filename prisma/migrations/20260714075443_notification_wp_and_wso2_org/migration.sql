-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "advanceReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "finalReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "wso2OrganizationId" TEXT;

-- AlterTable
ALTER TABLE "health_savings_accounts" ADD COLUMN     "lastLowBalanceNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "reminderAdvanceHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "wso2OrganizationId" TEXT;
