import { handleListAllotments, handleCreateAllotment } from "@/server/controllers/allotment.controller";

export const GET = handleListAllotments;
export const POST = handleCreateAllotment;
