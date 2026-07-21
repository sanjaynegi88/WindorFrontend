"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Star, Zap, Building2, Crown } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  getMembership,
  getUserProfile,
  subscribeToMembership,
  cancelMembership,
} from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/user-provider";
import type { Role } from "@/config/rbac";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentBillingCycle, setCurrentBillingCycle] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const hasAnnualPlans = plans.some(
    (plan) => plan.yearlyAmount !== null && plan.yearlyAmount !== undefined,
  );

  const handleToggleBilling = () => setIsAnnual(!isAnnual);

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

      const response = result.data.data;
      if (response?.checkout_session?.url) {
        window.location.href = response.checkout_session.url;
      } else if (response) {
        if (user) {
          setUser({ ...user, has_membership: true });
        }
        document.cookie = "has-membership=true; path=/; max-age=" + 30 * 24 * 60 * 60;
        toast.success("Free membership activated successfully!");
        localStorage.removeItem("pending_level");
        window.location.replace("/dashboard");
      } else {
        toast.error("Failed to create checkout session");
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
    if (user) {
      setUser({ ...user, has_membership: false });
    }
    toast.success("Membership cancelled successfully");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleFilter = role && role !== "admin" ? roleMapping[role] : undefined;
        const [plansResponse, profileResponse] = await Promise.all([
          getMembership(undefined, roleFilter),
          getUserProfile(),
        ]);

        if (plansResponse?.data) {
          setPlans(plansResponse.data);
        }

        if (profileResponse?.current_subscription?.plan?.id) {
          setCurrentPlanId(profileResponse.current_subscription.plan.id);
        }
        if (profileResponse?.current_subscription?.billing_cycle) {
          setCurrentBillingCycle(profileResponse.current_subscription.billing_cycle);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

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
        <h2 className="text-2xl font-bold text-muted-foreground">No Plans Available</h2>
        <p className="text-muted-foreground">There are currently no membership plans available.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-16 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Choose Your Plan</h1>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, <span className="text-primary italic">transparent</span>{" "}pricing
          </h2>
          {currentPlanId ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-4 max-w-2xl mx-auto backdrop-blur-sm"
            >
              <p className="text-primary font-semibold flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-primary" />
                Cancel your current membership first to switch plans.
              </p>
            </motion.div>
          ) : (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {role === "contractor" && "Access the tools you need to manage jobs, track installations, and grow your contracting business."}
              {role === "insurance_company" && "Get detailed property verification reports and streamlined data access for faster underwriting decisions."}
              {role === "city_inspector" && "Stay on top of inspections, manage city-wide logs, and keep your verification workflow running smoothly."}
              {role === "property_owner" && "Monitor your properties, review installation reports, and stay informed at every step."}
              {role === "admin" && "Manage users, memberships, and platform settings across your entire organization."}
              {!role && "Choose the plan that fits your workflow and get full access to the platform."}
            </p>
          )}
        </div>

        {hasAnnualPlans && (
          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50 backdrop-blur-sm shadow-inner">
            <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-foreground" : "text-muted-foreground")}>
              Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={handleToggleBilling} className="data-[state=checked]:bg-primary" />
            <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-foreground" : "text-muted-foreground")}>
              Annual
            </span>
          </div>
        )}
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
              (isAnnual ? currentBillingCycle === "annually" : currentBillingCycle === "monthly");

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
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{plan.name}</h3>
                    <p className="text-white text-sm line-clamp-2 min-h-10">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl text-white tracking-tighter">
                        {Number(isAnnual ? plan.yearlyAmount : plan.monthlyAmount) === 0
                          ? "Free"
                          : `$${isAnnual ? plan.yearlyAmount : plan.monthlyAmount}`}
                      </span>
                      {Number(isAnnual ? plan.yearlyAmount : plan.monthlyAmount) !== 0 && (
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
                            <span className="ml-1 text-white/60 normal-case font-medium">— {plan.level} level</span>
                          )}
                          {plan.targetRole === "INSURANCE" && plan.maxReports && (
                            <span className="ml-1 text-white/60 normal-case font-medium">— {plan.maxReports} reports/mo</span>
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
                          <div className={cn(
                            "mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0",
                            isEnabled ? "bg-white/20" : "bg-white/5"
                          )}>
                            <Check className={cn("w-2.5 h-2.5 stroke-[3px]", isEnabled ? "text-white" : "text-white/20")} />
                          </div>
                          <span className={cn(
                            "text-sm",
                            isEnabled ? "text-white font-medium" : "text-white/30 line-through decoration-dotted"
                          )}>
                            <span className="capitalize">{key.replace(/_/g, " ")}</span>
                            {displayValue && (
                              <span className="ml-1 text-white/60 text-xs">({displayValue})</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    size="lg"
                    variant={isCurrentPlan ? "destructive" : "outline"}
                    disabled={
                      subscribingPlanId !== null ||
                      isCancelling ||
                      (!!currentPlanId && !isCurrentPlan)
                    }
                    className={cn(
                      "w-full h-12 rounded-xl text-md font-bold transition-all duration-300",
                      isCurrentPlan
                        ? "bg-white text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                        : " hover:bg-white text-white hover:text-[#339FD0]",
                    )}
                    onClick={() =>
                      isCurrentPlan ? setCancelDialogOpen(true) : handleSubscribe(plan.id)
                    }
                  >
                    {subscribingPlanId === plan.id || (isCancelling && isCurrentPlan) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Cancel Membership"
                    ) : !!currentPlanId ? (
                      "Cancel Current Plan First"
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
    </div>
  );
};

export { Plans, type IPlanData };
