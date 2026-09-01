import { prisma } from "@/server/db/client";

export async function listAuditEvents(limit = 500) {
  return prisma.auditEvent.findMany({ orderBy: { id: "desc" }, take: limit });
}
