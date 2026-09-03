import { NextRequest, NextResponse } from "next/server";
import { complaintCreateSchema, complaintUpdateSchema } from "@/server/lib/validators";
import { listComplaints, createComplaint, updateComplaint, ComplaintError } from "@/server/services/complaint.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListComplaints() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const complaints = await listComplaints();
  return NextResponse.json({ complaints });
}

export async function handleCreateComplaint(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = complaintCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const complaint = await createComplaint(parsed.data);
    await logAudit({ actor: user.email, action: "CREATE", entity: "COMPLAINT", entityId: complaint.id, details: complaint.description });
    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    if (error instanceof ComplaintError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleUpdateComplaint(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = complaintUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const complaint = await updateComplaint(Number(id), parsed.data);
    await logAudit({
      actor: user.email,
      action: "UPDATE",
      entity: "COMPLAINT",
      entityId: complaint.id,
      details: parsed.data.status ? `status -> ${parsed.data.status}` : "remark updated",
    });
    return NextResponse.json({ complaint });
  } catch (error) {
    if (error instanceof ComplaintError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
