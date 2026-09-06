import { handleUpdateComplaint } from "@/server/controllers/complaint.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const PATCH = withErrorHandling(handleUpdateComplaint);
