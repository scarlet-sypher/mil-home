import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/client";
import { createSession, destroySession } from "@/server/lib/session";
import { logAudit } from "@/server/lib/audit";

const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function signup(email: string, password: string, username: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("This email is already registered. Please log in instead.", 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({ data: { email, username, passwordHash } });
  await logAudit({ actor: email, action: "SIGNUP", entity: "USER", entityId: user.id });
  return { id: user.id, email: user.email, username: user.username };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError("Too many failed attempts. Try again later.", 423);
  }

  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    if (user) {
      const failedAttempts = user.failedAttempts + 1;
      const lockedUntil =
        failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
      await prisma.user.update({ where: { id: user.id }, data: { failedAttempts, lockedUntil } });
    }
    throw new AuthError("Invalid email or password.", 401);
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });
  await createSession(user.id);
  await logAudit({ actor: user.email, action: "LOGIN", entity: "USER", entityId: user.id });
  return { id: user.id, email: user.email };
}

export async function logout(actor: string): Promise<void> {
  await destroySession();
  await logAudit({ actor, action: "LOGOUT", entity: "USER" });
}
