import { handleListAllotments, handleCreateAllotment } from "@/server/controllers/allotment.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListAllotments);
export const POST = withErrorHandling(handleCreateAllotment);
