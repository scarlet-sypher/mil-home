import { NextRequest, NextResponse } from "next/server";
import { quarterSchema } from "@/server/lib/validators";
import { listQuarters, createQuarter } from "@/server/services/quarter.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListQuarters() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const quarters = await listQuarters();
  return NextResponse.json({ quarters });
}

export async function handleCreateQuarter(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = quarterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const quarter = await createQuarter(parsed.data);
  await logAudit({ actor: user.email, action: "CREATE", entity: "QUARTER", entityId: quarter.id, details: quarter.quarterNo });
  return NextResponse.json({ quarter }, { status: 201 });
}
