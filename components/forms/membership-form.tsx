"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Crown, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createMembership, updateMembership, getRoles } from "@/lib/actions";
import {
  DynamicFeaturesTable,
  convertFeaturesObjectToArray,
  convertFeaturesArrayToObject,
} from "@/components/common/dynamic-features-table";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DynamicFormFields,
  FormCheckboxField,
} from "@/components/common/form-fields";
import {
  BASE_MEMBERSHIP_FIELDS,
  ROLE_MEMBERSHIP_FIELDS,
} from "./membership-fields-config";

const featureSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  value: z.string().nullable().optional(),
});

const membershipFormSchema = z
  .object({
    name: z.string().min(2, "Plan name must be at least 2 characters"),
    description: z.string().optional(),
    monthlyPrice: z.string().optional(),
    yearlyPrice: z.string().optional(),
    targetRole: z.string().min(1, "Please select a target role"),
    level: z.string().optional(),
    maxReports: z.string().optional(),
    maxUsers: z.string().optional(),
    isUnlimitedAccess: z.boolean(),
    maxCities: z.string().optional(),
    maxProjects: z.string().optional(),
    maxProperties: z.string().optional(),
    features: z.array(featureSchema),
    isUnlimitedProjects: z.boolean(),
    isUnlimitedProperties: z.boolean(),
    status: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.targetRole === "CONTRACTOR" && !data.level) {
        return false;
      }
      if (data.targetRole === "INSURANCE_COMPANY" && !data.maxReports) {
        return false;
      }
      // PROPERTY_OWNER and INSPECTOR don't need conditional fields
      return true;
    },
    {
      message: "Required fields for selected role are missing",
      path: ["targetRole"],
    },
  )
  .superRefine((data, ctx) => {
    if (data.level && data.level !== "FREE") {
      if (
        data.monthlyPrice &&
        !isNaN(parseFloat(data.monthlyPrice)) &&
        parseFloat(data.monthlyPrice) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Monthly price cannot be 0 for non-free plans",
          path: ["monthlyPrice"],
        });
      }
      if (
        data.yearlyPrice &&
        !isNaN(parseFloat(data.yearlyPrice)) &&
        parseFloat(data.yearlyPrice) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Yearly price cannot be 0 for non-free plans",
          path: ["yearlyPrice"],
        });
      }
    }
  });

export type MembershipFormValues = z.infer<typeof membershipFormSchema>;

interface MembershipFormProps {
  membership?: {
    id: string;
    name: string;
    description: string;
    monthlyAmount: string | any;
    yearlyAmount: string | any;
    targetRole?: string;
    level?: string;
    maxReports?: number | any;
    maxCities?: number;
    maxProperties?: number;
    maxUsers?: number;
    isUnlimitedAccess?: boolean;
    maxProjects?: number;
    isUnlimitedProjects: boolean;
    isUnlimitedProperties: boolean;
    features: Record<string, string | number | boolean>;
    isActive: boolean;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MembershipForm({
  membership,
  onSuccess,
  onCancel,
}: MembershipFormProps) {
  const isEditing = !!membership;
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        setRoles(response.data || []);
      } catch (error: any) {
        console.error("Failed to fetch roles:", error);
        toast.error(error.message || "Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      name: membership?.name || "",
      description: membership?.description || "",
      monthlyPrice: membership?.monthlyAmount || "",
      yearlyPrice: membership?.yearlyAmount || "",
      targetRole: membership?.targetRole || "",
      level: membership?.level || "",
      maxProjects: membership?.maxProjects?.toString() || "",
      maxReports: membership?.maxReports?.toString() || "",
      maxCities: membership?.maxCities?.toString() || "",
      maxProperties: membership?.maxProperties?.toString() || "",
      maxUsers: membership?.maxUsers?.toString() || "",
      isUnlimitedAccess: membership?.isUnlimitedAccess ?? true,
      isUnlimitedProjects: membership?.isUnlimitedProjects ?? false,
      isUnlimitedProperties: membership?.isUnlimitedProperties ?? false,
      status: membership?.isActive ?? true,
      features: membership?.features
        ? convertFeaturesObjectToArray(membership.features)
        : [],
    },
  });
  const level = form.watch("level");
  const isFree = level === "FREE";

