-- AlterTable
ALTER TABLE "quarters" DROP COLUMN "maintenanceCompletedRemark",
DROP COLUMN "maintenanceEndedAt",
DROP COLUMN "maintenanceRemark",
DROP COLUMN "maintenanceStartedAt",
DROP COLUMN "maintenanceStatus",
DROP COLUMN "statusBeforeMaintenance",
ADD COLUMN     "underMaintenance" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" SERIAL NOT NULL,
    "quarterId" INTEGER NOT NULL,
    "colony" TEXT NOT NULL,
    "quarterNo" TEXT NOT NULL,
    "statusBeforeMaintenance" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "serviceNo" TEXT,
    "rank" TEXT,
    "name" TEXT,
    "unit" TEXT,
    "remark" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "completedRemark" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

