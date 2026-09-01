import { describe, it, expect } from "vitest";
import { compareApplicantPriority } from "./applicant-sort";

describe("compareApplicantPriority", () => {
  it("orders by earlier seniority date first", () => {
    const earlier = { seniorityDate: new Date("2020-01-01") };
    const later = { seniorityDate: new Date("2024-01-01") };
    expect(compareApplicantPriority(earlier, later)).toBeLessThan(0);
  });

  it("orders a later seniority date after an earlier one", () => {
    const earlier = { seniorityDate: new Date("2020-01-01") };
    const later = { seniorityDate: new Date("2024-01-01") };
    expect(compareApplicantPriority(later, earlier)).toBeGreaterThan(0);
  });

  it("treats equal dates as equal", () => {
    const date = new Date("2022-01-01");
    expect(compareApplicantPriority({ seniorityDate: date }, { seniorityDate: date })).toBe(0);
  });
});
