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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { verifyOtp, verifyRegisterOtp, forgotPassword, resendRegisterOtp } from "@/lib/actions";


const formSchema = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export function VerifyOtpForm() {
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "forgot-password";
  const role = searchParams.get("role") || "";

  const isRegister = type === "register";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (isRegister) {
      const result = await verifyRegisterOtp({ email, otp: values.otp });
      if (!result.success) {
        toast.error(result.message || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }
      const userId = result.data?.userId || "";
      toast.success("Email verified! Please complete your profile.");
      await new Promise((r) => setTimeout(r, 100));
      window.location.href = `/register/complete-profile?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;
    } else {
      const result = await verifyOtp({ email, otp: values.otp });
      if (!result.success) {
        toast.error(result.message || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("OTP verified successfully!");
      router.push(`/reset-password?token=${result.data.reset_token}`);
    }
  }

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    const result = isRegister
      ? await resendRegisterOtp({ email })
      : await forgotPassword({ email });
    console.log("handleResend ~ result:", result)
    if (!result.success) {
      toast.error(result.message || "Failed to resend OTP. Please try again.");
    } else {
      setTimer(90);
      setCanResend(false);
      toast.success("A new OTP has been sent to your email.");
    }
    setResendLoading(false);
  };

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
          VERIFY OTP
        </h1>
        <p className="text-[14px] leading-[18px] md:text-[22px] md:leading-[28px] font-medium text-[#708090] font-asap">
          Enter the 6-digit code sent to{" "}
          <span className="text-[#1F2A44] font-semibold">{email || "your email"}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex justify-center mb-[35px] md:mb-[60px]">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      containerClassName="group flex items-center justify-center"
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData("text");
                        const cleanedData = pastedData.replace(/\D/g, "").slice(0, 6);
                        if (cleanedData) {
                          field.onChange(cleanedData);
                        }
                      }}
                    >
                      <InputOTPGroup className="gap-[10px] md:gap-[16px]">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="w-[48px] h-[56px] md:w-[68px] md:h-[80px] text-[22px] md:text-[32px] font-bold text-[#1F2A44] rounded-[8px] border-2 border-[rgba(112,128,144,0.3)] focus-within:border-[#1CA7A6] font-asap"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage className="text-[13px] md:text-[18px] leading-[21px] font-normal text-[#DF433C] font-asap mt-3" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[20px] md:text-[30px] leading-[34px] rounded-[10px] shadow-none transition-all active:scale-95 font-asap"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>

          {/* Resend */}
          <div className="flex flex-col items-center mt-[20px] md:mt-[29px] gap-[8px]">
            <div className="flex items-center gap-2">
              <span className="text-[14px] md:text-[18px] leading-[35px] font-normal text-[rgba(112,128,144,0.93)] font-asap">
                Didn&apos;t receive the code?
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resendLoading}
                className={cn(
                  "text-[14px] md:text-[18px] font-bold font-asap transition-colors",
                  canResend && !resendLoading
                    ? "text-[#1CA7A6] hover:underline cursor-pointer"
                    : "text-[#708090] cursor-not-allowed"
                )}
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            {!canResend && (
              <span className="text-[13px] md:text-[16px] font-medium text-[#708090] font-asap">
                Resend available in{" "}
                <span className="text-[#1CA7A6] font-bold">{formatTime(timer)}</span>
              </span>
            )}
          </div>

          <div className="text-center mt-[16px] md:mt-[24px]">
            <span className="text-[16px] md:text-[22px] leading-[35px] font-normal text-[rgba(112,128,144,0.93)] font-asap">
              {isRegister ? (
                <>
                  Go back to{" "}
                  <Link href="/register" className="font-bold text-[#1CA7A6] hover:underline">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  Go back to{" "}
                  <Link href="/forgot-password" className="font-bold text-[#1CA7A6] hover:underline">
                    Forgot Password
                  </Link>
                </>
              )}
            </span>
          </div>
        </form>
      </Form>
    </div>
  );
}
