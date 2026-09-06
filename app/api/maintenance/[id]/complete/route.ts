import { handleCompleteMaintenance } from "@/server/controllers/maintenance.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const POST = withErrorHandling(handleCompleteMaintenance);
