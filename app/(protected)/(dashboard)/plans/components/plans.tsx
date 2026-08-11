"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Star,
  Zap,
  Building2,
  Crown,
  Clock,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  getMembership,
  getUserProfile,
  subscribeToMembership,
  cancelMembership,
  updateAutoRenewal,
  getFreeTrialStatus,
  type FreeTrialStatusData,
} from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/user-provider";
import type { Role } from "@/config/rbac";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Map RBAC roles to membership targetRole values
const roleMapping: Record<Role, string> = {
  contractor: "CONTRACTOR",
  insurance_company: "INSURANCE_COMPANY",
  city_inspector: "INSPECTOR",
  property_owner: "PROPERTY_OWNER",
  admin: "ADMIN",
  realtor: "REALTOR",
  manufacturer: "MANUFACTURER",
  guest: "",
};

interface IPlanData {
  id: string;
  name: string;
  description: string;
  monthlyPriceId: string;
  annualyPriceId: string;
  monthlyAmount: string;
  yearlyAmount: string;
  targetRole?: string;
  level?: string;
  maxReports?: number;
  features: Record<string, string | boolean | number>;
  isActive: boolean;
  createdAt: string;
}

const planIcons: Record<string, any> = {
  Starter: Zap,
  Professional: Crown,
  Enterprise: Building2,
};

