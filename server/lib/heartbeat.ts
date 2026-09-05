import fs from "node:fs";
import path from "node:path";

// Computed per call (not a module-level constant) so it always reflects the process's
// current working directory -- {app} when the launcher starts the server, the repo
// root in local dev -- and so tests can point it at a scratch directory.
function getHeartbeatPath(): string {
  return path.join(process.cwd(), ".runtime", "heartbeat.txt");
}

// Write-then-rename so the launcher's watcher (a separate process polling this file)
// never reads a half-written value.
export function recordHeartbeat(): void {
  const heartbeatPath = getHeartbeatPath();
  fs.mkdirSync(path.dirname(heartbeatPath), { recursive: true });
  const tempPath = `${heartbeatPath}.tmp`;
  fs.writeFileSync(tempPath, String(Date.now()));
  fs.renameSync(tempPath, heartbeatPath);
}
