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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/actions";

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password confirmation must be at least 8 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps {
  token?: string;
  successRedirect?: string;
}

export function ResetPasswordForm({
  token,
  successRedirect = process.env.NEXT_PUBLIC_LOGIN_URL || "/login",
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const result = await resetPassword({
      reset_token: token,
      newPassword: values.password,
    });
    if (!result.success) {
      toast.error(result.message || "Failed to reset password. Please try again.");
      setLoading(false);
      return;
    }
    toast.success("Password reset successful");
    router.push(successRedirect);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Logo */}
      <div className="w-[100px] h-[95px] md:w-[168px] md:h-[159px] bg-white shadow-[0px_4px_14px_rgba(31,42,68,0.3)] rounded-[15px] md:rounded-[20px] flex items-center justify-center mt-10 mb-[40px] md:mb-[76px] shrink-0">
        <img
          src="/assets/logo.png"
          alt="Windor Logo"
          className="h-[60px] md:h-[118px] w-[70px] md:w-[136px] object-contain"
        />
      </div>

      <div className="w-full text-center mb-[30px] md:mb-[44px]">
        <h1 className="text-[28px] leading-[32px] md:text-[48px] md:leading-[55px] font-bold text-[#1F2A44] mb-[4px] md:mb-[8px] font-asap uppercase tracking-normal">
          RESET PASSWORD
        </h1>
        <p className="text-[16px] leading-[18px] md:text-[26px] md:leading-[30px] font-medium text-[#708090] font-asap">
          Enter your new password below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="space-y-[24px] mb-[35px] md:mb-[76px]">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-12 md:pr-14 border-[rgba(112,128,144,0.23)] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#708090] bg-white placeholder:text-[#708090] font-asap"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-[15px] md:right-[19px] top-1/2 -translate-y-1/2 text-[#708090] hover:text-[#1F2A44] transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
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
                        placeholder="Confirm Password"
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
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[20px] md:text-[30px] leading-[34px] rounded-[10px] shadow-none transition-all active:scale-95 font-asap"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center mt-[20px] md:mt-[29px]">
            <span className="text-[16px] md:text-[22px] leading-[35px] font-normal text-[rgba(112,128,144,0.93)] font-asap">
              Remember your password?{" "}
              <Link href={process.env.NEXT_PUBLIC_LOGIN_URL || "/login"} className="font-bold text-[#1CA7A6] hover:underline">
                Sign In
              </Link>
            </span>
          </div>
        </form>
      </Form>
    </div>
  );
}
