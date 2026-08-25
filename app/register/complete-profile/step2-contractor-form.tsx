"use client";

import { useState } from "react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ServiceSelect } from "@/components/service-select";

import { RoleForm } from "@/components/user-form/RoleForm";
import { contractorRoleSchema as step2ContractorSchema } from "@/lib/user-role-schema";

const inputCls =
  "h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap";
const errCls =
  "text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2";

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
            <RoleForm
              role="CONTRACTOR"
              context="register"
              form={form}
              errCls={errCls}
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
