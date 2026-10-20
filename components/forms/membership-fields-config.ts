import { DynamicFieldConfig } from "@/components/common/form-fields";
import type { MembershipFormValues } from "./membership-form";


/**
 * Base Membership Form Fields (rendered regardless of target role)
 */
export const BASE_MEMBERSHIP_FIELDS: DynamicFieldConfig<MembershipFormValues>[] = [
  {
    name: "name",
    label: "Plan Name",
    type: "text",
    placeholder: "Name of the plan",
  },
  {
    name: "monthlyPrice",
    label: "Monthly Price ($)",
    type: "text",
    placeholder: "0.00",
    isDisabled: (values) => Boolean(values.is_free),
  },
  {
    name: "yearlyPrice",
    label: "Yearly Price ($)",
    type: "text",
    placeholder: "0.00",
    isDisabled: (values) => Boolean(values.is_free),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Brief description",
    rows: 4,
    className: "md:col-span-2",
  },
];

/**
 * Role-Specific Dynamic Membership Form Fields
 * Easily add/remove fields or update target roles here without touching JSX!
 */
export const ROLE_MEMBERSHIP_FIELDS: DynamicFieldConfig<MembershipFormValues>[] = [
  {
    name: "maxCities",
    label: "Max Cities",
    type: "number",
    placeholder: "Maximum number of Cities",
    roles: ["CONTRACTOR", "MANUFACTURER"],
    isVisible: (values) =>
      Boolean(
        values.level_features?.is_contractor_directory === true ||
          values.level_features?.is_contractor_directory === "true" ||
          values.level_features?.is_contractor_directory === 1,
      ),
  },
  {
    name: "maxProperties",
    label: "Max Properties",
    type: "number",
    placeholder: "Maximum number of Properties can add",
    roles: ["CONTRACTOR", "MANUFACTURER"],
    isDisabled: (values) => !!values.isUnlimitedProperties,
  },
  {
    name: "maxUsers",
    label: "Max Users",
    type: "number",
    placeholder: "Maximun user can be added",
    roles: ["CONTRACTOR", "MANUFACTURER"],
  },
  {
    name: "maxProjects",
    label: "Max Projects",
    type: "number",
    placeholder: "Maximum number of Projects",
    roles: ["PROPERTY_OWNER", "CONTRACTOR", "MANUFACTURER"],
    isDisabled: (values) => !!values.isUnlimitedProjects,
  },
  {
    name: "isUnlimitedProperties",
    label: "unlimitedProperty",
    type: "checkbox",
    roles: ["CONTRACTOR", "MANUFACTURER"],
  },
  {
    name: "isUnlimitedProjects",
    label: "unlimitedProject",
    type: "checkbox",
    roles: ["PROPERTY_OWNER", "CONTRACTOR", "MANUFACTURER"],
  },
  {
    name: "maxReports",
    label: "Max Reports",
    type: "number",
    placeholder: "Maximum number of reports",
    roles: ["INSURANCE_COMPANY", "CONTRACTOR", "PROPERTY_OWNER", "REALTOR"],
    isDisabled: (values) => !!values.isUnlimitedAccess,
  },
  {
    name: "isUnlimitedAccess",
    label: "unlimited Reports",
    type: "checkbox",
    roles: ["INSURANCE_COMPANY", "CONTRACTOR", "PROPERTY_OWNER", "REALTOR"],
  },
];