const Plans = () => {
  const router = useRouter();
  const { user, setUser, role } = useUser();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<IPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentPlanLevel, setCurrentPlanLevel] = useState<string | null>(null);
  const [currentBillingCycle, setCurrentBillingCycle] = useState<string | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<FreeTrialStatusData | null>(
    null,
  );
  const [isAutoRenewal, setIsAutoRenewal] = useState<boolean>(false);
  const [isUpdatingAutoRenewal, setIsUpdatingAutoRenewal] = useState<boolean>(false);

  const handleToggleAutoRenewal = async (checked: boolean) => {
    try {
      setIsUpdatingAutoRenewal(true);
      const result = await updateAutoRenewal(checked);
      if (!result.success) {
        toast.error(result.message || "Failed to update Auto-Pay setting");
        return;
      }
      setIsAutoRenewal(checked);
      toast.success(
        checked
          ? "Auto-Pay (Auto-renewal) enabled"
          : "Auto-Pay (Auto-renewal) disabled",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update Auto-Pay setting");
    } finally {
      setIsUpdatingAutoRenewal(false);
    }
  };

  const currentPlanObj = plans.find((p) => p.id === currentPlanId);
  const pendingPlanObj = plans.find((p) => p.id === pendingPlanId);
  const isCurrentPlanFree =
    !currentPlanId ||
    (currentPlanLevel && currentPlanLevel.toUpperCase() === "FREE") ||
    (currentPlanObj?.level && currentPlanObj.level.toUpperCase() === "FREE") ||
    (currentPlanObj &&
      Number(currentPlanObj.monthlyAmount ?? 0) === 0 &&
      Number(currentPlanObj.yearlyAmount ?? 0) === 0) ||
    (currentPlanObj?.name &&
      currentPlanObj.name.toLowerCase().includes("free"));

  const hasAnnualPlans = plans.some(
    (plan) => plan.yearlyAmount !== null && plan.yearlyAmount !== undefined,
  );

  const handleToggleBilling = () => setIsAnnual(!isAnnual);

  const handlePlanClick = (plan: IPlanData, isCurrentPlan: boolean) => {
    if (isCurrentPlan) {
      setCancelDialogOpen(true);
      return;
    }

    const hasActiveSubscription = Boolean(
      user?.has_membership || (currentPlanId && !isCurrentPlanFree),
    );

    if (hasActiveSubscription) {
      setPendingPlanId(plan.id);
      setChangePlanDialogOpen(true);
    } else {
      handleSubscribe(plan.id);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribingPlanId(planId);

      const selectedPlan = plans.find((p) => p.id === planId);
      if (selectedPlan?.level) {
        localStorage.setItem("pending_level", selectedPlan.level);
      }

      const result = await subscribeToMembership({
        plan_id: planId,
        billing_cycle: isAnnual ? "annually" : "monthly",
      });

      if (!result.success) {
        toast.error(result.message || "Failed to subscribe to plan");
        localStorage.removeItem("pending_level");
        return;
      }

      const response = result.data?.data || result.data;
      const checkoutUrl =
        response?.checkout_session?.url ||
        response?.url ||
        result.data?.checkout_session?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (response) {
        if (user) {
          setUser({ ...user, has_membership: true });
        }
        document.cookie =
          "has-membership=true; path=/; max-age=" + 30 * 24 * 60 * 60;

        const isFree =
          selectedPlan?.level?.toUpperCase() === "FREE" ||
          (Number(selectedPlan?.monthlyAmount ?? 0) === 0 &&
            Number(selectedPlan?.yearlyAmount ?? 0) === 0) ||
          selectedPlan?.name?.toLowerCase().includes("free");

        const successMsg =
          response?.message ||
          (result as any)?.message ||
          (isFree
            ? "Free membership activated successfully!"
            : "Subscription activated successfully!");

        toast.success(successMsg);
        localStorage.removeItem("pending_level");
        await fetchData();

        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 1500);
      } else {
        toast.error("Failed to process subscription");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe to plan");
      localStorage.removeItem("pending_level");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await cancelMembership();
    setIsCancelling(false);

    if (!result.success) {
      toast.error(result.message || "Failed to cancel membership");
      return;
    }

    setCurrentPlanId(null);
    setCurrentBillingCycle(null);
    setCurrentPlanLevel(null);
    if (user) {
      setUser({ ...user, has_membership: false });
    }
    fetchData();
    toast.success("Membership cancelled successfully");
  };

  const fetchData = async () => {
    try {
      const roleFilter =
        role && role !== "admin" ? roleMapping[role] : undefined;
      const [plansResponse, profileResponse, trialResponse] = await Promise.all(
        [
          getMembership(undefined, roleFilter),
          getUserProfile(),
          getFreeTrialStatus().catch(() => null),
        ],
      );

      if (plansResponse?.data) {
        setPlans(plansResponse.data);
      }

      if (profileResponse?.current_subscription?.plan?.id) {
        setCurrentPlanId(profileResponse.current_subscription.plan.id);
      }
      if (profileResponse?.current_subscription?.billing_cycle) {
        setCurrentBillingCycle(
          profileResponse.current_subscription.billing_cycle,
        );
      }
      const subLevel =
        profileResponse?.level ||
        profileResponse?.current_subscription?.plan?.level;
      if (subLevel) {
        setCurrentPlanLevel(subLevel);
      }

      const autoRenewFlag =
        profileResponse?.autoRenewalEnabled ??
        profileResponse?.auto_renewal_enabled ??
        profileResponse?.current_subscription?.autoRenewalEnabled ??
        profileResponse?.current_subscription?.auto_renewal_enabled ??
        profileResponse?.user?.autoRenewalEnabled ??
        false;
      setIsAutoRenewal(Boolean(autoRenewFlag));

      if (trialResponse?.success && trialResponse?.data?.data) {
        setTrialStatus(trialResponse.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      fetchData();
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Building2 className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-muted-foreground">
          No Plans Available
        </h2>
        <p className="text-muted-foreground">
          There are currently no membership plans available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-16 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Choose Your Plan
          </h1>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, <span className="text-primary italic">transparent</span>{" "}
            pricing
          </h2>
          {trialStatus && trialStatus.show_free_trial_dashboard && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border rounded-2xl p-4 max-w-2xl mx-auto backdrop-blur-sm shadow-sm flex flex-col items-center text-center gap-1.5 my-4",
                trialStatus.is_free_trial_active
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  : trialStatus.is_expired
                    ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200",
              )}
            >
              <div className="flex items-center gap-2 font-semibold text-base">
                <Clock className="w-5 h-5 shrink-0" />
                {trialStatus.is_free_trial_active ? (
                  <span>
                    Free Trial Active —{" "}
                    <strong>
                      {trialStatus.days_left}{" "}
                      {trialStatus.days_left === 1 ? "day" : "days"} remaining
                    </strong>
                  </span>
                ) : trialStatus.is_expired ? (
                  <span>Free Trial Expired</span>
                ) : (
                  <span>Free Trial Status</span>
                )}
              </div>
              {trialStatus.display_message && (
                <p className="text-sm opacity-90">
                  {trialStatus.display_message}
                </p>
              )}
            </motion.div>
          )}

          {currentPlanId && !isCurrentPlanFree ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-4 max-w-2xl mx-auto backdrop-blur-sm"
            >
              <p className="text-primary font-semibold flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-primary" />
                You currently have an active membership plan. Select another plan below to switch your membership.
              </p>
            </motion.div>
          ) : (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {role === "contractor" &&
                "Access the tools you need to manage jobs, track installations, and grow your contracting business."}
              {role === "insurance_company" &&
                "Get detailed property verification reports and streamlined data access for faster underwriting decisions."}
              {role === "city_inspector" &&
                "Stay on top of inspections, manage city-wide logs, and keep your verification workflow running smoothly."}
              {role === "property_owner" &&
                "Monitor your properties, review installation reports, and stay informed at every step."}
              {role === "admin" &&
                "Manage users, memberships, and platform settings across your entire organization."}
              {!role &&
                "Choose the plan that fits your workflow and get full access to the platform."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasAnnualPlans && (
            <div className="flex items-center gap-4 bg-muted/30 p-2 px-4 rounded-2xl border border-border/50 backdrop-blur-sm shadow-inner">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  !isAnnual ? "text-foreground" : "text-muted-foreground",
                )}
              >
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={handleToggleBilling}
                className="data-[state=checked]:bg-primary"
              />
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isAnnual ? "text-foreground" : "text-muted-foreground",
                )}
              >
                Annual
              </span>
            </div>
          )}

          {currentPlanId && !isCurrentPlanFree ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 bg-muted/30 p-2 px-4 rounded-2xl border border-border/50 backdrop-blur-sm shadow-inner cursor-pointer">
                    <RefreshCw className={cn("w-4 h-4 text-primary", isUpdatingAutoRenewal && "animate-spin")} />
                    <span className="text-sm font-medium text-foreground">
                      Auto-Pay
                    </span>
                    <Switch
                      checked={isAutoRenewal}
                      disabled={isUpdatingAutoRenewal}
                      onCheckedChange={handleToggleAutoRenewal}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-center text-xs font-semibold shadow-lg">
                  Auto-Pay can be enabled or turned off at any time.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-muted/30 p-2.5 px-4 rounded-2xl border border-border/50 backdrop-blur-sm shadow-inner cursor-help text-xs font-medium text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-primary shrink-0" />
                    <span>Auto-Pay: Enabled by default for new subscriptions</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-center text-xs font-semibold shadow-lg">
                  Auto-Pay is enabled by default upon subscription and can be disabled anytime in your profile or plan settings after activation.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {plans
          .filter((plan) => {
            const amount = isAnnual ? plan.yearlyAmount : plan.monthlyAmount;
            return amount !== null && amount !== undefined;
          })
          .map((plan, index) => {
            const Icon = planIcons[plan.name] || Star;
            const isCurrentPlan =
              plan.id === currentPlanId &&
              (isAnnual
                ? currentBillingCycle === "annually"
                : currentBillingCycle === "monthly");

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex h-full"
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-green-500 hover:bg-green-600 border-none px-4 py-1.5 shadow-xl shadow-green-500/20 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="group relative flex flex-col w-full h-full p-8 rounded-4xl border hover:bg-[#339FD0] bg-secondary-new hover:border-border border-[#339FD0] transition-all duration-500 overflow-hidden hover:shadow-xl">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:text-[#339FD0] bg-white text-secondary-new">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-white text-sm line-clamp-2 min-h-10">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl text-white tracking-tighter">
                        {Number(
                          isAnnual ? plan.yearlyAmount : plan.monthlyAmount,
                        ) === 0
                          ? "Free"
                          : `$${isAnnual ? plan.yearlyAmount : plan.monthlyAmount}`}
                      </span>
                      {Number(
                        isAnnual ? plan.yearlyAmount : plan.monthlyAmount,
                      ) !== 0 && (
                        <span className="text-white text-sm font-medium">
                          /{isAnnual ? "year" : "month"}
                        </span>
                      )}
                    </div>
                    {isAnnual && (
                      <p className="text-[10px] text-white/70 font-bold uppercase mt-1 tracking-widest">
                        Billed annually
                      </p>
                    )}
                  </div>

                  <div className="grow space-y-3 mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">
                      Features included
                    </p>

                    {plan.targetRole && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                        <Crown className="w-3.5 h-3.5 text-white/70 shrink-0" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {plan.targetRole.toLowerCase()}s
                          {plan.targetRole === "CONTRACTOR" && plan.level && (
                            <span className="ml-1 text-white/60 normal-case font-medium">
                              — {plan.level} level
                            </span>
                          )}
                          {plan.targetRole === "INSURANCE" &&
                            plan.maxReports && (
                              <span className="ml-1 text-white/60 normal-case font-medium">
                                — {plan.maxReports} reports/mo
                              </span>
                            )}
                        </span>
                      </div>
                    )}

                    {Object.entries(plan.features).map(([key, value]) => {
                      const isEnabled =
                        typeof value === "object" && value !== null
                          ? (value as any).enabled
                          : Boolean(value);
                      const displayValue =
                        typeof value === "object" && value !== null
                          ? (value as any).description
                          : typeof value !== "boolean"
                            ? value
                            : null;

                      return (
                        <div key={key} className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0",
                              isEnabled ? "bg-white/20" : "bg-white/5",
                            )}
                          >
                            <Check
                              className={cn(
                                "w-2.5 h-2.5 stroke-[3px]",
                                isEnabled ? "text-white" : "text-white/20",
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-sm",
                              isEnabled
                                ? "text-white font-medium"
                                : "text-white/30 line-through decoration-dotted",
                            )}
                          >
                            <span className="capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            {displayValue && (
                              <span className="ml-1 text-white/60 text-xs">
                                ({displayValue})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    size="lg"
                    variant={isCurrentPlan ? "destructive" : "outline"}
                    disabled={subscribingPlanId !== null || isCancelling}
                    className={cn(
                      "w-full h-12 rounded-xl text-md font-bold transition-all duration-300",
                      isCurrentPlan
                        ? "bg-white text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                        : " hover:bg-white text-white hover:text-[#339FD0]",
                    )}
                    onClick={() => handlePlanClick(plan, isCurrentPlan)}
                  >
                    {subscribingPlanId === plan.id ||
                    (isCancelling && isCurrentPlan) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Cancel Membership"
                    ) : (
                      "Get Started"
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-white/40 mt-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Secure stripe checkout
                  </p>
                </div>
              </motion.div>
            );
          })}
      </div>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Membership"
        description="Are you sure you want to cancel your current membership? You will lose access to active membership benefits."
        confirmText="Yes, Cancel Membership"
        cancelText="Keep Membership"
        variant="destructive"
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        isOpen={changePlanDialogOpen}
        onOpenChange={setChangePlanDialogOpen}
        title="Change Membership Plan"
        description={
          pendingPlanObj
            ? `Are you sure you want to switch your membership to the "${pendingPlanObj.name}" plan? Your current subscription will be updated.`
            : "Are you sure you want to change your membership plan? Your current subscription will be updated."
        }
        confirmText="Yes, Change Plan"
        cancelText="Cancel"
        variant="primary"
        onConfirm={() => {
          if (pendingPlanId) {
            handleSubscribe(pendingPlanId);
          }
        }}
      />
    </div>
  );
};

export { Plans, type IPlanData };
