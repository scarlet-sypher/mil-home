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

// The current quarter-to-resident pairs: one row per quarter that is presently
// occupied through an approved allotment. Complaints and Vacations use this as
// the single source of truth so their Quarter/Resident pickers can never
// mismatch a resident with a quarter they don't actually live in.
export async function listActiveAllotmentPairs() {
  const allotments = await prisma.allotment.findMany({
    where: { authorityStatus: "APPROVED" },
    include: { applicant: true, quarter: true },
    orderBy: { quarter: { quarterNo: "asc" } },
  });

  return allotments.map((a) => ({
    quarterId: a.quarterId,
    quarterNo: a.quarter.quarterNo,
    colony: a.quarter.colony,
    applicantId: a.applicantId,
    name: a.applicant.name,
    serviceNo: a.applicant.serviceNo,
  }));
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
  const allotment = await prisma.allotment.findUnique({ where: { id }, include: { applicant: true } });
  if (!allotment) {
    throw new AllotmentError("Allotment not found.", 404);
  }
  if (allotment.authorityStatus !== "PENDING") {
    throw new AllotmentError("This allotment has already been decided.", 409);
  }

  const orderRef = formatOrderRef(id);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allotment.update({
      where: { id },
      data: { authorityStatus: "APPROVED", orderRef },
    });
    await tx.applicant.update({ where: { id: allotment.applicantId }, data: { status: "ALLOTTED" } });
    await tx.quarter.update({
      where: { id: allotment.quarterId },
      data: {
        status: "OCCUPIED",
        serviceNo: allotment.applicant.serviceNo,
        rank: allotment.applicant.rank,
        name: allotment.applicant.name,
        unit: allotment.applicant.unit,
      },
    });
    return updated;
  });
}

export async function rejectAllotment(id: number) {
  const allotment = await prisma.allotment.findUnique({ where: { id } });
  if (!allotment) {
    throw new AllotmentError("Allotment not found.", 404);
  }
  if (allotment.authorityStatus !== "PENDING") {
    throw new AllotmentError("This allotment has already been decided.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allotment.update({ where: { id }, data: { authorityStatus: "REJECTED" } });
    await tx.quarter.update({ where: { id: allotment.quarterId }, data: { status: "VACANT" } });
    return updated;
  });
}

export async function reallocateAllotment(id: number) {
  const allotment = await prisma.allotment.findUnique({ where: { id }, include: { applicant: true, quarter: true } });
  if (!allotment) {
    throw new AllotmentError("Allotment not found.", 404);
  }
  if (allotment.authorityStatus !== "UNALLOCATED") {
    throw new AllotmentError("Only an unallocated allotment can be re-allocated.", 409);
  }
  if (allotment.quarter.status !== "VACANT" || allotment.quarter.condition !== "FIT" || allotment.quarter.underMaintenance) {
    throw new AllotmentError("Quarter is not available.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allotment.update({ where: { id }, data: { authorityStatus: "APPROVED" } });
    await tx.applicant.update({ where: { id: allotment.applicantId }, data: { status: "ALLOTTED" } });
    await tx.quarter.update({
      where: { id: allotment.quarterId },
      data: {
        status: "OCCUPIED",
        serviceNo: allotment.applicant.serviceNo,
        rank: allotment.applicant.rank,
        name: allotment.applicant.name,
        unit: allotment.applicant.unit,
      },
    });
    return updated;
  });
}

export async function unallocateAllotment(id: number) {
  const allotment = await prisma.allotment.findUnique({ where: { id }, include: { quarter: true } });
  if (!allotment) {
    throw new AllotmentError("Allotment not found.", 404);
  }
  if (allotment.authorityStatus !== "APPROVED") {
    throw new AllotmentError("Only an approved allotment can be unallocated.", 409);
  }
  if (allotment.quarter.underMaintenance) {
    throw new AllotmentError("Cannot unallocate: this quarter is currently under maintenance.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allotment.update({ where: { id }, data: { authorityStatus: "UNALLOCATED" } });
    await tx.applicant.update({ where: { id: allotment.applicantId }, data: { status: "WAITING" } });
    await tx.quarter.update({
      where: { id: allotment.quarterId },
      data: { status: "VACANT", serviceNo: null, rank: null, name: null, unit: null },
    });
    return updated;
  });
}
