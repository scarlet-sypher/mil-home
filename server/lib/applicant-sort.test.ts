import { describe, it, expect } from "vitest";
import { compareApplicantPriority } from "./applicant-sort";

describe("compareApplicantPriority", () => {
  it("ranks non-NORMAL category ahead of NORMAL regardless of seniority", () => {
    const priority = { category: "PRIORITY", seniorityDate: new Date("2025-06-01") };
    const normal = { category: "NORMAL", seniorityDate: new Date("2020-01-01") };
    expect(compareApplicantPriority(priority, normal)).toBeLessThan(0);
  });

  it("orders by earlier seniority date first within the same category", () => {
    const earlier = { category: "NORMAL", seniorityDate: new Date("2020-01-01") };
    const later = { category: "NORMAL", seniorityDate: new Date("2024-01-01") };
    expect(compareApplicantPriority(earlier, later)).toBeLessThan(0);
  });

  it("treats equal category and date as equal", () => {
    const date = new Date("2022-01-01");
    expect(compareApplicantPriority({ category: "NORMAL", seniorityDate: date }, { category: "NORMAL", seniorityDate: date })).toBe(0);
  });
});
