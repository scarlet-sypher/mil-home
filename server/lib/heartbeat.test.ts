import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { recordHeartbeat } from "./heartbeat";

describe("recordHeartbeat", () => {
  let scratchDir: string;

  beforeEach(() => {
    scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "mil-home-heartbeat-test-"));
    vi.spyOn(os, "tmpdir").mockReturnValue(scratchDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  it("creates mil-home-heartbeat.txt in the OS temp dir", () => {
    recordHeartbeat();
    const heartbeatPath = path.join(scratchDir, "mil-home-heartbeat.txt");
    expect(fs.existsSync(heartbeatPath)).toBe(true);
  });

  it("changes the file's content on each call", () => {
    recordHeartbeat();
    const heartbeatPath = path.join(scratchDir, "mil-home-heartbeat.txt");
    const first = fs.readFileSync(heartbeatPath, "utf8");

    vi.useFakeTimers();
    vi.advanceTimersByTime(10);
    recordHeartbeat();
    vi.useRealTimers();

    const second = fs.readFileSync(heartbeatPath, "utf8");
    expect(second).not.toBe(first);
  });

  it("never leaves a .tmp file behind", () => {
    recordHeartbeat();
    const tempPath = path.join(scratchDir, "mil-home-heartbeat.txt.tmp");
    expect(fs.existsSync(tempPath)).toBe(false);
  });
});
