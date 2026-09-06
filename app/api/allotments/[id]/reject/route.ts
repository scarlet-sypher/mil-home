import { handleRejectAllotment } from "@/server/controllers/allotment.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const POST = withErrorHandling(handleRejectAllotment);
