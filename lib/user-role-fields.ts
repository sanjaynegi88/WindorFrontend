export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "state"
  | "city"
  | "checkbox"
  | "service";

export type FormContext =
  | "add-user"
  | "edit-user"
  | "profile"
  | "register"
  | "select-role";

export interface RoleFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean | Partial<Record<FormContext, boolean>>;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "email" | "url" | "tel";
  dependsOn?: string;
  gridSpan?: "full" | "half";
}

export type RoleGroup = "property" | "contractor" | "insurance" | "inspector";

export function getRoleGroup(roleName?: string | null): RoleGroup | null {
  if (!roleName) return null;
  const upper = roleName.toUpperCase().replace(/\s+/g, "_");
  if (["PROPERTY_OWNER", "HOMEOWNER", "REALTOR", "PROPERTY"].some((r) => upper.includes(r))) {
    return "property";
  }
  if (["CONTRACTOR", "MANUFACTURER", "DISTRIBUTOR"].some((r) => upper.includes(r))) {
    return "contractor";
  }
  if (["INSURANCE_COMPANY", "INSURANCE"].some((r) => upper.includes(r))) {
    return "insurance";
  }
  if (["CITY_INSPECTOR", "INSPECTOR"].some((r) => upper.includes(r))) {
    return "inspector";
  }
  return null;
}

export const PROPERTY_ROLE_FIELDS: RoleFieldConfig[] = [
  {
    name: "propertyAddress",
    label: "Property Address",
    type: "text",
    required: true,
    placeholder: "Property Address",
    gridSpan: "full",
  },
  {
    name: "mobilePhone",
    label: "Phone (Direct)",
    type: "phone",
    required: true,
    placeholder: "Mobile Phone (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "state_id",
    label: "State",
    type: "state",
    required: true,
    placeholder: "Select a state",
    gridSpan: "half",
  },
  {
    name: "city_id",
    label: "City",
    type: "city",
    required: true,
    placeholder: "Select a city",
    dependsOn: "state_id",
    gridSpan: "half",
  },
  {
    name: "zip",
    label: "Zip Code",
    type: "text",
    required: true,
    placeholder: "Zip Code",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "ownerDateStart",
    label: "Owner Start Date",
    type: "date",
    required: true,
    gridSpan: "half",
  },
  {
    name: "ownerDateEnd",
    label: "Owner End Date",
    type: "date",
    required: false,
    gridSpan: "half",
  },
  {
    name: "present",
    label: "Present (Currently Residing)",
    type: "checkbox",
    required: false,
    gridSpan: "full",
  },
];

export const CONTRACTOR_ROLE_FIELDS: RoleFieldConfig[] = [
  {
    name: "company_name",
    label: "Company Name",
    type: "text",
    required: false,
    placeholder: "Company Name (optional)",
    gridSpan: "half",
  },
  {
    name: "companyEmail",
    label: "Company Email",
    type: "email",
    required: false,
    placeholder: "Email (optional)",
    gridSpan: "half",
  },
  {
    name: "companyAddress",
    label: "Company Address",
    type: "text",
    required: true,
    placeholder: "Company Address",
    gridSpan: "full",
  },
  {
    name: "websiteUrl",
    label: "Website URL",
    type: "text",
    required: false,
    placeholder: "https://...",
    gridSpan: "half",
  },
  {
    name: "mobilePhone",
    label: "Mobile Phone",
    type: "phone",
    required: true,
    placeholder: "Mobile (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "companyPhone",
    label: "Company Phone",
    type: "phone",
    required: false,
    placeholder: "Company (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "state_id",
    label: "State",
    type: "state",
    required: false,
    placeholder: "Select a state",
    gridSpan: "half",
  },
  {
    name: "city_id",
    label: "City",
    type: "city",
    required: {
      "add-user": false,
      "edit-user": false,
      "profile": true,
      "register": false,
      "select-role": false,
    },
    placeholder: "Select a city",
    dependsOn: "state_id",
    gridSpan: "half",
  },
  {
    name: "licenseNumber",
    label: "License Number",
    type: "text",
    required: false,
    placeholder: "License No.",
    gridSpan: "half",
  },
  {
    name: "serviceTypes",
    label: "Services Provided",
    type: "service",
    required: false,
    gridSpan: "full",
  },
];

export const INSURANCE_ROLE_FIELDS: RoleFieldConfig[] = [
  {
    name: "company_name",
    label: "Company Name",
    type: "text",
    required: true,
    placeholder: "Company Name",
    gridSpan: "half",
  },
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    placeholder: "Title",
    gridSpan: "half",
  },
  {
    name: "companyAddress",
    label: "Company Address",
    type: "text",
    required: true,
    placeholder: "Company Address",
    gridSpan: "full",
  },
  {
    name: "websiteUrl",
    label: "Website URL",
    type: "text",
    required: false,
    placeholder: "https://...",
    gridSpan: "half",
  },
  {
    name: "mobilePhone",
    label: "Mobile Phone",
    type: "phone",
    required: true,
    placeholder: "Mobile (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "companyPhone",
    label: "Company Phone",
    type: "phone",
    required: true,
    placeholder: "Company Phone (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
  {
    name: "state_id",
    label: "State",
    type: "state",
    required: false,
    placeholder: "Select a state",
    gridSpan: "half",
  },
  {
    name: "city_id",
    label: "City",
    type: "city",
    required: false,
    placeholder: "Select a city",
    dependsOn: "state_id",
    gridSpan: "half",
  },
];

export const INSPECTOR_ROLE_FIELDS: RoleFieldConfig[] = [
  {
    name: "state_id",
    label: "State",
    type: "state",
    required: false,
    placeholder: "Select a state",
    gridSpan: "half",
  },
  {
    name: "city_id",
    label: "City",
    type: "city",
    required: true,
    placeholder: "Select a city",
    dependsOn: "state_id",
    gridSpan: "half",
  },
  {
    name: "cityOfficial",
    label: "City Official Name",
    type: "text",
    required: true,
    placeholder: "City Official",
    gridSpan: "half",
  },
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    placeholder: "Title",
    gridSpan: "half",
  },
  {
    name: "cityAddress",
    label: "City Address",
    type: "text",
    required: true,
    placeholder: "City Address",
    gridSpan: "full",
  },
  {
    name: "cityPhone",
    label: "City Phone",
    type: "phone",
    required: true,
    placeholder: "City Phone (10 digits)",
    maxLength: 10,
    inputMode: "numeric",
    gridSpan: "half",
  },
];

export function getRoleFields(roleName?: string | null): RoleFieldConfig[] {
  const group = getRoleGroup(roleName);
  switch (group) {
    case "property":
      return PROPERTY_ROLE_FIELDS;
    case "contractor":
      return CONTRACTOR_ROLE_FIELDS;
    case "insurance":
      return INSURANCE_ROLE_FIELDS;
    case "inspector":
      return INSPECTOR_ROLE_FIELDS;
    default:
      return [];
  }
}

export function isFieldRequired(
  config: RoleFieldConfig,
  context: FormContext
): boolean {
  if (typeof config.required === "boolean") {
    return config.required;
  }
  if (typeof config.required === "object" && config.required !== null) {
    return Boolean(config.required[context]);
  }
  return false;
}
