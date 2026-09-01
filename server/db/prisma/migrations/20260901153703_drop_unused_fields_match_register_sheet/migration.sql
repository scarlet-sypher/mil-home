/*
  Warnings:

  - You are about to drop the column `committeeStatus` on the `allotments` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `eligibleType` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `entitlement` on the `quarters` table. All the data in the column will be lost.
  - You are about to drop the column `qtype` on the `quarters` table. All the data in the column will be lost.
  - You are about to drop the column `certificateRef` on the `vacations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "allotments" DROP COLUMN "committeeStatus";

-- AlterTable
ALTER TABLE "applicants" DROP COLUMN "category",
DROP COLUMN "eligibleType";

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "assignedTo",
DROP COLUMN "category";

-- AlterTable
ALTER TABLE "quarters" DROP COLUMN "entitlement",
DROP COLUMN "qtype";

-- AlterTable
ALTER TABLE "vacations" DROP COLUMN "certificateRef";
