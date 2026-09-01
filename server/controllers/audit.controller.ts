import { NextResponse } from "next/server";
import { listAuditEvents } from "@/server/services/audit.service";
import { getSessionUser } from "@/server/lib/session";

export async function handleListAuditEvents() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const events = await listAuditEvents();
  return NextResponse.json({ events });
}
