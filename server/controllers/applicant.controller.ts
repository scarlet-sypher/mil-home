import { NextRequest, NextResponse } from "next/server";
import { applicantSchema } from "@/server/lib/validators";
import { listApplicants, createApplicant } from "@/server/services/applicant.service";
import { getSessionUser } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

export async function handleListApplicants() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const applicants = await listApplicants();
  return NextResponse.json({ applicants });
}

export async function handleCreateApplicant(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const parsed = applicantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const applicant = await createApplicant(parsed.data);
  await logAudit({ actor: user.email, action: "CREATE", entity: "APPLICANT", entityId: applicant.id, details: applicant.serviceNo });
  return NextResponse.json({ applicant }, { status: 201 });
}
