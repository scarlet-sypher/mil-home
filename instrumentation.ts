export async function register() {
  // Prisma needs the Node.js runtime — skip entirely under Edge (this file also
  // runs once for the Edge runtime graph, which we don't want touching the DB).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureBootstrapAdmin } = await import("@/server/lib/admin-bootstrap");
      await ensureBootstrapAdmin();
    } catch (error) {
      // Never let a bootstrap hiccup (e.g. DB not up yet) block the server from starting.
      console.error("[admin-bootstrap] Failed to run bootstrap check at startup:", error);
    }
  }
}
