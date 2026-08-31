import { handleListApplicants, handleCreateApplicant } from "@/server/controllers/applicant.controller";

export const GET = handleListApplicants;
export const POST = handleCreateApplicant;
