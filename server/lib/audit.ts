import { prisma } from "@/server/db/client";

export async function logAudit(params: {
  actor: string;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actor: params.actor,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details ?? "",
    },
  });
}
