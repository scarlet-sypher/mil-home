import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listApplicants } from "@/server/services/applicant.service";
import { ApplicantsPage } from "@/client/pages/ApplicantsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const applicants = await listApplicants();
  return <ApplicantsPage applicants={applicants} />;
}
