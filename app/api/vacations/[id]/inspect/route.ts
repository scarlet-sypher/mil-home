import { handleInspectVacation } from "@/server/controllers/vacation.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const POST = withErrorHandling(handleInspectVacation);
