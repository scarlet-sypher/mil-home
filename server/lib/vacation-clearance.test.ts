import { describe, it, expect } from "vitest";
import { determineClearanceStatus } from "./vacation-clearance";

describe("determineClearanceStatus", () => {
  it("clears when there are no defects", () => {
    expect(determineClearanceStatus("")).toBe("CLEARED");
  });

  it("clears when defects is only whitespace", () => {
    expect(determineClearanceStatus("   ")).toBe("CLEARED");
  });

  it("flags defects when text is present", () => {
    expect(determineClearanceStatus("Leaking tap")).toBe("DEFECTS");
  });
});
