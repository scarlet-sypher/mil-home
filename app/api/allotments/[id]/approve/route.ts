import { handleApproveAllotment } from "@/server/controllers/allotment.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const POST = withErrorHandling(handleApproveAllotment);
