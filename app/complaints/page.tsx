import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listComplaints } from "@/server/services/complaint.service";
import { listActiveAllotmentPairs } from "@/server/services/allotment.service";
import { ComplaintsPage } from "@/client/pages/ComplaintsPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [complaints, occupancy] = await Promise.all([listComplaints(), listActiveAllotmentPairs()]);
  return <ComplaintsPage complaints={complaints} occupancy={occupancy} />;
}
