import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listVacations } from "@/server/services/vacation.service";
import { listActiveAllotmentPairs } from "@/server/services/allotment.service";
import { VacationsPage } from "@/client/pages/VacationsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [vacations, occupancy] = await Promise.all([listVacations(), listActiveAllotmentPairs()]);
  return <VacationsPage vacations={vacations} occupancy={occupancy} />;
}
