import { requireActiveUser } from "@/server/lib/session";
import { listVacations } from "@/server/services/vacation.service";
import { listActiveAllotmentPairs } from "@/server/services/allotment.service";
import { VacationsPage } from "@/client/pages/VacationsPage";

export default async function Page() {
  await requireActiveUser();

  const [vacations, occupancy] = await Promise.all([listVacations(), listActiveAllotmentPairs()]);
  return <VacationsPage vacations={vacations} occupancy={occupancy} />;
}
