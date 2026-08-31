import { handleListQuarters, handleCreateQuarter } from "@/server/controllers/quarter.controller";

export const GET = handleListQuarters;
export const POST = handleCreateQuarter;
