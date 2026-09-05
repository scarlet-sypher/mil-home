import { NextRequest, NextResponse } from "next/server";
import { signupSchema, loginSchema, setupCredentialsSchema, changeCredentialsSchema } from "@/server/lib/validators";
import {
  signup,
  login,
  logout,
  completeAdminSetup,
  changeAdminCredentials,
  AuthError,
} from "@/server/services/auth.service";
import { getSessionUser } from "@/server/lib/session";

export async function handleSignup(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const user = await signup(parsed.data.email, parsed.data.password, parsed.data.username);
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
  // Explicit whitelist — the setup flags never need to reach the client, since
  // enforcement of those always happens server-side via requireActiveUser().
  return NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
}

export async function handleSetup(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = setupCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    await completeAdminSetup(sessionUser.id, parsed.data.username, parsed.data.email, parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function handleChangeCredentials(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = changeCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const result = await changeAdminCredentials(
      sessionUser.id,
      parsed.data.currentPassword,
      parsed.data.username,
      parsed.data.email,
      parsed.data.newPassword,
    );
    return NextResponse.json({ ok: true, emailChanged: result.emailChanged });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
