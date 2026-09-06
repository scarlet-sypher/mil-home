import { requireActiveUser } from "@/server/lib/session";
import { listApplicants } from "@/server/services/applicant.service";
import { ApplicantsPage } from "@/client/pages/ApplicantsPage";

export default async function Page() {
  await requireActiveUser();

  const applicants = await listApplicants();
  return <ApplicantsPage applicants={applicants} />;
}
