import { handleListApplicants, handleCreateApplicant } from "@/server/controllers/applicant.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListApplicants);
export const POST = withErrorHandling(handleCreateApplicant);
