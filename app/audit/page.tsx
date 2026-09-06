import { requireActiveUser } from "@/server/lib/session";
import { listAuditEvents } from "@/server/services/audit.service";
import { AuditPage } from "@/client/pages/AuditPage";

export default async function Page() {
  await requireActiveUser();

  const events = await listAuditEvents();
  return <AuditPage events={events} />;
}
