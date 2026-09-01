import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listComplaints } from "@/server/services/complaint.service";
import { listOccupiedQuarters } from "@/server/services/quarter.service";
import { listAllottedApplicants } from "@/server/services/applicant.service";
import { ComplaintsPage } from "@/client/pages/ComplaintsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [complaints, quarters, applicants] = await Promise.all([
    listComplaints(),
    listOccupiedQuarters(),
    listAllottedApplicants(),
  ]);
  return <ComplaintsPage complaints={complaints} quarters={quarters} applicants={applicants} />;
}
