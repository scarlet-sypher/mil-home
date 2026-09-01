/*
  Warnings:

  - You are about to drop the column `resident` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `occupant` on the `vacations` table. All the data in the column will be lost.
  - Added the required column `applicantId` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantId` to the `vacations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applicants" ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "resident",
ADD COLUMN     "applicantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "vacations" DROP COLUMN "occupant",
ADD COLUMN     "applicantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
