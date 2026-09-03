import { prisma } from "@/server/db/client";

export class MaintenanceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listMaintenanceRecords() {
  return prisma.maintenanceRecord.findMany({ orderBy: { startedAt: "desc" } });
}

export async function startMaintenance(quarterId: number, remark: string) {
  const quarter = await prisma.quarter.findUnique({ where: { id: quarterId } });
  if (!quarter) {
    throw new MaintenanceError("Quarter not found.", 404);
  }
  if (quarter.status !== "VACANT" && quarter.status !== "OCCUPIED") {
    throw new MaintenanceError("Only vacant or occupied quarters can be sent for maintenance.", 409);
  }
  if (quarter.underMaintenance) {
    throw new MaintenanceError("This quarter is already under maintenance.", 409);
  }

  const [record] = await prisma.$transaction([
    prisma.maintenanceRecord.create({
      data: {
        quarterId: quarter.id,
        colony: quarter.colony,
        quarterNo: quarter.quarterNo,
        statusBeforeMaintenance: quarter.status,
        condition: quarter.condition,
        serviceNo: quarter.serviceNo,
        rank: quarter.rank,
        name: quarter.name,
        unit: quarter.unit,
        remark,
      },
    }),
    prisma.quarter.update({ where: { id: quarter.id }, data: { underMaintenance: true } }),
  ]);

  return record;
}

export async function completeMaintenance(recordId: number, remark: string) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
  if (!record) {
    throw new MaintenanceError("Maintenance record not found.", 404);
  }
  if (record.status !== "IN_PROGRESS") {
    throw new MaintenanceError("This maintenance record is already completed.", 409);
  }

  const [updated] = await prisma.$transaction([
    prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: { status: "COMPLETED", completedRemark: remark || null, endedAt: new Date() },
    }),
    prisma.quarter.update({ where: { id: record.quarterId }, data: { underMaintenance: false } }),
  ]);

  return updated;
}

export async function deleteMaintenanceRecord(recordId: number) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
  if (!record) {
    throw new MaintenanceError("Maintenance record not found.", 404);
  }
  if (record.status !== "COMPLETED") {
    throw new MaintenanceError("Cannot delete a maintenance record that is still in progress.", 409);
  }

  await prisma.maintenanceRecord.delete({ where: { id: recordId } });
}
