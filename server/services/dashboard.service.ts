import { prisma } from "@/server/db/client";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Real month-over-month % change plus a 6-week sparkline, both derived from actual
// row timestamps — never fabricated. `percent` is 0 when both months are empty, and
// 100 when this month has rows but last month had none (nothing to divide by).
function computeTrend(dates: Date[]) {
  const now = new Date();
  const startThisMonth = startOfMonth(now);
  const startLastMonth = new Date(startThisMonth);
  startLastMonth.setMonth(startLastMonth.getMonth() - 1);

  const thisMonth = dates.filter((d) => d >= startThisMonth).length;
  const lastMonth = dates.filter((d) => d >= startLastMonth && d < startThisMonth).length;

  const percent = lastMonth === 0 ? (thisMonth === 0 ? 0 : 100) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const bucketCount = 6;
  const bucketMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();
  const sparkline = Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = nowMs - (bucketCount - i) * bucketMs;
    const bucketEnd = nowMs - (bucketCount - i - 1) * bucketMs;
    return dates.filter((d) => d.getTime() >= bucketStart && d.getTime() < bucketEnd).length;
  });

  return { percent, sparkline };
}

export async function getDashboardStats() {
  const [
    quartersTotal,
    quartersVacant,
    quartersOccupied,
    quartersReserved,
    quartersUnderMaintenance,
    quartersUnfit,
    applicantsTotal,
    applicantsWaiting,
    applicantsAllotted,
    allotmentsTotal,
    allotmentsPending,
    allotmentsApproved,
    allotmentsRejected,
    allotmentsUnallocated,
    complaintsTotal,
    complaintsOpen,
    complaintsInProgress,
    complaintsWaiting,
    complaintsBlocked,
    complaintsClosed,
    vacationsTotal,
    vacationsPendingInspection,
    vacationsCleared,
    vacationsDefects,
    maintenanceTotal,
    maintenanceInProgress,
    maintenanceCompleted,
    totalUsers,
    auditLogsToday,
    lastAuditEvent,
    quarterDates,
    applicantDates,
    allotmentDates,
    complaintDates,
    vacationDates,
    maintenanceDates,
  ] = await Promise.all([
    prisma.quarter.count(),
    prisma.quarter.count({ where: { status: "VACANT" } }),
    prisma.quarter.count({ where: { status: "OCCUPIED" } }),
    prisma.quarter.count({ where: { status: "RESERVED" } }),
    prisma.quarter.count({ where: { underMaintenance: true } }),
    prisma.quarter.count({ where: { condition: "UNFIT" } }),
    prisma.applicant.count(),
    prisma.applicant.count({ where: { status: "WAITING" } }),
    prisma.applicant.count({ where: { status: "ALLOTTED" } }),
    prisma.allotment.count(),
    prisma.allotment.count({ where: { authorityStatus: "PENDING" } }),
    prisma.allotment.count({ where: { authorityStatus: "APPROVED" } }),
    prisma.allotment.count({ where: { authorityStatus: "REJECTED" } }),
    prisma.allotment.count({ where: { authorityStatus: "UNALLOCATED" } }),
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: "OPEN" } }),
    prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
    prisma.complaint.count({ where: { status: "WAITING" } }),
    prisma.complaint.count({ where: { status: "BLOCKED" } }),
    prisma.complaint.count({ where: { status: "CLOSED" } }),
    prisma.vacation.count(),
    prisma.vacation.count({ where: { inspectionStatus: "PENDING" } }),
    prisma.vacation.count({ where: { clearanceStatus: "CLEARED" } }),
    prisma.vacation.count({ where: { clearanceStatus: "DEFECTS" } }),
    prisma.maintenanceRecord.count(),
    prisma.maintenanceRecord.count({ where: { status: "IN_PROGRESS" } }),
    prisma.maintenanceRecord.count({ where: { status: "COMPLETED" } }),
    prisma.user.count(),
    prisma.auditEvent.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.auditEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.quarter.findMany({ select: { createdAt: true } }),
    prisma.applicant.findMany({ select: { createdAt: true } }),
    prisma.allotment.findMany({ select: { createdAt: true } }),
    prisma.complaint.findMany({ select: { createdAt: true } }),
    prisma.vacation.findMany({ select: { requestDate: true } }),
    prisma.maintenanceRecord.findMany({ select: { startedAt: true } }),
  ]);

  return {
    quarters: {
      total: quartersTotal,
      vacant: quartersVacant,
      occupied: quartersOccupied,
      reserved: quartersReserved,
      underMaintenance: quartersUnderMaintenance,
      unfit: quartersUnfit,
      trend: computeTrend(quarterDates.map((r) => r.createdAt)),
    },
    applicants: {
      total: applicantsTotal,
      waiting: applicantsWaiting,
      allotted: applicantsAllotted,
      trend: computeTrend(applicantDates.map((r) => r.createdAt)),
    },
    allotments: {
      total: allotmentsTotal,
      pending: allotmentsPending,
      approved: allotmentsApproved,
      rejected: allotmentsRejected,
      unallocated: allotmentsUnallocated,
      trend: computeTrend(allotmentDates.map((r) => r.createdAt)),
    },
    complaints: {
      total: complaintsTotal,
      open: complaintsOpen,
      inProgress: complaintsInProgress,
      waiting: complaintsWaiting,
      blocked: complaintsBlocked,
      closed: complaintsClosed,
      trend: computeTrend(complaintDates.map((r) => r.createdAt)),
    },
    vacations: {
      total: vacationsTotal,
      pendingInspection: vacationsPendingInspection,
      cleared: vacationsCleared,
      defects: vacationsDefects,
      trend: computeTrend(vacationDates.map((r) => r.requestDate)),
    },
    maintenance: {
      total: maintenanceTotal,
      inProgress: maintenanceInProgress,
      completed: maintenanceCompleted,
      trend: computeTrend(maintenanceDates.map((r) => r.startedAt)),
    },
    totalUsers,
    auditLogsToday,
    lastUpdated: lastAuditEvent?.createdAt ?? null,
  };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
