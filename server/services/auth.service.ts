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
  // role is always hardcoded to USER here — public signup can never produce an
  // admin account, regardless of what a request body might contain. There is no
  // parameter on this function for a caller to even attempt to pass one.
  const user = await prisma.user.create({ data: { email, username, passwordHash, role: "USER" } });
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
  return {
    id: user.id,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
    mustChangeEmail: user.mustChangeEmail,
  };
}

export async function logout(actor: string): Promise<void> {
  await destroySession();
  await logAudit({ actor, action: "LOGOUT", entity: "USER" });
}

// Forced one-time setup for the bootstrap admin. Re-reads the user fresh from the
// DB rather than trusting any client-supplied state, since this must hold even if
// the client's own idea of mustChangePassword/mustChangeEmail is stale or forged.
export async function completeAdminSetup(userId: number, username: string, email: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError("User not found.", 404);
  if (!user.mustChangePassword && !user.mustChangeEmail) {
    throw new AuthError("Setup has already been completed.", 409);
  }

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError("This email is already in use.", 409);
  }

  // bcrypt.compare is always (plaintext, hash) — comparing the new plaintext
  // password against the OLD stored hash, never hash-to-hash (two hashes of the
  // same plaintext differ by salt, so that comparison would be meaningless).
  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    throw new AuthError("New password must be different from the current password.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.user.update({
    where: { id: user.id },
    data: { username, email, passwordHash, mustChangePassword: false, mustChangeEmail: false },
  });
  await logAudit({
    actor: email,
    action: "ADMIN_SETUP_COMPLETE",
    entity: "USER",
    entityId: user.id,
    details: "Admin completed initial setup (email and password changed)",
  });
}

// Standing, repeatable admin credential change — requires the current password
// since (unlike completeAdminSetup) this isn't a one-time forced action.
export async function changeAdminCredentials(
  userId: number,
  currentPassword: string,
  username: string,
  email: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError("User not found.", 404);
  if (user.role !== "ADMIN") throw new AuthError("Forbidden.", 403);

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentMatches) throw new AuthError("Current password is incorrect.", 401);

  const emailChanged = email !== user.email;
  if (emailChanged) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AuthError("This email is already in use.", 409);
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    throw new AuthError("New password must be different from the current password.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.user.update({ where: { id: user.id }, data: { username, email, passwordHash } });

  if (emailChanged) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await destroySession();
  }

  await logAudit({
    actor: email,
    action: "ADMIN_CREDENTIALS_CHANGED",
    entity: "USER",
    entityId: user.id,
    details: `Admin changed email/password at ${new Date().toISOString()}`,
  });

  return { emailChanged };
}
