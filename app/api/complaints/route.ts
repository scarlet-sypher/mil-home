import { handleListComplaints, handleCreateComplaint } from "@/server/controllers/complaint.controller";
import { withErrorHandling } from "@/server/lib/api-error-handler";

export const GET = withErrorHandling(handleListComplaints);
export const POST = withErrorHandling(handleCreateComplaint);
