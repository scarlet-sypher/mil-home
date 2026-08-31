import { prisma } from "@/server/db/client";

export async function listQuarters() {
  return prisma.quarter.findMany({ orderBy: [{ colony: "asc" }, { quarterNo: "asc" }] });
}

export async function listAvailableQuarters() {
  return prisma.quarter.findMany({ where: { status: "VACANT", condition: "FIT" }, orderBy: { quarterNo: "asc" } });
}

export async function listOccupiedQuarters() {
  return prisma.quarter.findMany({ where: { status: "OCCUPIED" }, orderBy: { quarterNo: "asc" } });
}

export async function createQuarter(input: {
  quarterNo: string;
  colony: string;
  qtype: string;
  entitlement?: string;
}) {
  return prisma.quarter.create({
    data: {
      quarterNo: input.quarterNo,
      colony: input.colony,
      qtype: input.qtype,
      entitlement: input.entitlement,
      status: "VACANT",
      condition: "FIT",
    },
  });
}
