import { prisma } from "@/server/db/client";
import { compareApplicantPriority } from "@/server/lib/applicant-sort";

export async function listApplicants() {
  const applicants = await prisma.applicant.findMany();
  return [...applicants].sort(compareApplicantPriority);
}

export async function listWaitingApplicants() {
  const applicants = await prisma.applicant.findMany({ where: { status: "WAITING" } });
  return [...applicants].sort(compareApplicantPriority);
}

export async function createApplicant(input: {
  serviceNo: string;
  name: string;
  rank: string;
  unit: string;
  seniorityDate: string;
  category: string;
  eligibleType: string;
}) {
  return prisma.applicant.create({
    data: {
      serviceNo: input.serviceNo,
      name: input.name,
      rank: input.rank,
      unit: input.unit,
      seniorityDate: new Date(input.seniorityDate),
      category: input.category,
      eligibleType: input.eligibleType,
      status: "WAITING",
    },
  });
}
