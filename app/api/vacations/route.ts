import { handleListVacations, handleCreateVacation } from "@/server/controllers/vacation.controller";

export const GET = handleListVacations;
export const POST = handleCreateVacation;
