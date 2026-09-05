import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "At least 10 characters")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one symbol");

export const signupSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    username: z.string().trim().min(1, "Username is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const setupCredentialsSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type SetupCredentialsInput = z.infer<typeof setupCredentialsSchema>;

export const changeCredentialsSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    username: z.string().trim().min(1, "Username is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type ChangeCredentialsInput = z.infer<typeof changeCredentialsSchema>;

export const conditionEnum = z.enum(["FIT", "UNFIT"]);

export const quarterVacantCreateSchema = z.object({
  quarterNo: z.string().trim().min(1, "Quarter number is required"),
  colony: z.string().trim().min(1, "Quarter location is required"),
  condition: conditionEnum,
});
export type QuarterVacantCreateInput = z.infer<typeof quarterVacantCreateSchema>;

export const quarterOccupiedCreateSchema = z.object({
  serviceNo: z.string().trim().min(1, "Army number is required"),
  rank: z.string().trim().min(1, "Rank is required"),
  name: z.string().trim().min(1, "Name is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  quarterNo: z.string().trim().min(1, "Quarter number is required"),
  colony: z.string().trim().min(1, "Quarter location is required"),
  condition: conditionEnum,
});
export type QuarterOccupiedCreateInput = z.infer<typeof quarterOccupiedCreateSchema>;

export const quarterUpdateSchema = z.object({
  quarterNo: z.string().trim().min(1).optional(),
  colony: z.string().trim().min(1).optional(),
  condition: conditionEnum.optional(),
  serviceNo: z.string().trim().min(1).optional(),
  rank: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  unit: z.string().trim().min(1).optional(),
});
export type QuarterUpdateInput = z.infer<typeof quarterUpdateSchema>;

export const maintenanceStartSchema = z.object({
  remark: z.string().trim().min(1, "Maintenance remark is required"),
});
export type MaintenanceStartInput = z.infer<typeof maintenanceStartSchema>;

export const maintenanceCompleteSchema = z.object({
  remark: z.string().trim().optional().default(""),
});
export type MaintenanceCompleteInput = z.infer<typeof maintenanceCompleteSchema>;

export const applicantSchema = z.object({
  serviceNo: z.string().trim().min(1, "Army number is required"),
  name: z.string().trim().min(1, "Name is required"),
  rank: z.string().trim().min(1, "Rank is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  seniorityDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  remarks: z.string().trim().optional(),
});
export type ApplicantInput = z.infer<typeof applicantSchema>;

export const allotmentCreateSchema = z.object({
  applicantId: z.number().int().positive(),
  quarterId: z.number().int().positive(),
});
export type AllotmentCreateInput = z.infer<typeof allotmentCreateSchema>;

export const complaintCreateSchema = z.object({
  quarterId: z.number().int().positive(),
  applicantId: z.number().int().positive(),
  description: z.string().trim().min(1, "Description is required"),
});
export type ComplaintCreateInput = z.infer<typeof complaintCreateSchema>;

export const complaintStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "WAITING", "BLOCKED", "CLOSED"]);

export const complaintUpdateSchema = z
  .object({
    status: complaintStatusEnum.optional(),
    remark: z.string().trim().optional(),
  })
  .refine((data) => data.status !== undefined || data.remark !== undefined, {
    message: "Provide a status or a remark to update.",
  });
export type ComplaintUpdateInput = z.infer<typeof complaintUpdateSchema>;

export const vacationCreateSchema = z.object({
  quarterId: z.number().int().positive(),
  applicantId: z.number().int().positive(),
});
export type VacationCreateInput = z.infer<typeof vacationCreateSchema>;

export const vacationInspectSchema = z.object({
  defects: z.string().trim().optional().default(""),
});
export type VacationInspectInput = z.infer<typeof vacationInspectSchema>;
