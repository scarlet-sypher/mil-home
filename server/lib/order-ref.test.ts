import { describe, it, expect } from "vitest";
import { formatOrderRef } from "./order-ref";

describe("formatOrderRef", () => {
  it("pads the id to 6 digits", () => {
    expect(formatOrderRef(42, 2026)).toBe("STN-HOU-2026-000042");
  });

  it("does not truncate ids longer than 6 digits", () => {
    expect(formatOrderRef(1234567, 2026)).toBe("STN-HOU-2026-1234567");
  });
});
