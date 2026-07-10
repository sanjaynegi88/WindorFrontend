"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CitySelect } from "@/components/city-zip-selector";
import { toast } from "sonner";
import { getServiceProvided } from "@/lib/actions";
import { cn, toPascalCase } from "@/lib/utils";

const schema = z.object({
  companyAddress: z.string().min(1, { message: "Company address is required" }),
  websiteUrl: z.string().min(1, { message: "Website URL is required" }),
  licenseNumber: z.string().min(1, { message: "License number is required" }),
  mobilePhone: z.string().min(1, { message: "Mobile phone is required" })
    .regex(/^\d{10}$/, { message: "Must be exactly 10 digits" }),
  companyPhone: z.string().min(1, { message: "Company phone is required" })
    .regex(/^\d{10}$/, { message: "Must be exactly 10 digits" }),
  city_id: z.string().min(1, { message: "City is required" }),
  companyEmail: z.string().optional(),
  company_name: z.string().optional(),
  serviceTypes: z.array(z.string()).min(1, { message: "Select at least one service" }),
});

export type Step2ContractorValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSubmit: (values: Step2ContractorValues) => void;
  loading: boolean;
}

const inputCls =
  "h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.5)]";

export function NewRegisterStep3Contractor({ onBack, onSubmit, loading }: Props) {
  const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const formatReportType = (value: string) =>
    value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  useEffect(() => {
    getServiceProvided()
      .then((r) => setServices(r.data || []))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoadingServices(false));
  }, []);

  const form = useForm<Step2ContractorValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyAddress: "", websiteUrl: "", licenseNumber: "",
      companyEmail: "", company_name: "", mobilePhone: "", companyPhone: "", city_id: "", serviceTypes: [],
    },
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

        <FormField control={form.control} name="companyAddress" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Company Address</label>
            <FormControl>
              <input placeholder="Address" {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <FormField control={form.control} name="companyEmail" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Company Email</label>
            <FormControl>
              <input placeholder="Email Address" {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />
        <FormField control={form.control} name="company_name" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Company Name</label>
            <FormControl>
              <input placeholder="Company Name" {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <FormField control={form.control} name="websiteUrl" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Website URL</label>
            <FormControl>
              <input placeholder="" {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <FormField control={form.control} name="licenseNumber" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">License Number</label>
            <FormControl>
              <input placeholder="No." {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <div className="flex gap-3">
          <FormField control={form.control} name="mobilePhone" render={({ field }) => (
            <FormItem className="flex-1">
              <label className="text-sm font-semibold text-white font-inter">Mobile Phone</label>
              <FormControl>
                <input
                  placeholder="10-digit number"
                  {...field}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={`mt-1 ${inputCls}`}
                />
              </FormControl>
              <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
            </FormItem>
          )} />
          <FormField control={form.control} name="companyPhone" render={({ field }) => (
            <FormItem className="flex-1">
              <label className="text-sm font-semibold text-white font-inter">Company Phone</label>
              <FormControl>
                <input
                  placeholder="10-digit number"
                  {...field}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={`mt-1 ${inputCls}`}
                />
              </FormControl>
              <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
            </FormItem>
          )} />
        </div>

        <div>
          <label className="text-sm font-semibold text-white font-inter">City</label>
          <div className="mt-1 [&_button]:bg-white [&_button]:text-[#1F2A44] [&_button]:rounded-[4px] [&_button]:border-0 [&_button]:h-[46px]">
            <CitySelect name="city_id" valueType="id" placeholder="Select a city" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white font-inter mb-2 block">Type of Service</label>
          <FormField control={form.control} name="serviceTypes" render={({ field }) => (
            <FormItem>
              {loadingServices ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded bg-white/20 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {services.map((service) => {
                    const selected = field.value?.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          const curr = field.value ?? [];
                          field.onChange(
                            selected
                              ? curr.filter((v) => v !== service.id)
                              : [...curr, service.id]
                          );
                        }}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className={cn(
                          "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                          selected ? "bg-white border-white" : "bg-transparent border-white/50"
                        )}>
                          {selected && (
                            <svg className="w-3 h-3 text-[#339FD0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm text-white font-inter">{toPascalCase(service.service_name)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
            </FormItem>
          )} />
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3.5 bg-transparent border-2 border-white text-white rounded-[6px] font-inter text-base font-semibold hover:bg-white/10 transition-all"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-[#1F2A44] text-white rounded-[6px] font-inter text-base font-semibold hover:bg-[#132036] transition-all disabled:opacity-70"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>
      </form>
    </Form>
  );
}
