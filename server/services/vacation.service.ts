import { prisma } from "@/server/db/client";
import { determineClearanceStatus } from "@/server/lib/vacation-clearance";

export async function listVacations() {
  return prisma.vacation.findMany({
    include: { quarter: true, applicant: true },
    orderBy: { requestDate: "desc" },
  });
}

export async function createVacation(input: { quarterId: number; applicantId: number }) {
  return prisma.vacation.create({ data: { quarterId: input.quarterId, applicantId: input.applicantId } });
}

export async function inspectVacation(id: number, defects: string) {
  const trimmedDefects = defects.trim();
  const clearanceStatus = determineClearanceStatus(trimmedDefects);

  return prisma.$transaction(async (tx) => {
    const vacation = await tx.vacation.update({
      where: { id },
      data: { inspectionStatus: "INSPECTED", defects: trimmedDefects || null, clearanceStatus },
    });
    if (clearanceStatus === "CLEARED") {
      await tx.quarter.update({ where: { id: vacation.quarterId }, data: { status: "VACANT" } });
      await tx.applicant.update({ where: { id: vacation.applicantId }, data: { status: "WAITING" } });
    }
    return vacation;
  });
}
