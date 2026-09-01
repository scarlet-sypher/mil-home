import { prisma } from "@/server/db/client";
import { formatOrderRef } from "@/server/lib/order-ref";

export class AllotmentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listAllotments() {
  return prisma.allotment.findMany({
    include: { applicant: true, quarter: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAllotment(applicantId: number, quarterId: number) {
  const [applicant, quarter] = await Promise.all([
    prisma.applicant.findUnique({ where: { id: applicantId } }),
    prisma.quarter.findUnique({ where: { id: quarterId } }),
  ]);

  if (!applicant || !quarter) {
    throw new AllotmentError("Applicant or quarter not found.", 404);
  }
  if (quarter.status !== "VACANT" || quarter.condition !== "FIT") {
    throw new AllotmentError("Quarter is not available.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.allotment.create({ data: { applicantId, quarterId } });
    await tx.quarter.update({ where: { id: quarterId }, data: { status: "RESERVED" } });
    return created;
  });
}

export async function approveAllotment(id: number) {
  const allotment = await prisma.allotment.findUnique({ where: { id } });
  if (!allotment) {
    throw new AllotmentError("Allotment not found.", 404);
  }

  const orderRef = formatOrderRef(id);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allotment.update({
      where: { id },
      data: { committeeStatus: "APPROVED", authorityStatus: "APPROVED", orderRef },
    });
    await tx.applicant.update({ where: { id: allotment.applicantId }, data: { status: "ALLOTTED" } });
    await tx.quarter.update({ where: { id: allotment.quarterId }, data: { status: "OCCUPIED" } });
    return updated;
  });
}
