"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { CitySelect, StateSelect } from "@/components/city-zip-selector";
import { toast } from "sonner";
import { getServiceProvided } from "@/lib/actions";
import { cn, toPascalCase } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ServiceSelect } from "@/components/service-select";

const inputCls =
  "h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap";
const errCls =
  "text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2";

const step2ContractorSchema = z.object({
  companyAddress: z.string().min(1, { message: "Company address is required" }),
  company_name: z.string().optional(),
  companyEmail: z.string().optional(),
  websiteUrl: z.string().optional(),
  licenseNumber: z.string().optional(),
  mobilePhone: z
    .string()
    .min(1, { message: "Mobile phone is required" })
    .regex(/^\d{10}$/, { message: "Mobile phone must be exactly 10 digits" }),
  companyPhone: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{10}$/.test(value), {
      message: "Company phone must be exactly 10 digits",
    }),
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  serviceTypes: z.array(z.string()).optional(),
  other_service: z.string().optional(),
});

export type Step2ContractorValues = z.infer<typeof step2ContractorSchema>;

interface Step2ContractorFormProps {
  onBack: () => void;
  onSubmit: (values: Step2ContractorValues) => void;
  loading: boolean;
}

export function Step2ContractorForm({
  onBack,
  onSubmit,
  loading,
}: Step2ContractorFormProps) {
  const [showLicenseWarning, setShowLicenseWarning] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<Step2ContractorValues | null>(null);

  const form = useForm<Step2ContractorValues>({
    resolver: zodResolver(step2ContractorSchema),
    defaultValues: {
      companyAddress: "",
      company_name: "",
      websiteUrl: "",
      licenseNumber: "",
      companyEmail: "",
      mobilePhone: "",
      companyPhone: "",
      state_id: "",
      city_id: "",
      serviceTypes: [],
      other_service: "",
    },
    mode: "onBlur",
  });

  function handleFormSubmit(values: Step2ContractorValues) {
    if (!values.licenseNumber || values.licenseNumber.trim() === "") {
      setPendingValues(values);
      setShowLicenseWarning(true);
    } else {
      onSubmit(values);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="w-full">
          <div className="space-y-6 mb-10">
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Company Address (required)"
                      {...field}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Company Name"
                      {...field}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Website URL"
                      {...field}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="License No."
                      {...field}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobilePhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Mobile Phone (required)"
                      {...field}
                      className={inputCls}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Company Phone"
                      {...field}
                      className={inputCls}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <div className={`[&_button]:h-[65px] [&_button]:rounded-[6px] [&_button]:border-[rgba(112,128,144,0.23)] [&_button]:text-[20px] [&_button]:font-asap [&_button]:font-medium [&_button]:text-[#708090] [&_button]:shadow-none [&_button]:bg-white`}>
              <StateSelect
                name="state_id"
                valueType="id"
                placeholder="Select a state"
                onSelectState={(st) => {
                  form.setValue("state_id", st.id);
                  form.setValue("city_id", "");
                }}
              />
            </div>

            <div className={`[&_button]:h-[65px] [&_button]:rounded-[6px] [&_button]:border-[rgba(112,128,144,0.23)] [&_button]:text-[20px] [&_button]:font-asap [&_button]:font-medium [&_button]:text-[#708090] [&_button]:shadow-none [&_button]:bg-white`}>
              <CitySelect
                name="city_id"
                valueType="id"
                placeholder="Select a city"
                stateValue={form.watch("state_id")}
                syncState={true}
              />
            </div>

            <ServiceSelect
              name="serviceTypes"
              label="Type of Service"
              variant="button"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 h-19.25 bg-transparent border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#1CA7A6]/10 font-bold text-[24px] leading-7 rounded-[10px] font-asap"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-19.25 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[24px] leading-7 rounded-[10px] font-asap disabled:opacity-70"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </form>
      </Form>
      <ConfirmDialog
        isOpen={showLicenseWarning}
        onOpenChange={setShowLicenseWarning}
        title="License Not Filled"
        description="License is not filled. Do you want to continue anyway?"
        confirmText="Continue Anyway"
        cancelText="Close"
        onConfirm={() => {
          if (pendingValues) {
            onSubmit(pendingValues);
          }
        }}
      />
    </div>
  );
}
