import { handleUpdateQuarter, handleDeleteQuarter } from "@/server/controllers/quarter.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const PATCH = withErrorHandling(handleUpdateQuarter);
export const DELETE = withErrorHandling(handleDeleteQuarter);