  React.useEffect(() => {
    if (isFree) {
      form.setValue("monthlyPrice", "0");
      form.setValue("yearlyPrice", "");
    }
  }, [isFree, form]);

  const onSubmit = async (data: MembershipFormValues) => {
    const transformedFeatures = convertFeaturesArrayToObject(data.features);

    const requestBody: any = {
      name: data.name,
      description: data.description,
      monthlyAmount:
        !data.monthlyPrice || data.monthlyPrice.trim() === ""
          ? null
          : data.monthlyPrice,
      yearlyAmount:
        !data.yearlyPrice || data.yearlyPrice.trim() === ""
          ? null
          : data.yearlyPrice,
      targetRole: data.targetRole,
      features: transformedFeatures,
      isActive: data.status,
    };

    // Dynamically populate role-specific fields matching data.targetRole
    const activeRoleFields = ROLE_MEMBERSHIP_FIELDS.filter(
      (field) => !field.roles || field.roles.includes(data.targetRole)
    );

    activeRoleFields.forEach((field) => {
      const rawValue = data[field.name as keyof MembershipFormValues];
      if (field.type === "number") {
        requestBody[field.name] =
          rawValue && typeof rawValue === "string" && rawValue.trim() !== ""
            ? parseInt(rawValue, 10)
            : null;
      } else if (rawValue !== undefined) {
        requestBody[field.name] = rawValue;
      }
    });

    try {
      if (isEditing && membership) {
        const response = await updateMembership(requestBody, membership.id);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success(`Successfully updated membership plan: ${data.name}`);
      } else {
        const request = await createMembership(requestBody);
        if (!request.success) {
          toast.error(request.message);
          return;
        }
        toast.success(`Successfully created membership plan: ${data.name}`);
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message ||
          `Failed to ${isEditing ? "update" : "create"} membership`,
      );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="px-8 py-10 border-b relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Crown className="size-24 text-primary" />
              </div>
              <div className="relative z-10">
                <CardTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles className="size-8 text-primary" />
                  {isEditing ? "Edit Membership Plan" : "New Membership Plan"}
                </CardTitle>
                <CardDescription className="text-base font-medium text-muted-foreground mt-2">
                  {isEditing
                    ? "Update the details and features of this subscription tier."
                    : "Define the details and features of your new subscription tier."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Base Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">
                        Target Role
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loadingRoles}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-input focus:bg-background transition-all shadow-none">
                            <SelectValue
                              placeholder={
                                loadingRoles
                                  ? "Loading roles..."
                                  : "Select target role"
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
                              <SelectItem key={role.id} value={role.role_name}>
                                {role.role_name
                                  .split("_")
                                  .map(
                                    (word: string) =>
                                      word.charAt(0) +
                                      word.slice(1).toLowerCase(),
                                  )
                                  .join(" ")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <DynamicFormFields
                  fields={BASE_MEMBERSHIP_FIELDS}
                  form={form}
                  gridClassName="contents"
                />
              </div>

              {/* Role-Specific Dynamic Fields */}
              <DynamicFormFields
                fields={ROLE_MEMBERSHIP_FIELDS}
                form={form}
                targetRole={form.watch("targetRole")}
              />

              <DynamicFeaturesTable
                control={form.control}
                name="features"
                title="Plan Features"
                namePlaceholder="Field name"
                valuePlaceholder="Value"
                addButtonText="Add New Feature Line"
              />

              <FormCheckboxField
                control={form.control}
                name="status"
                label="Status (is active)"
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4 py-6 px-2">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                Membership data will be public until status is set to active
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                type="button"
                onClick={onCancel}
                className="font-bold text-xs uppercase tracking-widest  h-12 px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl h-12 px-10 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isEditing ? "Update Membership" : "Save Membership"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
