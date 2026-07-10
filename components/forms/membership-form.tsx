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

const featureSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  value: z.string().min(1, "Value cannot be empty"),
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
  );

type MembershipFormValues = z.infer<typeof membershipFormSchema>;

interface MembershipFormProps {
  membership?: {
    id: string;
    name: string;
    description: string;
    monthlyAmount: string | any;
    yearlyAmount: string | any;
    targetRole?: string;
    level?: string;
    maxReports?: number;
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
  console.log(membership);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        setRoles(response.data || []);
      } catch (error: any) {
        console.error('Failed to fetch roles:', error);
        toast.error(error.message || 'Failed to load roles');
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
  const unlimitedProject = form.watch("isUnlimitedProjects");
  const unlimitedProperty = form.watch("isUnlimitedProperties");
  const isUnlimitedAccess = form.watch("isUnlimitedAccess");

  React.useEffect(() => {
    if (isFree) {
      form.setValue("monthlyPrice", "0");
      form.setValue("yearlyPrice", "0");
    }
  }, [isFree, form]);

  const onSubmit = async (data: MembershipFormValues) => {
    const transformedFeatures = convertFeaturesArrayToObject(data.features);

    const requestBody: any = {
      name: data.name,
      description: data.description,
      monthlyAmount:
        data.monthlyPrice?.trim() !== "" ? data.monthlyPrice : null,
      yearlyAmount: data.yearlyPrice?.trim() !== "" ? data.yearlyPrice : null,
      targetRole: data.targetRole,
      features: transformedFeatures,
      isActive: data.status,
    };

    if (data.targetRole === "PROPERTY_OWNER" && data.level) {
      requestBody.level = data.level;
      requestBody.maxProjects = data.maxProjects;
      requestBody.isUnlimitedProjects = data.isUnlimitedProjects;
    }

    if (data.targetRole === "CONTRACTOR" && data.level) {
      requestBody.level = data.level;
      requestBody.maxProperties = data.maxProperties;
      requestBody.maxProjects = data.maxProjects;
      requestBody.maxCities = data.maxCities;
      requestBody.maxUsers = data.maxUsers;
      requestBody.isUnlimitedProperties = data.isUnlimitedProperties;
      requestBody.isUnlimitedProjects = data.isUnlimitedProjects;
    }
    if (data.targetRole === "INSURANCE_COMPANY" && data.maxReports) {
      requestBody.maxReports = parseInt(data.maxReports);
      requestBody.isUnlimitedAccess = data.isUnlimitedAccess;
    }
    console.log("eee", requestBody);
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
                      <FormLabel className="font-semibold text-foreground">Target Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loadingRoles}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12  border-input focus:bg-background transition-all shadow-none">
                            <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select target role"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles
                            .filter((role) => role.role_name.toLowerCase() !== 'admin')
                            .map((role) => (
                              <SelectItem key={role.id} value={role.role_name}>
                                {role.role_name
                                  .split('_')
                                  .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
                                  .join(' ')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Plan Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Name of the plan"
                          {...field}
                          className="h-12 border-input focus:bg-background transition-all shadow-none"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Monthly Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          disabled={isFree}
                          className="h-12  border-input focus:bg-background transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Yearly Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          disabled={isFree}
                          className="h-12 border-input focus:bg-background transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description"
                          {...field}
                          rows={4}
                          className=" border-input transition-all shadow-none font-bold resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("targetRole") === "PROPERTY_OWNER" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12  border-input focus:bg-background transition-all shadow-none font-bold">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FREE">Free (No Cost)</SelectItem>
                            <SelectItem value="STANDARD">Standard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxProjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground"> Max Projects</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximum number of Projects"
                            {...field}
                            disabled={unlimitedProject}
                            className="h-12  border-input focus:bg-background transition-all shadow-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isUnlimitedProjects"
                    render={({ field }) => (
                      <FormItem className="flex-row items-center gap-2">
                        <FormLabel className="font-semibold text-foreground">unlimitedProject</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch("targetRole") === "CONTRACTOR" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12  border-input focus:bg-background transition-all shadow-none ">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FREE">Free (No Cost)</SelectItem>
                            <SelectItem value="STANDARD">Standard</SelectItem>
                            <SelectItem value="SILVER">Silver</SelectItem>
                            <SelectItem value="GOLD">Gold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxCities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground"> Max Cities</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximum number of Cities"
                            {...field}
                            className="h-12  border-input focus:bg-background transition-all shadow-none "
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxProperties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Max Properties</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximum number of Properties can add"
                            {...field}
                            disabled={unlimitedProperty}
                            className="h-12  border-input focus:bg-background transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Max Users</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximun user can be added"
                            {...field}
                            className="h-12  border-input focus:bg-background transition-all shadow-none"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxProjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground"> Max Projects</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximum number of Projects"
                            {...field}
                            disabled={unlimitedProject}
                            className="h-12  border-input focus:bg-background transition-all shadow-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isUnlimitedProperties"
                    render={({ field }) => (
                      <FormItem className="flex-row items-center gap-2">
                        <FormLabel className="font-semibold text-foreground">unlimitedProperty</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isUnlimitedProjects"
                    render={({ field }) => (
                      <FormItem className="flex-row items-center gap-2">
                        <FormLabel className="font-semibold text-foreground">unlimitedProject</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch("targetRole") === "INSURANCE_COMPANY" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="maxReports"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Max Reports</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Maximum number of reports"
                            {...field}
                            disabled={isUnlimitedAccess}
                            className="h-12  border-input focus:bg-background transition-all shadow-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {form.watch("targetRole") === "INSURANCE_COMPANY" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="isUnlimitedAccess"
                    render={({ field }) => (
                      <FormItem className="flex-row items-center gap-2">
                        <FormLabel className="font-semibold text-foreground">Unlimited Access</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DynamicFeaturesTable
                control={form.control}
                name="features"
                title="Plan Features"
                namePlaceholder="Field name"
                valuePlaceholder="Value"
                addButtonText="Add New Feature Line"
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex-row items-center gap-2">
                    <FormLabel className="font-semibold text-foreground">Status (is active)</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
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
