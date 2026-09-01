import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listAuditEvents } from "@/server/services/audit.service";
import { AuditPage } from "@/client/pages/AuditPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const events = await listAuditEvents();
  return <AuditPage events={events} />;
}
