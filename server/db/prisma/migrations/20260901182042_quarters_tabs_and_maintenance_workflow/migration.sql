-- AlterTable
ALTER TABLE "quarters" ADD COLUMN     "maintenanceCompletedRemark" TEXT,
ADD COLUMN     "maintenanceEndedAt" TIMESTAMP(3),
ADD COLUMN     "maintenanceRemark" TEXT,
ADD COLUMN     "maintenanceStartedAt" TIMESTAMP(3),
ADD COLUMN     "maintenanceStatus" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "rank" TEXT,
ADD COLUMN     "serviceNo" TEXT,
ADD COLUMN     "statusBeforeMaintenance" TEXT,
ADD COLUMN     "unit" TEXT;
