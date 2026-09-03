import { NextRequest, NextResponse } from "next/server";
import { vacationCreateSchema, vacationInspectSchema } from "@/server/lib/validators";
import { listVacations, createVacation, inspectVacation, VacationError } from "@/server/services/vacation.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListVacations() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const vacations = await listVacations();
  return NextResponse.json({ vacations });
}

export async function handleCreateVacation(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = vacationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const vacation = await createVacation(parsed.data);
    await logAudit({ actor: user.email, action: "CREATE", entity: "VACATION", entityId: vacation.id });
    return NextResponse.json({ vacation }, { status: 201 });
  } catch (error) {
    if (error instanceof VacationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleInspectVacation(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = vacationInspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const vacation = await inspectVacation(Number(id), parsed.data.defects);
  await logAudit({ actor: user.email, action: "INSPECT", entity: "VACATION", entityId: vacation.id, details: parsed.data.defects });
  return NextResponse.json({ vacation });
}
