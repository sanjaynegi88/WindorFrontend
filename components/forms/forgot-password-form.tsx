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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/lib/actions";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

interface ForgotPasswordFormProps {
  loginLink?: string;
}

export function ForgotPasswordForm({
  loginLink = process.env.NEXT_PUBLIC_LOGIN_URL || "/login",
}: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  async function onSubmit() {
    setLoading(true);
    const email = form.getValues().email;
    const result = await forgotPassword({ email });
    if (!result.success) {
      toast.error(result.message || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    toast.success("OTP sent successfully!");
    router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
          FORGOT PASSWORD
        </h1>
        <p className="text-[16px] leading-[18px] md:text-[26px] md:leading-[30px] font-medium text-[#708090] font-asap">
          Enter your email to receive a reset OTP
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="mb-[35px] md:mb-[76px]">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      {...field}
                      className="h-[46px] md:h-[65px] px-[15px] md:px-[19px] border-[#1CA7A6] rounded-[6px] text-[14px] md:text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap"
                    />
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
            {loading ? "Sending..." : "Send OTP"}
          </Button>

          <div className="text-center mt-[20px] md:mt-[29px]">
            <span className="text-[16px] md:text-[22px] leading-[35px] font-normal text-[rgba(112,128,144,0.93)] font-asap">
              Remember your password?{" "}
              <Link href={loginLink} className="font-bold text-[#1CA7A6] hover:underline">
                Sign In
              </Link>
            </span>
          </div>
        </form>
      </Form>
    </div>
  );
}
