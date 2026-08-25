import * as z from "zod";
import { getRoleGroup, RoleGroup, FormContext } from "./user-role-fields";

export const phoneRegex = /^\d{10}$/;

export const propertyRoleSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  mobilePhone: z
    .string()
    .min(1, "Mobile phone is required")
    .regex(phoneRegex, "Mobile phone must be exactly 10 digits"),
  ownerDateStart: z.string().min(1, "Start date is required"),
  ownerDateEnd: z.string().optional().or(z.literal("")),
  present: z.boolean().optional(),
  state_id: z.string().min(1, "State is required"),
  city_id: z.string().min(1, "City is required"),
  zip: z.string().min(1, "Zip code is required"),
});

export const contractorRoleSchema = z.object({
  companyAddress: z.string().min(1, "Company address is required"),
  company_name: z.string().optional().or(z.literal("")),
  companyEmail: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().optional().or(z.literal("")),
  licenseNumber: z.string().optional().or(z.literal("")),
  mobilePhone: z
    .string()
    .min(1, "Mobile phone is required")
    .regex(phoneRegex, "Mobile phone must be exactly 10 digits"),
  companyPhone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || phoneRegex.test(val), {
      message: "Company phone must be exactly 10 digits",
    }),
  state_id: z.string().optional().or(z.literal("")),
  city_id: z.string().optional().or(z.literal("")),
  serviceTypes: z.array(z.string()).optional(),
  other_service: z.string().optional().or(z.literal("")),
});

export const insuranceRoleSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  websiteUrl: z.string().optional().or(z.literal("")),
  mobilePhone: z
    .string()
    .min(1, "Mobile phone is required")
    .regex(phoneRegex, "Mobile phone must be exactly 10 digits"),
  companyPhone: z
    .string()
    .min(1, "Company phone is required")
    .regex(phoneRegex, "Company phone must be exactly 10 digits"),
  state_id: z.string().optional().or(z.literal("")),
  city_id: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
});

export const inspectorRoleSchema = z.object({
  state_id: z.string().optional().or(z.literal("")),
  city_id: z.string().min(1, "City is required"),
  cityOfficial: z.string().min(1, "City official name is required"),
  cityAddress: z.string().min(1, "City address is required"),
  cityPhone: z
    .string()
    .min(1, "City phone is required")
    .regex(phoneRegex, "City phone must be exactly 10 digits"),
  title: z.string().min(1, "Title is required"),
});

export function getRoleZodSchema(
  roleName?: string | null,
  context?: FormContext
): z.ZodObject<any> {
  const group = getRoleGroup(roleName);
  switch (group) {
    case "property":
      return propertyRoleSchema;
    case "contractor":
      return contractorRoleSchema;
    case "insurance":
      return insuranceRoleSchema;
    case "inspector":
      return inspectorRoleSchema;
    default:
      return z.object({});
  }
}
