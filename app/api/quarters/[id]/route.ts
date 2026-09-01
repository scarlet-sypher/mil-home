import { handleUpdateQuarter, handleDeleteQuarter } from "@/server/controllers/quarter.controller";

export const PATCH = handleUpdateQuarter;
export const DELETE = handleDeleteQuarter;
