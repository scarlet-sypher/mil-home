export type ApplicantPriorityInput = { seniorityDate: Date };

export function compareApplicantPriority(a: ApplicantPriorityInput, b: ApplicantPriorityInput): number {
  return a.seniorityDate.getTime() - b.seniorityDate.getTime();
}
