import { handleListQuarters } from "@/server/controllers/quarter.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListQuarters);
