import { handleListComplaints, handleCreateComplaint } from "@/server/controllers/complaint.controller";

export const GET = handleListComplaints;
export const POST = handleCreateComplaint;
