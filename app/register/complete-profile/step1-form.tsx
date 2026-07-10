'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getRoles } from '@/lib/actions';

const inputCls =
  'h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap';
const errCls =
  'text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2';

const step1Schema = z
  .object({
    firstName: z.string().min(2, { message: 'First Name is required' }),
    lastName: z.string().min(2, { message: 'Last Name is required' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    role_id: z.string().min(1, 'Please select a role'),
    password: z.string().superRefine((value, ctx) => {
      const errors: string[] = [];

      if (value.length < 6) {
        errors.push("minimum 6 characters");
      }

      if (!/[A-Z]/.test(value)) {
        errors.push("1 uppercase letter");
      }

      if (!/[a-z]/.test(value)) {
        errors.push("1 lowercase letter");
      }

      if (!/[0-9]/.test(value)) {
        errors.push("1 number");
      }

      if (!/[^A-Za-z0-9]/.test(value)) {
        errors.push("1 special character");
      }

      if (errors.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Password must contain ${errors.join(", ")}.`,
        });
      }
    }),
    confirmPassword: z.string().min(1, { message: 'Confirm Password is required' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type Step1Values = z.infer<typeof step1Schema>;

interface Step1FormProps {
  onSubmit: (values: Step1Values, roleName: string) => void;
  defaultValues?: Partial<Step1Values>;
}

export function Step1Form({ onSubmit, defaultValues }: Step1FormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        setRoles(response.data || []);
      } catch {
        toast.error('Failed to load roles');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      role_id: defaultValues?.role_id ?? '',
      password: defaultValues?.password ?? '',
      confirmPassword: defaultValues?.confirmPassword ?? '',
    },
    mode: 'onBlur',
  });

  function handleSubmit(values: Step1Values) {
    const roleName = roles.find((r) => r.id === values.role_id)?.role_name ?? '';
    onSubmit(values, roleName);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <div className="space-y-[24px] mb-[40px]">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="First Name" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Last Name" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Email" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role_id"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingRoles}
                >
                  <FormControl>
                    <SelectTrigger className={inputCls}>
                      <SelectValue
                        placeholder={loadingRoles ? 'Loading roles...' : 'Select a role'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles
                      .filter((role) => role.role_name.toLowerCase() !== 'admin')
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id} className="cursor-pointer">
                          {role.role_name
                            .split('_')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(' ')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className={`${inputCls} pr-14 text-[#708090] placeholder:text-[#708090]`}
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[28px] w-[28px]" />
                      ) : (
                        <Eye className="h-[28px] w-[28px]" />
                      )}
                    </button>
                  </div>

                </FormControl>
                <span className='text-[12px] text-gray-500'>
                  Password must contain: Minimum 6 characters, 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character
                </span>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      className={`${inputCls} pr-14 text-[#708090] placeholder:text-[#708090]`}
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-[28px] w-[28px]" />
                      ) : (
                        <Eye className="h-[28px] w-[28px]" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className={errCls} />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[24px] leading-[28px] rounded-[10px] font-asap"
        >
          Next
        </Button>
      </form>
    </Form>
  );
}
