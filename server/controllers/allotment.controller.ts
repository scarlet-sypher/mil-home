import { NextRequest, NextResponse } from "next/server";
import { allotmentCreateSchema } from "@/server/lib/validators";
import {
  listAllotments,
  createAllotment,
  approveAllotment,
  rejectAllotment,
  unallocateAllotment,
  reallocateAllotment,
  AllotmentError,
} from "@/server/services/allotment.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListAllotments() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const allotments = await listAllotments();
  return NextResponse.json({ allotments });
}

export async function handleCreateAllotment(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = allotmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const allotment = await createAllotment(parsed.data.applicantId, parsed.data.quarterId);
    await logAudit({ actor: user.email, action: "CREATE", entity: "ALLOTMENT", entityId: allotment.id });
    return NextResponse.json({ allotment }, { status: 201 });
  } catch (error) {
    if (error instanceof AllotmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleApproveAllotment(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    const allotment = await approveAllotment(Number(id));
    await logAudit({ actor: user.email, action: "APPROVE", entity: "ALLOTMENT", entityId: allotment.id, details: allotment.orderRef ?? "" });
    return NextResponse.json({ allotment });
  } catch (error) {
    if (error instanceof AllotmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleRejectAllotment(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    const allotment = await rejectAllotment(Number(id));
    await logAudit({ actor: user.email, action: "REJECT", entity: "ALLOTMENT", entityId: allotment.id });
    return NextResponse.json({ allotment });
  } catch (error) {
    if (error instanceof AllotmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleReallocateAllotment(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    const allotment = await reallocateAllotment(Number(id));
    await logAudit({ actor: user.email, action: "REALLOCATE", entity: "ALLOTMENT", entityId: allotment.id, details: allotment.orderRef ?? "" });
    return NextResponse.json({ allotment });
  } catch (error) {
    if (error instanceof AllotmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleUnallocateAllotment(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await context.params;
  try {
    const allotment = await unallocateAllotment(Number(id));
    await logAudit({ actor: user.email, action: "UNALLOCATE", entity: "ALLOTMENT", entityId: allotment.id });
    return NextResponse.json({ allotment });
  } catch (error) {
    if (error instanceof AllotmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
