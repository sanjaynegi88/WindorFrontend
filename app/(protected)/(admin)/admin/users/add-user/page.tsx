"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UserPlus,
  Loader2,
  ShieldCheck,
  EyeOff,
  Eye,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySelect, StateSelect } from "@/components/city-zip-selector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Content } from "@/components/layouts/crm/components/content";
import {
  addUser,
  getRoles,
  getServiceProvided,
  getStates,
} from "@/lib/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { toPascalCase } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ServiceSelect } from "@/components/service-select";

import { RoleForm } from "@/components/user-form/RoleForm";
import {
  propertyRoleSchema as propertySchema,
  contractorRoleSchema as contractorSchema,
  insuranceRoleSchema as insuranceSchema,
  inspectorRoleSchema as inspectorSchema,
} from "@/lib/user-role-schema";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  "h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap";

// ─── Role groups ──────────────────────────────────────────────────────────────
const PROPERTY_ROLES = ["PROPERTY_OWNER", "REALTOR"];
const CONTRACTOR_ROLES = ["CONTRACTOR", "MANUFACTURER"];
const INSURANCE_ROLES = ["INSURANCE_COMPANY"];
const INSPECTOR_ROLES = ["CITY_INSPECTOR"];

function getRoleGroup(
  roleName: string,
): "property" | "contractor" | "insurance" | "inspector" | null {
  if (PROPERTY_ROLES.includes(roleName)) return "property";
  if (CONTRACTOR_ROLES.includes(roleName)) return "contractor";
  if (INSURANCE_ROLES.includes(roleName)) return "insurance";
  if (INSPECTOR_ROLES.includes(roleName)) return "inspector";
  return null;
}

// ─── Step 1 schema ────────────────────────────────────────────────────────────
const step1Schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Please select a user role"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character.",
    }),
});

type Step1Values = z.infer<typeof step1Schema>;

type PropertyValues = z.infer<typeof propertySchema>;
type ContractorValues = z.infer<typeof contractorSchema>;
type InsuranceValues = z.infer<typeof insuranceSchema>;
type InspectorValues = z.infer<typeof inspectorSchema>;

// ─── Step 2 — Property / Realtor ─────────────────────────────────────────────
function PropertyForm({
  onSubmit,
  onBack,
  loading,
}: {
  onSubmit: (v: PropertyValues) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [isPresent, setIsPresent] = useState(false);

  const form = useForm<PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      propertyAddress: "",
      ownerDateStart: "",
      ownerDateEnd: "",
      present: false,
      mobilePhone: "",
      state_id: "",
      city_id: "",
      zip: "",
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <RoleForm
          role="PROPERTY_OWNER"
          context="add-user"
          form={form}
          isPresent={isPresent}
          onPresentChange={setIsPresent}
        />
        <FormButtons onBack={onBack} loading={loading} />
      </form>
    </Form>
  );
}

