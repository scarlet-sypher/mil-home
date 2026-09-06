import { handleCreateOccupiedQuarter } from "@/server/controllers/quarter.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const POST = withErrorHandling(handleCreateOccupiedQuarter);
