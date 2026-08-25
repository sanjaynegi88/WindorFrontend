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
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { setSubUserPassword } from "@/lib/actions";

const formSchema = z
  .object({
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Confirm password must be at least 6 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function SetSubUserPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

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
    const result = await setSubUserPassword({
      email,
      token,
      password: values.password,
    });

    if (!result.success) {
      toast.error(result.message || "Failed to set password. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Password set successfully! Please verify OTP.");
    router.push(`/verify-otp?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&type=sub-user`);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Logo */}
      <div className="w-[100px] h-[95px] md:w-[168px] md:h-[159px] bg-white shadow-[0px_4px_14px_rgba(31,42,68,0.3)] rounded-[15px] md:rounded-[20px] flex items-center justify-center mt-10 mb-[40px] md:mb-[76px] shrink-0">
        <Image
          src="/assets/logo.png"
          alt="Windor Logo"
          width={136}
          height={118}
          priority
          className="h-[60px] md:h-[118px] w-[70px] md:w-[136px] object-contain"
        />
      </div>

      <div className="w-full text-center mb-[30px] md:mb-[44px]">
        <h1 className="text-[28px] leading-[32px] md:text-[48px] md:leading-[55px] font-bold text-[#1F2A44] mb-[4px] md:mb-[8px] font-asap uppercase tracking-normal">
          SET YOUR PASSWORD
        </h1>
        <p className="text-[16px] leading-[18px] md:text-[26px] md:leading-[30px] font-medium text-[#708090] font-asap">
          Enter your new password to complete account setup
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-[20px] md:gap-[30px] mb-[35px] md:mb-[60px]">
            {/* Password */}
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
                        {...field}
                        className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-[45px] md:pr-[60px] border-[#1CA7A6] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#1CA7A6] hover:text-[#168a89]"
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

            {/* Confirm Password */}
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
                        {...field}
                        className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] pr-[45px] md:pr-[60px] border-[#1CA7A6] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#1CA7A6] hover:text-[#168a89]"
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
            className="w-full h-[50px] md:h-[65px] bg-[#1CA7A6] hover:bg-[#168a89] text-white font-bold text-[18px] md:text-[24px] leading-[30px] rounded-[6px] transition-colors uppercase font-asap tracking-normal cursor-pointer"
          >
            {loading ? "Submitting..." : "Set Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
