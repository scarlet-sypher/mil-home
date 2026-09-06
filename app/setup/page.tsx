import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";
import { SetupPage } from "@/client/pages/SetupPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword && !user.mustChangeEmail) redirect("/home");

  return <SetupPage email={user.email} username={user.username} />;
}
