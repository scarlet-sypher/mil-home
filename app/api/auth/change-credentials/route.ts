import { handleChangeCredentials } from "@/server/controllers/auth.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";
export const POST = withErrorHandling(handleChangeCredentials);
