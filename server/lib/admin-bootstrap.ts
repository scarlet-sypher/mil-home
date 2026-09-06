import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { logAudit } from "@/server/lib/audit";

const BOOTSTRAP_ADMIN_EMAIL = "admin@milhome.local";
const BOOTSTRAP_ADMIN_USERNAME = "admin";
// Pre-generated bcrypt hash (cost 12) of the one-time bootstrap password. Generated
// once via `node -e "require('bcryptjs').hash('Bharat#Veer_91', 12).then(console.log)"`
// and pasted here — the plaintext itself never touched disk and is never stored
// anywhere in source control, only this hash.
const BOOTSTRAP_ADMIN_PASSWORD_HASH = "$2a$12$ngHd/0VpEdxxWxZHxZ33zupDoXMgQ890EhDTv8VoniivnisP9lcBe";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Idempotent: safe to call on every server startup. Creates the one known admin
// login only if no ADMIN-role user exists yet at all — never touches an existing
// admin account, never runs more than once in practice.
export async function ensureBootstrapAdmin(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return;

  try {
    const admin = await prisma.user.create({
      data: {
        email: BOOTSTRAP_ADMIN_EMAIL,
        username: BOOTSTRAP_ADMIN_USERNAME,
        passwordHash: BOOTSTRAP_ADMIN_PASSWORD_HASH,
        role: "ADMIN",
        mustChangePassword: true,
        mustChangeEmail: true,
      },
    });
    await logAudit({
      actor: "system",
      action: "ADMIN_BOOTSTRAP",
      entity: "USER",
      entityId: admin.id,
      details: "Bootstrap admin account created on server startup",
    });
    console.log(`[admin-bootstrap] Created initial admin account (${BOOTSTRAP_ADMIN_EMAIL}).`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      console.error(
        `[admin-bootstrap] A user with email ${BOOTSTRAP_ADMIN_EMAIL} already exists but is not ADMIN. Skipping bootstrap — resolve manually.`,
      );
      return;
    }
    throw error;
  }
}
