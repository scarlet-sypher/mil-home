export type ApplicantPriorityInput = { category: string; seniorityDate: Date };

export function compareApplicantPriority(a: ApplicantPriorityInput, b: ApplicantPriorityInput): number {
  const aPriority = a.category !== "NORMAL" ? 0 : 1;
  const bPriority = b.category !== "NORMAL" ? 0 : 1;
  if (aPriority !== bPriority) return aPriority - bPriority;
  return a.seniorityDate.getTime() - b.seniorityDate.getTime();
}
