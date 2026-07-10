"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { changePassword, logout, signout } from "@/lib/actions";

const formSchema = z
  .object({
    oldPassword: z.string().min(1, {
      message: "Current password is required.",
    }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(1, {
      message: "Confirm password is required.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ChangePasswordForm() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const handleSignout = async () => {
    await signout();
    window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";;
  };

  async function onSubmit() {
    setLoading(true);
    const result = await changePassword({
      currentPassword: form.getValues().oldPassword,
      newPassword: form.getValues().newPassword,
    });
    if (!result.success) {
      toast.error(result.message || 'Failed to change password. Please try again.');
      setLoading(false);
      return;
    }
    toast.success('Password changed successfully, please login again');
    form.reset();
    handleSignout();
  }

  return (
    <div className="px-2 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[20px]">
          <div className="text-center mb-[8px]">
            <h1 className="text-[28px] leading-[32px] font-bold text-[#1F2A44] font-asap uppercase tracking-normal">
              CHANGE PASSWORD
            </h1>
            <p className="text-[16px] leading-[20px] font-medium text-[#708090] font-asap mt-[6px]">
              Update your account password
            </p>
          </div>

          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Current Password"
                      className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-12 md:pr-14 border-[rgba(112,128,144,0.23)] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#708090] bg-white placeholder:text-[#708090] font-asap"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-[15px] md:right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                      aria-label={showOldPassword ? "Hide password" : "Show password"}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      ) : (
                        <Eye className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[13px] md:text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-12 md:pr-14 border-[rgba(112,128,144,0.23)] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#708090] bg-white placeholder:text-[#708090] font-asap"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-[15px] md:right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      ) : (
                        <Eye className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[13px] md:text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2" />
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
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-12 md:pr-14 border-[rgba(112,128,144,0.23)] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#708090] bg-white placeholder:text-[#708090] font-asap"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-[15px] md:right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      ) : (
                        <Eye className="h-[16px] w-[16px] md:h-[28px] md:w-[28px]" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[13px] md:text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-2" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] md:h-[65px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[20px] md:text-[26px] leading-[34px] rounded-[10px] shadow-none transition-all active:scale-95 font-asap"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}