import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/server/lib/heartbeat";

export async function handlePostHeartbeat() {
  recordHeartbeat();
  return NextResponse.json({ ok: true });
}
