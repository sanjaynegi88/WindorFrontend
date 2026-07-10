"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginUser, googleLogin } from "@/lib/actions";
import { type CredentialResponse } from "@/hooks/use-google-login";
import { GoogleLogin } from "@react-oauth/google";
import { Navbar1, Footer1 } from "@/components/layouts/global";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useUser } from "@/components/providers/user-provider";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function Login1Page() {
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setUser(null);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    const result = await loginUser({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (!result.success) {
      toast.error(result.message || "Login failed");
      setLoading(false);
      return;
    }

    toast.success("Login successful");

    await new Promise((resolve) => setTimeout(resolve, 100));
    window.location.href = "/dashboard";
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setGoogleLoading(true);
    const idToken = credentialResponse.credential;

    if (!idToken) {
      toast.error("Google sign-in failed: no credential returned");
      setGoogleLoading(false);
      return;
    }

    const result = await googleLogin(idToken);

    if (!result.success) {
      toast.error(result.message || "Google login failed");
      setGoogleLoading(false);
      return;
    }

    toast.success(
      result.data.requiresRoleSelection
        ? "Account created successfully"
        : result.data.isNewUser
          ? "Account created successfully"
          : "Login successful"
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    window.location.href = result.data.requiresRoleSelection ? "/select-role" : "/dashboard";
  }

  function handleGoogleError() {
    setGoogleLoading(false);
    toast.error("Google sign-in was canceled or failed.");
  }

  return (
    <div className="w-full min-h-screen flex flex-col font-inter bg-[#EDEFF1] relative">
      <Navbar1 />
      <section className="relative flex-1 flex items-center py-[60px] overflow-hidden bg-[#EDEFF1] w-full min-h-[calc(100vh-100px)]">
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/login/login-bg-1.png"
            alt="Login Background"
            className="w-full h-full object-cover object-center block"
          />
        </div>

        {/* Container */}
        <div className="max-w-[1450px] mx-auto w-[90%] relative z-10 flex justify-center lg:justify-end">
          {/* Solid Teal Card with White Inner Border */}
          <div className="w-full max-w-[520px] bg-[#339FD0] border-[3px] border-white rounded-[16px] p-8 md:p-[40px_44px_36px_44px] text-white shadow-[0_20px_50px_rgba(15,42,68,0.18)]">
            <h1 className="font-asap text-[36px] md:text-[40px] font-extrabold text-white mb-1.5 tracking-[1.5px] uppercase leading-none text-left">
              LOGIN
            </h1>
            <p className="font-inter text-sm text-white/95 mb-6 text-left">
              Please enter your login details to log in.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="login-email" className="font-inter text-sm font-semibold text-white">
                        Email Address
                      </label>
                      <FormControl>
                        <div className="relative">
                          <input
                            id="login-email"
                            type="email"
                            className="h-[46px] w-full px-4 bg-white border-0 rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none shadow-[0_2px_0_rgba(0,0,0,0.03)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.5)] placeholder:text-gray-400"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-semibold text-red-500 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 text-left relative">
                      <label htmlFor="login-password" className="font-inter text-sm font-semibold text-white">
                        Password
                      </label>
                      <FormControl>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            className="h-[46px] w-full pl-4 pr-12 bg-white border-0 rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none shadow-[0_2px_0_rgba(0,0,0,0.03)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.5)] placeholder:text-gray-400"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2A44] transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="size-5" />
                            ) : (
                              <Eye className="size-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-semibold text-red-500 mt-1" />
                      <Link
                        href="/forgot-password"
                        className="self-end font-inter text-[13px] text-white no-underline mt-1 font-medium hover:underline text-right block"
                      >
                        Forgot Password?
                      </Link>
                    </FormItem>
                  )}
                />

                {/* Keep me logged in */}
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2.5 font-inter text-sm text-white cursor-pointer select-none mt-1 mb-1">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="w-[18px] h-[18px] border-2 border-white rounded-[3px] appearance-none checked:bg-white relative cursor-pointer flex-shrink-0 checked:after:content-[''] checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-r-2 checked:after:border-b-2 checked:after:border-[#339FD0] checked:after:rotate-45"
                            {...field}
                          />
                          <span>Keep me logged in</span>
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3.5 px-5 bg-[#1F2A44] text-white border-0 rounded-[6px] font-inter text-base font-semibold cursor-pointer hover:bg-[#132036] hover:-translate-y-px active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 mt-1"
                >
                  {loading ? "Logging In..." : "Log In"}
                </button>

                {/* Create Account link */}
                <p className="text-center font-inter text-sm text-white mt-1">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-white font-bold hover:underline">
                    Create Account
                  </Link>
                </p>

                {/* Or Continue Divider */}
                <div className="flex items-center gap-3 text-white font-inter text-sm my-2">
                  <div className="flex-1 h-px bg-white/60"></div>
                  <span className="whitespace-nowrap font-medium text-[13px] uppercase tracking-wider">
                    Or Continue
                  </span>
                  <div className="flex-1 h-px bg-white/60"></div>
                </div>

                {/* Social Login Buttons */}
                <div className="flex justify-center gap-4 mt-1">
                  <a
                    href="#"
                    aria-label="Continue with Apple"
                    className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-full bg-black hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <img
                      src="/assets/apple-logo.png"
                      alt="Apple"
                      className="w-[22px] h-[22px] object-contain"
                    />
                  </a>

                  {/* Google OAuth Circle Button with Invisible React Google SDK trigger overlay */}
                  <div className="relative w-[42px] h-[42px] rounded-full overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-white cursor-pointer flex items-center justify-center">
                    {/* Visual Button Display */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <svg className="size-[22px]" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.4 14.7 2.3 12 2.3 6.6 2.3 2.2 6.7 2.2 12.2S6.6 22.1 12 22.1c6.4 0 10.6-4.5 10.6-10.9 0-.7-.1-1.3-.2-1.9H12z"
                        />
                      </svg>
                    </div>

                    {/* Google OAuth Click Target with scale factor to fill the square completely */}
                    <div className="absolute inset-0 z-20 opacity-[0.01] scale-[1.5] origin-center cursor-pointer">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        auto_select={false}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>

      {/* Render standard new Footer1 */}
      <Footer1 />
    </div>
  );
}
