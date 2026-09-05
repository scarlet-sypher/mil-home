"use client";
import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 5000;

// Mounted once at the root layout. There's no OS-level "browser tab closed" signal, so
// the packaged desktop launcher watches a local file this beacon keeps fresh (via
// /api/heartbeat) while the tab is open, and tears the server down once it goes stale.
export function HeartbeatBeacon() {
  useEffect(() => {
    const send = () => navigator.sendBeacon("/api/heartbeat");
    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("beforeunload", send);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", send);
    };
  }, []);

  return null;
}
