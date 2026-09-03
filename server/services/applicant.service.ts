import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { compareApplicantPriority } from "@/server/lib/applicant-sort";

export class ApplicantError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status = 400, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export async function listApplicants() {
  const applicants = await prisma.applicant.findMany({
    include: {
      allotments: {
        where: { authorityStatus: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { quarter: true },
      },
    },
  });
  return [...applicants].sort(compareApplicantPriority);
}

export async function listWaitingApplicants() {
  const applicants = await prisma.applicant.findMany({ where: { status: "WAITING" } });
  return [...applicants].sort(compareApplicantPriority);
}

export async function listAllottedApplicants() {
  const applicants = await prisma.applicant.findMany({ where: { status: "ALLOTTED" } });
  return [...applicants].sort(compareApplicantPriority);
}

export async function createApplicant(input: {
  serviceNo: string;
  name: string;
  rank: string;
  unit: string;
  seniorityDate: string;
  remarks?: string;
}) {
  try {
    return await prisma.applicant.create({
      data: {
        serviceNo: input.serviceNo,
        name: input.name,
        rank: input.rank,
        unit: input.unit,
        seniorityDate: new Date(input.seniorityDate),
        remarks: input.remarks,
        status: "WAITING",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("serviceNo")
    ) {
      throw new ApplicantError("This army number is already in use.", 409, "serviceNo");
    }
    throw error;
  }
}
