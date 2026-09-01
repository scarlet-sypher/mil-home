import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listVacations } from "@/server/services/vacation.service";
import { listOccupiedQuarters } from "@/server/services/quarter.service";
import { listAllottedApplicants } from "@/server/services/applicant.service";
import { VacationsPage } from "@/client/pages/VacationsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [vacations, quarters, applicants] = await Promise.all([
    listVacations(),
    listOccupiedQuarters(),
    listAllottedApplicants(),
  ]);
  return <VacationsPage vacations={vacations} quarters={quarters} applicants={applicants} />;
}
