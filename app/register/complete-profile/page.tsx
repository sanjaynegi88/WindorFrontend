"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/layouts/global/Navbar";
import { Footer } from "@/components/layouts/global/Footer";
import { BrandedLayout } from "@/app/(auth)/layout/branded-layout";

import { postAddtionalUserForm } from "@/lib/actions";
import { Step2PropertyForm, Step2PropertyValues } from "./step2-property-form";
import { Step2ContractorForm, Step2ContractorValues } from "./step2-contractor-form";
import { StepIndicator } from "./step-indicator";

const CONTRACTOR_ROLES = ["contractor", "manufacturer", "distributor", "manufacturer_distributor"];
const PROPERTY_ROLES = ["property_owner", "homeowner", "realtor"];

function isContractorRole(name: string) {
  return CONTRACTOR_ROLES.some((r) => name.toLowerCase().includes(r));
}
function isPropertyRole(name: string) {
  return PROPERTY_ROLES.some((r) => name.toLowerCase().includes(r));
}

function CompleteProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const role = searchParams.get("role") || "";
  const roleDisplayName = role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: Step2PropertyValues | Step2ContractorValues | Record<string, never>) {
    setLoading(true);
    const result = await postAddtionalUserForm(userId, values);
    console.log(result);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message || "Failed to save profile. Please try again later.");
      return;
    }
    toast.success("Profile completed successfully!");
    await new Promise((r) => setTimeout(r, 100));
    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full min-h-screen flex flex-col font-inter">
      <Navbar />
      <div className="flex-1 flex flex-col pt-[118px]">
        <BrandedLayout>
          {/* Logo */}
          <div className="flex justify-center mb-[76px]">
            <div className="w-[168px] h-[159px] bg-white shadow-[0px_4px_14px_rgba(31,42,68,0.3)] rounded-[20px] flex items-center justify-center shrink-0">
              <img src="/assets/logo.png" alt="Windor Logo" className="h-[118px] w-[136px] object-contain" />
            </div>
          </div>

          {/* Title */}
          <div className="w-full text-center mb-[44px]">
            <h1 className="text-[48px] leading-[55px] font-bold text-[#1F2A44] mb-[8px] font-asap uppercase">SIGN UP NOW</h1>
            <p className="text-[26px] leading-[30px] font-medium text-[#708090] font-asap">
              Completing registration as {roleDisplayName}
            </p>
          </div>

          {/* Stepper — step 2 of 2 */}
          <StepIndicator step={2} />

          {isContractorRole(role) && (
            <Step2ContractorForm
              onBack={() => window.history.back()}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
          {isPropertyRole(role) && (
            <Step2PropertyForm
              onBack={() => window.history.back()}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
          {!isContractorRole(role) && !isPropertyRole(role) && (
            <div className="flex flex-col gap-4">
              <p className="text-[18px] text-[#708090] font-asap text-center">
                No additional information required for this role.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit({} as Record<string, never>)}
                className="w-full h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white font-bold text-[24px] rounded-[10px] font-asap disabled:opacity-70"
              >
                {loading ? "Saving..." : "Complete Registration"}
              </button>
            </div>
          )}
        </BrandedLayout>
      </div>
      <Footer />
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileContent />
    </Suspense>
  );
}
