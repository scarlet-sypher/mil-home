import { requireActiveUser } from "@/server/lib/session";
import { listComplaints } from "@/server/services/complaint.service";
import { listActiveAllotmentPairs } from "@/server/services/allotment.service";
import { ComplaintsPage } from "@/client/pages/ComplaintsPage";

export default async function Page() {
  await requireActiveUser();

  const [complaints, occupancy] = await Promise.all([listComplaints(), listActiveAllotmentPairs()]);
  return <ComplaintsPage complaints={complaints} occupancy={occupancy} />;
}
