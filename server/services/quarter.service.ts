import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { QuarterUpdateInput } from "@/server/lib/validators";

export class QuarterError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status = 400, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

function isDuplicateQuarterNo(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("quarterNo")
  );
}

export async function listQuarters() {
  return prisma.quarter.findMany({ orderBy: [{ colony: "asc" }, { quarterNo: "asc" }] });
}

export async function listAvailableQuarters() {
  return prisma.quarter.findMany({
    where: { status: "VACANT", condition: "FIT", underMaintenance: false },
    orderBy: { quarterNo: "asc" },
  });
}

export async function listOccupiedQuarters() {
  return prisma.quarter.findMany({ where: { status: "OCCUPIED" }, orderBy: { quarterNo: "asc" } });
}

export async function createVacantQuarter(input: { quarterNo: string; colony: string; condition: string }) {
  try {
    return await prisma.quarter.create({
      data: {
        quarterNo: input.quarterNo,
        colony: input.colony,
        condition: input.condition,
        status: "VACANT",
      },
    });
  } catch (error) {
    if (isDuplicateQuarterNo(error)) {
      throw new QuarterError("This quarter number is already in use.", 409, "quarterNo");
    }
    throw error;
  }
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
  try {
    return await prisma.quarter.create({
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
  } catch (error) {
    if (isDuplicateQuarterNo(error)) {
      throw new QuarterError("This quarter number is already in use.", 409, "quarterNo");
    }
    throw error;
  }
}

export async function updateQuarter(id: number, input: QuarterUpdateInput, actorRole: "ADMIN" | "USER") {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }
  const definedFields = Object.entries(input).filter(([, value]) => value !== undefined);
  const isConditionOnlyUpdate = definedFields.length === 1 && definedFields[0][0] === "condition";

  // Editing a vacant quarter's record is an admin-only action. The condition-only
  // path is exempted since that's the Maintenance tab's quick status dropdown,
  // open to any user, not the Vacant tab's edit form.
  if (quarter.status === "VACANT" && !isConditionOnlyUpdate && actorRole !== "ADMIN") {
    throw new QuarterError("Only an admin can edit a vacant quarter.", 403);
  }

  if (quarter.underMaintenance && !isConditionOnlyUpdate) {
    throw new QuarterError("This quarter is currently under maintenance and cannot be edited.", 409);
  }

  try {
    return await prisma.quarter.update({ where: { id }, data: input });
  } catch (error) {
    if (isDuplicateQuarterNo(error)) {
      throw new QuarterError("This quarter number is already in use.", 409, "quarterNo");
    }
    throw error;
  }
}

export async function deleteQuarter(id: number, actorRole: "ADMIN" | "USER") {
  const quarter = await prisma.quarter.findUnique({ where: { id } });
  if (!quarter) {
    throw new QuarterError("Quarter not found.", 404);
  }
  // Deleting a vacant quarter's record is an admin-only action.
  if (quarter.status === "VACANT" && actorRole !== "ADMIN") {
    throw new QuarterError("Only an admin can delete a vacant quarter.", 403);
  }
  if (quarter.underMaintenance) {
    throw new QuarterError("This quarter is currently under maintenance and cannot be deleted.", 409);
  }

  try {
    await prisma.quarter.delete({ where: { id } });
  } catch {
    throw new QuarterError(
      "Cannot delete this quarter: it has related allotment, complaint, vacation, or maintenance records.",
      409,
    );
  }
}
