'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CitySelect } from '@/components/city-zip-selector';
import { toast } from 'sonner';
import { getServiceProvided } from '@/lib/actions';
import { cn, toPascalCase } from '@/lib/utils';

const inputCls =
  'h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap';
const errCls =
  'text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2';

const step2ContractorSchema = z.object({
  companyAddress: z.string().min(1, { message: 'Company address is required' }),
  company_name: z.string().optional(),
  companyEmail: z.string().optional(),
  websiteUrl: z.string().optional(),
  licenseNumber: z.string().min(1, { message: 'License number is required' }),
  mobilePhone: z
    .string()
    .min(1, { message: 'Mobile phone is required' })
    .regex(/^\d{10}$/, { message: 'Mobile phone must be exactly 10 digits' }),
  companyPhone: z
    .string()
    .min(1, { message: 'Company phone is required' })
    .regex(/^\d{10}$/, { message: 'Company phone must be exactly 10 digits' }),
  city_id: z.string().min(1, { message: 'City is required' }),
  serviceTypes: z.array(z.string()).min(1, { message: 'Select at least one service' }),
});

export type Step2ContractorValues = z.infer<typeof step2ContractorSchema>;

interface Step2ContractorFormProps {
  onBack: () => void;
  onSubmit: (values: Step2ContractorValues) => void;
  loading: boolean;
}

export function Step2ContractorForm({ onBack, onSubmit, loading }: Step2ContractorFormProps) {

  const formatReportType = (value: string) =>
    value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  const [loadingService, setLoadingService] = useState(true);
  const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await getServiceProvided();
        setServices(response.data || []);
      } catch {
        toast.error('Failed to load services');
      } finally {
        setLoadingService(false);
      }
    };
    fetchServices();
  }, []);

  const form = useForm<Step2ContractorValues>({
    resolver: zodResolver(step2ContractorSchema),
    defaultValues: {
      companyAddress: '',
      company_name: '',
      websiteUrl: '',
      licenseNumber: '',
      companyEmail: '',
      mobilePhone: '',
      companyPhone: '',
      city_id: '',
      serviceTypes: [],
    },
    mode: 'onBlur',
  });

  function handleFormSubmit(values: Step2ContractorValues) {
    onSubmit(values);
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="w-full">
          <div className="space-y-[24px] mb-[40px]">

            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Company Address" {...field} className={inputCls} />
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
                    <Input placeholder="Company Name" {...field} className={inputCls} />
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
                    <Input placeholder="Website URL" {...field} className={inputCls} />
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
                    <Input placeholder="License No." {...field} className={inputCls} />
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
                      placeholder="Phone # M (Mobile)"
                      {...field}
                      className={inputCls}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
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
                      placeholder="Phone # C (Company)"
                      {...field}
                      className={inputCls}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                  </FormControl>
                  <FormMessage className={errCls} />
                </FormItem>
              )}
            />

            <CitySelect
              name="city_id"
              valueType="id"
              placeholder="Select a city"
              className='border-[rgba(112,128,144,0.23)]'
              syncState={false}
            />

            <div>
              <p className="text-[18px] font-medium text-[#1F2A44] font-asap mb-3">
                Type of Service
              </p>
              <FormField
                control={form.control}
                name="serviceTypes"
                render={({ field }) => (
                  <FormItem>
                    {loadingService ? (
                      <div className="grid grid-cols-1 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-[32px] rounded bg-[rgba(112,128,144,0.1)] animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {services.map((service) => {
                          const selected = field.value?.includes(service.id) ?? false;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                const current = field.value ?? [];
                                field.onChange(
                                  selected
                                    ? current.filter((v) => v !== service.id)
                                    : [...current, service.id],
                                );
                              }}
                              className="flex items-center gap-3 text-left"
                            >
                              <span className={cn(
                                'w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                                selected
                                  ? 'bg-[#1CA7A6] border-[#1CA7A6]'
                                  : 'bg-white border-[rgba(112,128,144,0.4)]',
                              )}>
                                {selected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-[18px] font-medium text-[#1F2A44] font-asap leading-snug">
                                {toPascalCase(service.service_name)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage className={errCls} />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 h-[77px] bg-transparent border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#1CA7A6]/10 font-bold text-[24px] leading-[28px] rounded-[10px] font-asap"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[24px] leading-[28px] rounded-[10px] font-asap disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
