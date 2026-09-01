import { prisma } from "@/server/db/client";
import type { QuarterUpdateInput } from "@/server/lib/validators";

export class QuarterError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listQuarters() {
  return prisma.quarter.findMany({ orderBy: [{ colony: "asc" }, { quarterNo: "asc" }] });
}

export async function listAvailableQuarters() {
  return prisma.quarter.findMany({ where: { status: "VACANT", condition: "FIT" }, orderBy: { quarterNo: "asc" } });
}

export async function listOccupiedQuarters() {
  return prisma.quarter.findMany({ where: { status: "OCCUPIED" }, orderBy: { quarterNo: "asc" } });
}

export async function createVacantQuarter(input: { quarterNo: string; colony: string; condition: string }) {
  return prisma.quarter.create({
    data: {
      quarterNo: input.quarterNo,
      colony: input.colony,
      condition: input.condition,
      status: "VACANT",
    },
  });
}

export async function createOccupiedQuarter(input: {
  serviceNo: string;
  rank: string;
  name: string;
  unit: string;
  quarterNo: string;
  colony: string;
  condition: string;
}) {
  return prisma.quarter.create({
    data: {
      serviceNo: input.serviceNo,
      rank: input.rank,
      name: input.name,
      unit: input.unit,
      quarterNo: input.quarterNo,
      colony: input.colony,
      condition: input.condition,
      status: "OCCUPIED",
    },
  });
}

export async function updateQuarter(id: number, input: QuarterUpdateInput) {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }
  if (quarter.maintenanceStatus === "COMPLETED") {
    throw new QuarterError("This record went through maintenance and can no longer be edited.", 409);
  }

  return prisma.quarter.update({ where: { id }, data: input });
}

export async function deleteQuarter(id: number) {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }

  try {
    await prisma.quarter.delete({ where: { id } });
  } catch {
    throw new QuarterError(
      "Cannot delete this quarter: it has related allotment, complaint, or vacation records.",
      409,
    );
  }
}

export async function startMaintenance(id: number, remark: string) {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }
  if (quarter.status !== "VACANT" && quarter.status !== "OCCUPIED") {
    throw new QuarterError("Only vacant or occupied quarters can be sent for maintenance.", 409);
  }

  return prisma.quarter.update({
    where: { id },
    data: {
      statusBeforeMaintenance: quarter.status,
      status: "UNDER_MAINTENANCE",
      maintenanceStatus: "IN_PROGRESS",
      maintenanceRemark: remark,
      maintenanceStartedAt: new Date(),
      maintenanceEndedAt: null,
      maintenanceCompletedRemark: null,
    },
  });
}

export async function completeMaintenance(id: number, remark: string) {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }
  if (quarter.maintenanceStatus !== "IN_PROGRESS") {
    throw new QuarterError("This quarter is not currently under maintenance.", 409);
  }

  return prisma.quarter.update({
    where: { id },
    data: {
      status: "VACANT",
      maintenanceStatus: "COMPLETED",
      maintenanceCompletedRemark: remark || null,
      maintenanceEndedAt: new Date(),
      serviceNo: null,
      rank: null,
      name: null,
      unit: null,
    },
  });
}
