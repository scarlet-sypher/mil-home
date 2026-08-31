import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/session";

export default async function Page() {
  const user = await getSessionUser();
  redirect(user ? "/home" : "/login");
}
