import { requireActiveUser } from "@/server/lib/session";
import { listQuarters } from "@/server/services/quarter.service";
import { listMaintenanceRecords } from "@/server/services/maintenance.service";
import { QuartersPage } from "@/client/pages/QuartersPage";

export default async function Page() {
  const user = await requireActiveUser();

  const [quarters, maintenanceRecords] = await Promise.all([listQuarters(), listMaintenanceRecords()]);
  return <QuartersPage quarters={quarters} maintenanceRecords={maintenanceRecords} role={user.role} />;
}
