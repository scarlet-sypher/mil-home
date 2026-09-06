import { requireActiveUser } from "@/server/lib/session";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { HomePage } from "@/client/pages/HomePage";

export default async function Page() {
  const user = await requireActiveUser();

  const stats = await getDashboardStats();
  return <HomePage username={user.username} role={user.role} stats={stats} />;
}
