import { NextRequest, NextResponse } from "next/server";
import { maintenanceStartSchema, maintenanceCompleteSchema } from "@/server/lib/validators";
import {
  listMaintenanceRecords,
  startMaintenance,
  completeMaintenance,
  deleteMaintenanceRecord,
  MaintenanceError,
} from "@/server/services/maintenance.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListMaintenanceRecords() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const records = await listMaintenanceRecords();
  return NextResponse.json({ records });
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
    const record = await startMaintenance(Number(id), parsed.data.remark);
    await logAudit({ actor: user.email, action: "MAINTENANCE_START", entity: "QUARTER", entityId: Number(id), details: parsed.data.remark });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof MaintenanceError) {
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
    const record = await completeMaintenance(Number(id), parsed.data.remark);
    await logAudit({
      actor: user.email,
      action: "MAINTENANCE_COMPLETE",
      entity: "MAINTENANCE_RECORD",
      entityId: record.id,
      details: parsed.data.remark,
    });
    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof MaintenanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleDeleteMaintenanceRecord(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    await deleteMaintenanceRecord(Number(id));
    await logAudit({ actor: user.email, action: "DELETE", entity: "MAINTENANCE_RECORD", entityId: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MaintenanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
