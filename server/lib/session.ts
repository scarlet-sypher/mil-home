import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/server/db/client";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "mil_home_session";
const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 3);

export type SessionUser = { id: number; email: string };

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: token } });
    return null;
  }

  return { id: session.user.id, email: session.user.email };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
  }
  cookieStore.delete(COOKIE_NAME);
}
