"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GoogleLogin } from "@react-oauth/google";
import { type CredentialResponse } from "@/hooks/use-google-login";
import { registerUser, googleLogin, getRoles } from "@/lib/actions";
import { Navbar1, Footer1 } from "@/components/layouts/global";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import Image from "next/image";
import { RoleSelectionPage } from "@/components/register/role-selection-page";

// ── Schema ────────────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    firstName: z.string().min(2, { message: "First name is required" }),
    lastName: z.string().min(2, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    role_id: z.string().min(1, { message: "Please select a role" }),
    password: z.string().superRefine((val, ctx) => {
      const errs: string[] = [];
      if (val.length < 6) errs.push("minimum 6 characters");
      if (!/[A-Z]/.test(val)) errs.push("1 uppercase letter");
      if (!/[a-z]/.test(val)) errs.push("1 lowercase letter");
      if (!/[0-9]/.test(val)) errs.push("1 number");
      if (!/[^A-Za-z0-9]/.test(val)) errs.push("1 special character");
      if (errs.length)
        ctx.addIssue({ code: "custom", message: `Password must contain ${errs.join(", ")}.` });
    }),
    confirmPassword: z.string().min(1, { message: "Confirm password is required" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Step1Values = z.infer<typeof step1Schema>;

// ── Role helpers ──────────────────────────────────────────────────────────────

const CONTRACTOR_ROLES = ["contractor", "manufacturer", "distributor", "manufacturer_distributor"];
const PROPERTY_ROLES = ["property_owner", "homeowner", "realtor"];

function isContractorRole(name: string) {
  return CONTRACTOR_ROLES.some((r) => name.toLowerCase().includes(r));
}
function isPropertyRole(name: string) {
  return PROPERTY_ROLES.some((r) => name.toLowerCase().includes(r));
}


export default function Register1Page() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [selectedRoleDisplayName, setSelectedRoleDisplayName] = useState("");
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName: "", lastName: "", email: "", role_id: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    setLoadingRoles(true);
    getRoles()
      .then((r) => {
        const filtered = (r.data || []).filter((role: any) => role.role_name.toLowerCase() !== 'admin');
        setRoles(filtered);
      })
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoadingRoles(false));
  }, []);

  function handleRoleSelect(id: string, name: string) {
    setSelectedRoleId(id);
    setSelectedRoleName(name);
    const display = name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    setSelectedRoleDisplayName(display);
    form.setValue("role_id", id);
    setStep(2);
  }

  async function handleStep2Submit(values: Step1Values) {
    const chosenRole = roles.find((r) => r.id === values.role_id);
    const roleName = chosenRole?.role_name ?? selectedRoleName;
    setLoading(true);
    const payload: Record<string, unknown> = {
      email: values.email,
      first_name: values.firstName,
      last_name: values.lastName,
      role_id: values.role_id,
      password: values.password,
    };
    const result = await registerUser(payload);
    if (!result.success) {
      toast.error(result.message || "Registration failed");
      setLoading(false);
      return;
    }
    toast.success("OTP sent to your email!");
    await new Promise((r) => setTimeout(r, 100));
    window.location.href = `/verify-otp?email=${encodeURIComponent(values.email)}&type=register&role=${encodeURIComponent(roleName)}`;
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setGoogleLoading(true);
    const idToken = credentialResponse.credential;
    if (!idToken) { toast.error("Google sign-in failed"); setGoogleLoading(false); return; }
    const result = await googleLogin(idToken);
    if (!result.success) { toast.error(result.message || "Google sign-in failed"); setGoogleLoading(false); return; }
    toast.success(result.data.isNewUser ? "Account created successfully" : "Login successful");
    await new Promise((r) => setTimeout(r, 100));
    window.location.href = result.data.requiresRoleSelection ? "/select-role" : "/dashboard";
  }

  function handleGoogleError() {
    setGoogleLoading(false);
    toast.error("Google sign-in was canceled or failed.");
  }

  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

  // ── STEP 1: Role selection — full page layout ──────────────────────────────
  if (step === 1) {
    return (
      <>
        <Navbar1 />
        <RoleSelectionPage roles={roles} loadingRoles={loadingRoles} onSelect={handleRoleSelect} />
        <Footer1 />
      </>
    );
  }

  // ── STEP 2: Basic info — teal card with pre-selected role badge ───────────
  return (
    <div className="w-full min-h-screen flex flex-col font-inter bg-[#EDEFF1]">
      <Navbar1 />
      <section className="relative flex-1 flex items-start py-[60px] overflow-hidden w-full min-h-[calc(100vh-100px)]">
        <div className="absolute inset-0 z-0">
          <Image src="/assets/login/new-login-bg.png" alt="" fill sizes="100vw" priority className="w-full h-full object-cover object-center" />
        </div>
        <div className="max-w-[1450px] mx-auto w-[90%] relative z-10 flex justify-center lg:justify-end">
          <div className="w-full max-w-[520px] bg-[#339FD0] border-[3px] border-white rounded-[16px] p-8 md:p-[40px_44px_36px_44px] text-white shadow-[0_20px_50px_rgba(15,42,68,0.18)]">

            <h1 className="font-asap text-[36px] md:text-[40px] font-extrabold text-white mb-1.5 tracking-[1.5px] uppercase leading-none">
              CREATE ACCOUNT
            </h1>
            <p className="font-inter text-sm text-white/95 mb-4">Fill in your basic details to get started.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleStep2Submit)} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem className="flex-1">
                      <label className="text-sm font-semibold text-white font-inter">First Name</label>
                      <FormControl><input  {...field} className="mt-1 h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400" /></FormControl>
                      <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem className="flex-1">
                      <label className="text-sm font-semibold text-white font-inter">Last Name</label>
                      <FormControl><input {...field} className="mt-1 h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400" /></FormControl>
                      <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold text-white font-inter">Email Address</label>
                    <FormControl><input type="email" {...field} className="mt-1 h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400" /></FormControl>
                    <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                  </FormItem>
                )} />

                {/* Role — pre-selected from step 1 but editable */}
                <FormField control={form.control} name="role_id" render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold text-white font-inter">Role</label>
                    <FormControl>
                      <select
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          const r = roles.find((r) => r.id === e.target.value);
                          if (r) {
                            setSelectedRoleId(r.id);
                            setSelectedRoleName(r.role_name);
                            setSelectedRoleDisplayName(
                              r.role_name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
                            );
                          }
                        }}
                        className="mt-1 h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none border-0 appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231F2A44' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                      >
                        <option value="" disabled className="text-gray-400">Select a role</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.role_name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold text-white font-inter">Password</label>
                    <FormControl>
                      <div className="relative mt-1">
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="h-[46px] w-full pl-4 pr-12 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2A44]">
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-white/70 mt-1 font-inter">Min. 6 chars, uppercase, lowercase, number, special character</p>
                    <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-semibold text-white font-inter">Confirm Password</label>
                    <FormControl>
                      <div className="relative mt-1">
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} className="h-[46px] w-full pl-4 pr-12 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2A44]">
                          {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
                  </FormItem>
                )} />

                <button type="submit" disabled={loading} className="w-full py-3.5 px-5 bg-[#1F2A44] text-white rounded-[6px] font-inter text-base font-semibold hover:bg-[#132036] hover:-translate-y-px active:translate-y-0 transition-all duration-200 mt-1 disabled:opacity-70">
                  {loading ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-center font-inter text-sm text-white mt-1">
                  Already have an account?{" "}
                  <Link href={loginUrl} className="text-white font-bold hover:underline">Sign In</Link>
                </p>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-white/60" />
                  <span className="font-medium text-[13px] uppercase tracking-wider text-white">Or Continue</span>
                  <div className="flex-1 h-px bg-white/60" />
                </div>

                <div className="flex justify-center gap-4">
                  <a href="#" aria-label="Continue with Apple" className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-full bg-black hover:-translate-y-0.5 transition-all shadow-md">
                    <Image src="/assets/apple-logo.png" alt="Apple" width={22} height={22} className="w-[22px] h-[22px] object-contain" />
                  </a>
                  <div className="relative w-[42px] h-[42px] rounded-full overflow-hidden shadow-md bg-white cursor-pointer flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <svg className="size-[22px]" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.4 14.7 2.3 12 2.3 6.6 2.3 2.2 6.7 2.2 12.2S6.6 22.1 12 22.1c6.4 0 10.6-4.5 10.6-10.9 0-.7-.1-1.3-.2-1.9H12z" />
                      </svg>
                    </div>
                    <div className={`absolute inset-0 z-20 opacity-[0.01] scale-[1.5] origin-center ${googleLoading ? "pointer-events-none" : ""}`}>
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} useOneTap={false} auto_select={false} />
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </section>
      <Footer1 />
    </div>
  );
}
