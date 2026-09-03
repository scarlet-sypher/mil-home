import { prisma } from "@/server/db/client";

export class ComplaintError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listComplaints() {
  return prisma.complaint.findMany({
    include: { quarter: true, applicant: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComplaint(input: { quarterId: number; applicantId: number; description: string }) {
  const allotment = await prisma.allotment.findFirst({
    where: { quarterId: input.quarterId, applicantId: input.applicantId, authorityStatus: "APPROVED" },
  });
  if (!allotment) {
    throw new ComplaintError("This resident is not currently allotted to this quarter.", 409);
  }

  return prisma.complaint.create({
    data: {
      quarterId: input.quarterId,
      applicantId: input.applicantId,
      description: input.description,
      status: "OPEN",
    },
  });
}

export async function updateComplaint(id: number, input: { status?: string; remark?: string }) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) {
    throw new ComplaintError("Complaint not found.", 404);
  }

  const resultingStatus = input.status ?? complaint.status;
  if (input.remark !== undefined && resultingStatus === "CLOSED") {
    throw new ComplaintError("Cannot edit the remark on a closed complaint.", 409);
  }

  const data: { status?: string; remark?: string | null; closedAt?: Date | null } = {};
  if (input.status !== undefined) {
    data.status = input.status;
    data.closedAt = input.status === "CLOSED" ? new Date() : null;
  }
  if (input.remark !== undefined) {
    data.remark = input.remark || null;
  }

  return prisma.complaint.update({ where: { id }, data });
}
