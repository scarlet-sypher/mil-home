import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { HomePage } from "@/client/pages/HomePage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const stats = await getDashboardStats();
  return <HomePage email={user.email} stats={stats} />;
}
