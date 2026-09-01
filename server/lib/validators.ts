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

export const quarterSchema = z.object({
  quarterNo: z.string().trim().min(1, "Quarter number is required"),
  colony: z.string().trim().min(1, "Quarter location is required"),
});
export type QuarterInput = z.infer<typeof quarterSchema>;

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

export const vacationCreateSchema = z.object({
  quarterId: z.number().int().positive(),
  applicantId: z.number().int().positive(),
});
export type VacationCreateInput = z.infer<typeof vacationCreateSchema>;

export const vacationInspectSchema = z.object({
  defects: z.string().trim().optional().default(""),
});
export type VacationInspectInput = z.infer<typeof vacationInspectSchema>;
