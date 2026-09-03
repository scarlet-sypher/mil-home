import { prisma } from "@/server/db/client";

// AuditEvent.actor is a raw email snapshot taken at write time. Resolve it to the
// matching user's current username for display, falling back to the email itself
// when there's no matching user or that user has no username set (e.g. accounts
// created before the username field existed).
export async function listAuditEvents(limit = 500) {
  const events = await prisma.auditEvent.findMany({ orderBy: { id: "desc" }, take: limit });

  const actorEmails = Array.from(new Set(events.map((event) => event.actor)));
  const users = await prisma.user.findMany({
    where: { email: { in: actorEmails } },
    select: { email: true, username: true },
  });
  const usernameByEmail = new Map(users.map((user) => [user.email, user.username]));

  return events.map((event) => ({
    ...event,
    actorDisplay: usernameByEmail.get(event.actor) || event.actor,
  }));
}