// ─── Step 2 — Contractor / Manufacturer ──────────────────────────────────────
function ContractorForm({
  onSubmit,
  onBack,
  loading,
}: {
  onSubmit: (v: ContractorValues) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [showLicenseWarning, setShowLicenseWarning] = useState(false);
  const [pendingValues, setPendingValues] = useState<ContractorValues | null>(
    null,
  );

  const form = useForm<ContractorValues>({
    resolver: zodResolver(contractorSchema),
    defaultValues: {
      companyAddress: "",
      websiteUrl: "",
      mobilePhone: "",
      companyPhone: "",
      serviceTypes: [],
      other_service: "",
      licenseNumber: "",
      state_id: "",
      city_id: "",
      companyEmail: "",
      company_name: "",
    },
  });

  function handleFormSubmit(values: ContractorValues) {
    if (!values.licenseNumber || values.licenseNumber.trim() === "") {
      onSubmit(values);
    } else {
      onSubmit(values);
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-5"
        >
          <RoleForm role="CONTRACTOR" context="add-user" form={form} />
          <FormButtons onBack={onBack} loading={loading} />
        </form>
      </Form>
      <ConfirmDialog
        isOpen={showLicenseWarning}
        onOpenChange={setShowLicenseWarning}
        title="License Number Not Provided"
        description="The license number field is empty. Would you like to continue without entering it?"
        confirmText="Continue Without License"
        cancelText="Cancel"
        onConfirm={() => {
          if (pendingValues) {
            onSubmit(pendingValues);
          }
        }}
      />
    </>
  );
}

// ─── Step 2 — Insurance Company ───────────────────────────────────────────────
function InsuranceForm({
  onSubmit,
  onBack,
  loading,
}: {
  onSubmit: (v: InsuranceValues) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const form = useForm<InsuranceValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      company_name: "",
      companyAddress: "",
      websiteUrl: "",
      mobilePhone: "",
      companyPhone: "",
      state_id: "",
      city_id: "",
      title: "",
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <RoleForm role="INSURANCE_COMPANY" context="add-user" form={form} />
        <FormButtons onBack={onBack} loading={loading} />
      </form>
    </Form>
  );
}

// ─── Step 2 — City Inspector ──────────────────────────────────────────────────
function InspectorForm({
  onSubmit,
  onBack,
  loading,
}: {
  onSubmit: (v: InspectorValues) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const form = useForm<InspectorValues>({
    resolver: zodResolver(inspectorSchema),
    defaultValues: {
      state_id: "",
      city_id: "",
      cityOfficial: "",
      cityAddress: "",
      cityPhone: "",
      title: "",
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <RoleForm role="CITY_INSPECTOR" context="add-user" form={form} />
        <FormButtons onBack={onBack} loading={loading} />
      </form>
    </Form>
  );
}

// ─── Shared form buttons ──────────────────────────────────────────────────────
function FormButtons({
  onBack,
  loading,
}: {
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-2 border-t">
      <Button
        type="submit"
        disabled={loading}
        className="sm:flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-5 w-5" />
            Create User Account
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={loading}
        className="h-12 px-8 font-semibold"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/40 text-white" : "bg-muted text-muted-foreground"}`}
          >
            {s}
          </div>
          {s < 2 && (
            <div
              className={`w-12 h-0.5 rounded transition-colors ${step > 1 ? "bg-primary" : "bg-muted"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState("");

  useEffect(() => {
    getRoles()
      .then((r) => setRoles(r.data || []))
      .catch((error: any) =>
        toast.error(error.message || "Failed to load roles"),
      )
      .finally(() => setLoadingRoles(false));
  }, []);

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      password: "",
    },
  });

  // Restore saved values when coming back from step 2
  useEffect(() => {
    if (step === 1 && step1Data) {
      form.reset(step1Data);
    }
  }, [step]);

  const watchedRole = form.watch("role");
  const currentRoleName =
    roles.find((r) => r.id === watchedRole)?.role_name || "";

  function handleStep1Submit(values: Step1Values) {
    const roleName = roles.find((r) => r.id === values.role)?.role_name ?? "";
    setStep1Data(values);
    setSelectedRoleName(roleName);

    // If role has no extra fields, submit directly
    if (!getRoleGroup(roleName)) {
      submitUser(values, roleName, {});
      return;
    }
    setStep(2);
  }

  async function submitUser(
    s1: Step1Values,
    roleName: string,
    extra: Record<string, any>,
  ) {
    setLoading(true);
    const payload: Record<string, any> = {
      email: s1.email,
      first_name: s1.firstName,
      last_name: s1.lastName,
      role_id: s1.role,
      password: s1.password,
      ...extra,
    };
    const result = await addUser(payload);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || "Failed to add user");
      return;
    }
    toast.success(`User "${s1.firstName} ${s1.lastName}" added successfully!`);
    router.push("/admin/users");
  }

  function handleStep2Submit(
    values:
      | PropertyValues
      | ContractorValues
      | InsuranceValues
      | InspectorValues,
  ) {
    if (!step1Data) return;
    submitUser(step1Data, selectedRoleName, values);
  }

  const roleGroup = getRoleGroup(selectedRoleName);

  return (
    <Content className="block py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
          <CardHeader className="border-b bg-muted/20 p-5 sm:p-8">
            <div className="w-full flex justify-center pt-2">
              <StepIndicator step={step} />
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <CardTitle className="text-xl">
                  {step === 1
                    ? "User Credentials"
                    : `${selectedRoleName.replace(/_/g, " ")} Details`}
                </CardTitle>
                <CardDescription>
                  {step === 1
                    ? "Create a new account and assign access permissions."
                    : "Fill in the role-specific information."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-8">
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleStep1Submit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="First Name* (Required)"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Last Name* (Required)"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email* (Required)"
                            {...field}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingRoles}
                        >
                          <FormControl>
                            <SelectTrigger className={inputCls}>
                              <SelectValue
                                placeholder={
                                  loadingRoles
                                    ? "Loading roles..."
                                    : "Select a role"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles
                              .filter(
                                (role) =>
                                  role.role_name.toLowerCase() !== "admin",
                              )
                              .map((role) => (
                                <SelectItem
                                  key={role.id}
                                  value={role.id}
                                  className="cursor-pointer"
                                >
                                  {role.role_name
                                    .split("_")
                                    .map(
                                      (w) =>
                                        w.charAt(0) + w.slice(1).toLowerCase(),
                                    )
                                    .join(" ")}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Initial Password"
                              className={inputCls}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-2 border-t">
                    <Button
                      type="submit"
                      disabled={loading || loadingRoles}
                      className="sm:flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                    >
                      {getRoleGroup(currentRoleName) ? (
                        "Next"
                      ) : loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating User...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create User Account
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="h-12 px-8 font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && roleGroup === "property" && (
              <PropertyForm
                onSubmit={handleStep2Submit}
                onBack={() => setStep(1)}
                loading={loading}
              />
            )}
            {step === 2 && roleGroup === "contractor" && (
              <ContractorForm
                onSubmit={handleStep2Submit}
                onBack={() => setStep(1)}
                loading={loading}
              />
            )}
            {step === 2 && roleGroup === "insurance" && (
              <InsuranceForm
                onSubmit={handleStep2Submit}
                onBack={() => setStep(1)}
                loading={loading}
              />
            )}
            {step === 2 && roleGroup === "inspector" && (
              <InspectorForm
                onSubmit={handleStep2Submit}
                onBack={() => setStep(1)}
                loading={loading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Content>
  );
}
