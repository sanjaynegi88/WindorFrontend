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
import { ArrowLeft, ArrowRight, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { MultiCitySelector } from "@/components/multi-city-selector";
import { StateSelect } from "@/components/state-select";
import { useRouter } from "next/navigation";
import { toPascalCase, getAppImageUrl } from "@/lib/utils";
import { ServiceSelect } from "@/components/service-select";
import { useUser } from "@/components/providers/user-provider";

export interface LevelFeatures {
  is_contractor_directory?: boolean;
  can_upload_logo?: boolean;
  can_add_description?: boolean;
  [key: string]: any;
}

export interface LevelInfo {
  id?: string;
  name?: string;
  role?: string;
  priority?: number;
  features?: LevelFeatures;
  [key: string]: any;
}

export interface ContractorProfileInitialData {
  id: string;
  description?: string;
  companyLogo?: string | null;
  selectedCities: string[];
  membershipLevel?: string;
  level_info?: LevelInfo;
  cityDetails?: {
    id: string;
    name: string;
  }[];
}

interface ContractorProfileFormProps {
  membershipLevel?: string;
  levelInfo?: LevelInfo;
  onSuccess?: () => void;

  initialData?: ContractorProfileInitialData;
  profileId?: string;
  role?: string;
  onSubmitSuccess?: () => void;
}

export function ContractorProfileForm({
  membershipLevel,
  levelInfo,
  onSuccess,
  initialData,
  profileId,
  role,
  onSubmitSuccess,
}: ContractorProfileFormProps) {
  const { user } = useUser();
  const isEditMode = !!profileId && !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [services, setServices] = useState<
    { id: string; service_name: string }[]
  >([]);

  const resolvedLevelInfo: LevelInfo | undefined =
    levelInfo ||
    initialData?.level_info ||
    (user as any)?.level_info ||
    (user as any)?.current_subscription?.plan?.level_info;

  const features: LevelFeatures = resolvedLevelInfo?.features || {};
  const canUploadLogo = Boolean(features.can_upload_logo);
  const canAddDescription = Boolean(features.can_add_description);

  const router = useRouter();

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
  });

  type ContractorProfileFormValues = z.infer<typeof contractorProfileSchema>;

  const form = useForm<ContractorProfileFormValues>({
    resolver: zodResolver(contractorProfileSchema),
    defaultValues: {
      selected_cities: [],
      description: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        selected_cities: initialData.selectedCities,
        description: initialData.description ?? "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: ContractorProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("selected_cities", data.selected_cities.join(", "));

      if (canAddDescription && data.description) {
        formData.append("description", data.description);
      }
      if (canUploadLogo && data.company_logo?.[0]) {
        formData.append("company_logo", data.company_logo[0]);
      }

      if (isEditMode) {
        const response = await updateContractorProfile(
          profileId,
          formData,
          role,
        );
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
      toast.success(
        "You can add your profile in Directory Listing later by visiting the Profile page.",
      );
      router.push("/dashboard");
    } else {
      router.back();
    }
  };

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
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">
                  Filter Cities by State
                </Label>
                <StateSelect
                  value={selectedStateId}
                  onChange={(val) => setSelectedStateId(val)}
                  placeholder="Select state to filter cities"
                  className="h-12 bg-white border border-[rgba(112,128,144,0.23)] rounded-[6px]"
                />
              </div>

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
                        stateId={selectedStateId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canAddDescription && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-xs font-bold uppercase">
                        Company Description
                      </Label>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your services, specialization, and company background..."
                          className="min-h-[120px] rounded-xl border border-[rgba(112,128,144,0.23)] font-asap"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {canUploadLogo && (
                <FormField
                  control={form.control}
                  name="company_logo"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <Label className="text-xs font-bold uppercase">
                        Company Logo
                      </Label>
                      <FormControl>
                        <div className="space-y-3">
                          {initialData?.companyLogo && (
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-dashed border-border/60">
                              <img
                                src={getAppImageUrl(initialData.companyLogo)}
                                alt="Company Logo"
                                className="size-14 object-contain rounded-lg border bg-white"
                              />
                              <div className="text-xs text-muted-foreground font-medium">
                                Current Company Logo
                              </div>
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files)}
                            className="cursor-pointer rounded-xl h-11"
                            {...fieldProps}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 sm:px-8 rounded-xl font-medium"
            >
              {isEditMode ? "Cancel" : "Complete Later"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 px-6 sm:px-8 rounded-xl font-bold"
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
