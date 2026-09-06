import { handleMe } from "@/server/controllers/auth.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";
export const GET = withErrorHandling(handleMe);
