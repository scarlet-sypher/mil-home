import { handlePostHeartbeat } from "@/server/controllers/heartbeat.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";
export const POST = withErrorHandling(handlePostHeartbeat);
