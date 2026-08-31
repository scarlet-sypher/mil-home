import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { listQuarters } from "@/server/services/quarter.service";
import { QuartersPage } from "@/client/pages/QuartersPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const quarters = await listQuarters();
  return <QuartersPage quarters={quarters} />;
}
