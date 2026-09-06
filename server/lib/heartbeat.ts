import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// The OS temp dir, not {app} -- the packaged app runs from C:\Program Files\MIL-HOME,
// which a normal (non-elevated) Windows user account cannot write to, even though the
// elevated installer itself could write .env there. The launcher's own log file uses
// the same %TEMP% location for the identical reason, and both sides need to agree on
// this exact path since the launcher polls it from a separate process.
function getHeartbeatPath(): string {
  return path.join(os.tmpdir(), "mil-home-heartbeat.txt");
}

// Write-then-rename so the launcher's watcher (a separate process polling this file)
// never reads a half-written value.
export function recordHeartbeat(): void {
  const heartbeatPath = getHeartbeatPath();
  const tempPath = `${heartbeatPath}.tmp`;
  fs.writeFileSync(tempPath, String(Date.now()));
  fs.renameSync(tempPath, heartbeatPath);
}
