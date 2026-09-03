import { getSessionUser } from "@/server/lib/session";
import { AuthPage } from "@/client/pages/AuthPage";
import { AccountPage } from "@/client/pages/AccountPage";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) return <AuthPage defaultTab="login" />;

  return <AccountPage username={user.username} email={user.email} />;
}
