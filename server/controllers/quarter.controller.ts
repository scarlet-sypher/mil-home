import { NextRequest, NextResponse } from "next/server";
import {
  quarterVacantCreateSchema,
  quarterOccupiedCreateSchema,
  quarterUpdateSchema,
  maintenanceStartSchema,
  maintenanceCompleteSchema,
} from "@/server/lib/validators";
import {
  listQuarters,
  createVacantQuarter,
  createOccupiedQuarter,
  updateQuarter,
  deleteQuarter,
  startMaintenance,
  completeMaintenance,
  QuarterError,
} from "@/server/services/quarter.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListQuarters() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const quarters = await listQuarters();
  return NextResponse.json({ quarters });
}

export async function handleCreateVacantQuarter(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = quarterVacantCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const quarter = await createVacantQuarter(parsed.data);
  await logAudit({ actor: user.email, action: "CREATE", entity: "QUARTER", entityId: quarter.id, details: quarter.quarterNo });
  return NextResponse.json({ quarter }, { status: 201 });
}

export async function handleCreateOccupiedQuarter(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = quarterOccupiedCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const quarter = await createOccupiedQuarter(parsed.data);
  await logAudit({ actor: user.email, action: "CREATE", entity: "QUARTER", entityId: quarter.id, details: quarter.quarterNo });
  return NextResponse.json({ quarter }, { status: 201 });
}

export async function handleUpdateQuarter(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = quarterUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const quarter = await updateQuarter(Number(id), parsed.data);
    await logAudit({ actor: user.email, action: "UPDATE", entity: "QUARTER", entityId: quarter.id });
    return NextResponse.json({ quarter });
  } catch (error) {
    if (error instanceof QuarterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleDeleteQuarter(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    await deleteQuarter(Number(id));
    await logAudit({ actor: user.email, action: "DELETE", entity: "QUARTER", entityId: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof QuarterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleStartMaintenance(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = maintenanceStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const quarter = await startMaintenance(Number(id), parsed.data.remark);
    await logAudit({ actor: user.email, action: "MAINTENANCE_START", entity: "QUARTER", entityId: quarter.id, details: parsed.data.remark });
    return NextResponse.json({ quarter });
  } catch (error) {
    if (error instanceof QuarterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleCompleteMaintenance(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = maintenanceCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const quarter = await completeMaintenance(Number(id), parsed.data.remark);
    await logAudit({ actor: user.email, action: "MAINTENANCE_COMPLETE", entity: "QUARTER", entityId: quarter.id, details: parsed.data.remark });
    return NextResponse.json({ quarter });
  } catch (error) {
    if (error instanceof QuarterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
