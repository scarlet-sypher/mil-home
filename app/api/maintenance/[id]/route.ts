import { handleDeleteMaintenanceRecord } from "@/server/controllers/maintenance.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const DELETE = withErrorHandling(handleDeleteMaintenanceRecord);
