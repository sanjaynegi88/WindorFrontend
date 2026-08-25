'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { CitySelect, StateSelect } from '@/components/city-zip-selector';
import { Checkbox } from '@/components/ui/checkbox';
import { getStates } from '@/lib/actions';

import { RoleForm } from '@/components/user-form/RoleForm';
import { propertyRoleSchema as step2PropertySchema } from '@/lib/user-role-schema';

const inputCls =
  'h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap';
const errCls =
  'text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2';

export type Step2PropertyValues = z.infer<typeof step2PropertySchema>;

interface Step2PropertyFormProps {
  onBack: () => void;
  onSubmit: (values: Step2PropertyValues) => void;
  loading: boolean;
}

export function Step2PropertyForm({ onBack, onSubmit, loading }: Step2PropertyFormProps) {
  const [selectedStateId, setSelectedStateId] = useState('');
  const [isPresent, setIsPresent] = useState(false);

  const form = useForm<Step2PropertyValues>({
    resolver: zodResolver(step2PropertySchema),
    defaultValues: {
      propertyAddress: '',
      mobilePhone: '',
      ownerDateStart: '',
      ownerDateEnd: '',
      present: false,
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
          <RoleForm
            role="PROPERTY_OWNER"
            context="register"
            form={form}
            isPresent={isPresent}
            onPresentChange={setIsPresent}
            selectedStateId={selectedStateId}
            onStateSelect={setSelectedStateId}
            errCls={errCls}
          />
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
