import { prisma } from "@/server/db/client";
import { determineClearanceStatus } from "@/server/lib/vacation-clearance";

export class VacationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listVacations() {
  return prisma.vacation.findMany({
    include: { quarter: true, applicant: true },
    orderBy: { requestDate: "desc" },
  });
}

export async function createVacation(input: { quarterId: number; applicantId: number }) {
  const allotment = await prisma.allotment.findFirst({
    where: { quarterId: input.quarterId, applicantId: input.applicantId, authorityStatus: "APPROVED" },
  });
  if (!allotment) {
    throw new VacationError("This resident is not currently allotted to this quarter.", 409);
  }

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
      await tx.quarter.update({
        where: { id: vacation.quarterId },
        data: { status: "VACANT", serviceNo: null, rank: null, name: null, unit: null },
      });
      await tx.applicant.update({ where: { id: vacation.applicantId }, data: { status: "WAITING" } });
    }
    return vacation;
  });
}
