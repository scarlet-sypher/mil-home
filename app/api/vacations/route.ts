import { handleListVacations, handleCreateVacation } from "@/server/controllers/vacation.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListVacations);
export const POST = withErrorHandling(handleCreateVacation);
