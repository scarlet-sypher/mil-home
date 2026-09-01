import { prisma } from "@/server/db/client";

export async function listComplaints() {
  return prisma.complaint.findMany({
    include: { quarter: true, applicant: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComplaint(input: { quarterId: number; applicantId: number; description: string }) {
  return prisma.complaint.create({
    data: {
      quarterId: input.quarterId,
      applicantId: input.applicantId,
      description: input.description,
      status: "OPEN",
    },
  });
}

export async function closeComplaint(id: number) {
  return prisma.complaint.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
}
