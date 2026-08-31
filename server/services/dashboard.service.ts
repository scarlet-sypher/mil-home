import { prisma } from "@/server/db/client";

export async function getDashboardStats() {
  const [totalQuarters, vacantQuarters, occupiedQuarters, waitingApplicants, openComplaints, pendingVacations] =
    await Promise.all([
      prisma.quarter.count(),
      prisma.quarter.count({ where: { status: "VACANT" } }),
      prisma.quarter.count({ where: { status: "OCCUPIED" } }),
      prisma.applicant.count({ where: { status: "WAITING" } }),
      prisma.complaint.count({ where: { status: { not: "CLOSED" } } }),
      prisma.vacation.count({ where: { clearanceStatus: { not: "CLEARED" } } }),
    ]);

  return { totalQuarters, vacantQuarters, occupiedQuarters, waitingApplicants, openComplaints, pendingVacations };
}
