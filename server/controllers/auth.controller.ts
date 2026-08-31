import { NextRequest, NextResponse } from "next/server";
import { signupSchema, loginSchema } from "@/server/lib/validators";
import { signup, login, logout, AuthError } from "@/server/services/auth.service";
import { getSessionUser } from "@/server/lib/session";

export async function handleSignup(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const user = await signup(parsed.data.email, parsed.data.password);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleLogin(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const user = await login(parsed.data.email, parsed.data.password);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleLogout() {
  const user = await getSessionUser();
  await logout(user?.email ?? "unknown");
  return NextResponse.json({ ok: true });
}

export async function handleMe() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
