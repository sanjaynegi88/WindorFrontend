"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  createContractorProfile,
  updateContractorProfile,
  getServiceProvided,
} from "@/lib/actions";
import { ArrowRight, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { MultiCitySelector } from "@/components/multi-city-selector";
import { useRouter } from "next/navigation";
import { toPascalCase } from "@/lib/utils";

export interface ContractorProfileInitialData {
  id: string;
  description?: string;
  companyLogo?: string | null;
  selectedCities: string[];
  membershipLevel: string;
  services_provided_ids?: string[];
  cityDetails?: {
    id: string;
    name: string;
  }[];
}

interface ContractorProfileFormProps {
  membershipLevel: string;
  onSuccess?: () => void;

  initialData?: ContractorProfileInitialData;
  profileId?: string;
  role?: string;
}

export function ContractorProfileForm({
  membershipLevel,
  onSuccess,
  initialData,
  profileId,
  role,
}: ContractorProfileFormProps) {
  const isEditMode = !!profileId && !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);
  const isPremium = membershipLevel === "GOLD";
  const router = useRouter();

  const formatReportType = (value: string) =>
    value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await getServiceProvided();
        const list = Array.isArray(response?.data) ? response.data : [];
        setServices(list);
      } catch (error) {
        toast.error("Failed to load service types");
      }
    };
    fetchServices();
  }, []);

  const contractorProfileSchema = z.object({
    selected_cities: z.array(z.string()).min(1, "Select at least one city"),
    description: z.string().optional(),
    company_logo: z.any().optional(),
    services_provided_ids: isPremium
      ? z.array(z.string()).min(1, "Select at least one service")
      : z.array(z.string()).optional(),
  });

  type ContractorProfileFormValues = z.infer<typeof contractorProfileSchema>;

  const form = useForm<ContractorProfileFormValues>({
    resolver: zodResolver(contractorProfileSchema),
    defaultValues: {
      selected_cities: [],
      description: "",
      services_provided_ids: [],
    },
  });

  useEffect(() => {
    if (initialData) {

      form.reset({

        selected_cities: initialData.selectedCities,
        description: initialData.description ?? "",
        services_provided_ids: initialData.services_provided_ids ?? [],
      });

    }
  }, [initialData, form]);

  const onSubmit = async (data: ContractorProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("selected_cities", data.selected_cities.join(", "));

      if (isPremium) {
        if (data.description) formData.append("description", data.description);
        if (data.company_logo?.[0]) {
          formData.append("company_logo", data.company_logo[0]);
        }
        if (data.services_provided_ids?.length) {
          data.services_provided_ids.forEach((id) => {
            formData.append("services_provided_ids", id);
          });
        }
      }

      if (isEditMode) {
        const response = await updateContractorProfile(profileId, formData, role);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success("Contractor profile updated successfully!");
      } else {
        const response = await createContractorProfile(formData);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        localStorage.removeItem("pending_level");
        toast.success("Contractor profile created successfully!");
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message ||
        (isEditMode
          ? "Failed to update contractor profile"
          : "Failed to create contractor profile"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!isEditMode) {
      toast.success("You can add your profile in Directory Listing later by visiting the Profile page.");
      router.push("/dashboard")
    }
    else {
      router.back()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="px-8 py-10 border-b bg-primary/5">
              <div className="flex items-center gap-3">
                <Building2 className="w-15 h-15 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-black tracking-tighter">
                    {isEditMode ? "Edit Profile" : "Directory Information"}
                  </CardTitle>
                  <CardDescription className="text-base font-medium mt-2">
                    {isEditMode
                      ? "Update your contractor directory profile"
                      : "Set up your contractor directory profile to get started"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              <FormField
                control={form.control}
                name="selected_cities"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-xs font-bold uppercase">
                      Service Cities <span className="text-red-500">*</span>
                    </Label>
                    <FormControl>
                      <MultiCitySelector
                        selectedCities={field.value}
                        selectedCityDetails={initialData?.cityDetails || []}
                        onCitiesChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPremium && (
                <>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-xs font-bold uppercase">
                          Description
                        </Label>
                        <FormControl>
                          <Textarea {...field} rows={4} className="w-full bg-white border border-[rgba(112,128,144,0.23)] text-[#1F2A44] placeholder:text-[#1F2A44]/50 font-asap font-medium  px-3 py-3 focus-visible:border-[#1CA7A6] focus-visible:ring-[#1CA7A6]/30 focus-visible:outline-none resize-none transition-[color,box-shadow]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_logo"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <Label className="text-xs font-bold uppercase">
                          Company Logo
                        </Label>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                            className="h-12 "
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="services_provided_ids"
                    render={() => (
                      <FormItem>
                        <Label className="text-xs font-bold uppercase">
                          Services Provided <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {services.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="services_provided_ids"
                              render={({ field }) => (
                                <FormItem
                                  key={service.id}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange([
                                            ...(field.value || []),
                                            service.id,
                                          ])
                                          : field.onChange(
                                            field.value?.filter(
                                              (v) => v !== service.id,
                                            ) || [],
                                          )
                                      }
                                    />
                                  </FormControl>
                                  <Label className="text-sm font-medium cursor-pointer">
                                    {toPascalCase(service.service_name)}
                                  </Label>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
              className="h-12 px-8 rounded-xl font-medium"
            >
              Complete Later
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 rounded-xl font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating Profile..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
