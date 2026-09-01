import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listAllotments } from "@/server/services/allotment.service";
import { listWaitingApplicants } from "@/server/services/applicant.service";
import { listAvailableQuarters } from "@/server/services/quarter.service";
import { AllotmentsPage } from "@/client/pages/AllotmentsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [allotments, applicants, quarters] = await Promise.all([
    listAllotments(),
    listWaitingApplicants(),
    listAvailableQuarters(),
  ]);

  return <AllotmentsPage allotments={allotments} applicants={applicants} quarters={quarters} />;
}
