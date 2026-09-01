import { prisma } from "@/server/db/client";

export async function listComplaints() {
  return prisma.complaint.findMany({ include: { quarter: true }, orderBy: { createdAt: "desc" } });
}

export async function createComplaint(input: {
  quarterId: number;
  resident: string;
  category: string;
  description: string;
}) {
  return prisma.complaint.create({
    data: {
      quarterId: input.quarterId,
      resident: input.resident,
      category: input.category,
      description: input.description,
      status: "OPEN",
    },
  });
}

export async function closeComplaint(id: number) {
  return prisma.complaint.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
}
