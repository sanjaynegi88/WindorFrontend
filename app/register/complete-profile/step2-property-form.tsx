'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { CitySelect } from '@/components/city-zip-selector';
import { getStates } from '@/lib/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const inputCls =
  'h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap';
const errCls =
  'text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2';
const triggerCls =
  'h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] font-medium text-[#708090] bg-white font-asap shadow-none';

const step2PropertySchema = z.object({
  propertyAddress: z.string().min(1, { message: 'Property address is required' }),
  mobilePhone: z.string().min(1, { message: 'Mobile phone is required' })
    .regex(/^\d{10}$/, { message: 'Mobile phone must be exactly 10 digits' }),
  ownerDateStart: z.string().min(1, { message: 'Start date is required' }),
  ownerDateEnd: z.string().optional(),
  state_id: z.string().min(1, { message: 'State is required' }),
  city_id: z.string().min(1, { message: 'City is required' }),
  zip: z.string().min(1, { message: 'Zip code is required' }),
});

export type Step2PropertyValues = z.infer<typeof step2PropertySchema>;

interface Step2PropertyFormProps {
  onBack: () => void;
  onSubmit: (values: Step2PropertyValues) => void;
  loading: boolean;
}

export function Step2PropertyForm({ onBack, onSubmit, loading }: Step2PropertyFormProps) {
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');

  useEffect(() => {
    getStates(1, 1000)
      .then((res) => {
        const raw: any[] = Array.isArray(res) ? res : res?.data || [];
        setStates(raw.map((s: any) => ({ id: String(s.id), name: s.state_name || s.name })));
      })
      .catch(() => { });
  }, []);

  const form = useForm<Step2PropertyValues>({
    resolver: zodResolver(step2PropertySchema),
    defaultValues: {
      propertyAddress: '',
      mobilePhone: '',
      ownerDateStart: '',
      ownerDateEnd: '',
      state_id: '',
      city_id: '',
      zip: '',
    },
    mode: 'onBlur',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-[24px] mb-[40px]">

          <FormField control={form.control} name="propertyAddress" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Property Address" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className={errCls} />
            </FormItem>
          )} />

          <FormField control={form.control} name="mobilePhone" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Phone # Direct"
                  {...field}
                  className={inputCls}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </FormControl>
              <FormMessage className={errCls} />
            </FormItem>
          )} />

          {/* State */}
          <FormField control={form.control} name="state_id" render={({ field }) => (
            <FormItem>
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  setSelectedStateId(val);
                  // Clear city when state changes
                  form.setValue('city_id', '');
                }}
              >
                <FormControl>
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[18px] font-asap">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className={errCls} />
            </FormItem>
          )} />

          <FormField control={form.control} name="city_id" render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className={`[&_button]:h-[65px] [&_button]:rounded-[6px] [&_button]:border-[rgba(112,128,144,0.23)] [&_button]:text-[20px] [&_button]:font-asap [&_button]:font-medium [&_button]:text-[#708090] [&_button]:shadow-none [&_button]:bg-white`}>
                  <CitySelect
                    value={field.value}
                    stateValue={selectedStateId}
                    valueType="id"
                    placeholder="City"
                    onSelectCity={(city) => {
                      field.onChange(city.id);
                      if (!selectedStateId && city.state_id) {
                        form.setValue('state_id', city.state_id);
                        setSelectedStateId(city.state_id);
                      }
                    }}
                    syncState={true}
                  />
                </div>
              </FormControl>
              <FormMessage className={errCls} />
            </FormItem>
          )} />

          {/* Zip Code — plain input */}
          <FormField control={form.control} name="zip" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Zip Code"
                  {...field}
                  className={inputCls}
                  inputMode="numeric"
                  maxLength={10}
                />
              </FormControl>
              <FormMessage className={errCls} />
            </FormItem>
          )} />

          {/* Owner Dates */}
          <div>
            <p className="text-[18px] font-medium text-[#1F2A44] font-asap mb-3">Owner Dates</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ownerDateStart" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" {...field} className={`${inputCls} text-[#708090]`} />
                  </FormControl>
                  <p className="text-[14px] text-[#708090] font-asap mt-1">Start Date</p>
                  <FormMessage className={errCls} />
                </FormItem>
              )} />
              <FormField control={form.control} name="ownerDateEnd" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" {...field} className={`${inputCls} text-[#708090]`} />
                  </FormControl>
                  <p className="text-[14px] text-[#708090] font-asap mt-1">End Date</p>
                  <FormMessage className={errCls} />
                </FormItem>
              )} />
            </div>
          </div>

        </div>

        <div className="flex gap-4">
          <Button type="button" onClick={onBack} disabled={loading}
            className="flex-1 h-[77px] bg-transparent border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#1CA7A6]/10 font-bold text-[24px] leading-[28px] rounded-[10px] font-asap">
            Back
          </Button>
          <Button type="submit" disabled={loading}
            className="flex-1 h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[24px] leading-[28px] rounded-[10px] font-asap disabled:opacity-70">
            {loading ? 'Creating...' : 'Register'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
