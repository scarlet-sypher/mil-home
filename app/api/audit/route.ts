import { handleListAuditEvents } from "@/server/controllers/audit.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListAuditEvents);
