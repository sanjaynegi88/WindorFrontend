"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/components/providers/user-provider";
import { acknowledgeConversionToast } from "@/lib/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";

export function ConversionPopupModal() {
  const { user, setUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const hasAcknowledgedRef = useRef(false);

  const hasPaymentMethod = Boolean(
    user?.has_payment_method ?? user?.current_subscription?.has_payment_method,
  );

  const isToastUnseen =
    user !== null &&
    hasPaymentMethod &&
    (user?.is_conversion_toast_seen === false ||
      user?.current_subscription?.is_conversion_toast_seen === false);

  const isAutoConverted = Boolean(
    user?.is_auto_converted ??
    user?.current_subscription?.is_auto_converted ??
    user?.current_subscription?.is_auto_conversion ??
    user?.is_trial_converted,
  );

  const popupBadge =
    (user as any)?.toast_badge ||
    (isAutoConverted ? "Subscription Auto-Converted" : "Membership Active");

  const popupTitle =
    (user as any)?.toast_title ||
    (isAutoConverted
      ? "Trial Converted to Active Membership!"
      : "Welcome to Your Active Plan!");

  const popupDescription =
    (user as any)?.toast_message ||
    (user as any)?.conversion_message ||
    (isAutoConverted
      ? "Your free trial has ended and your subscription has been automatically converted to your active membership. You now have complete, uninterrupted access to all tools and verification reports."
      : "Your payment method has been verified and your membership is active. You can now continue with complete, uninterrupted access to all tools and verification reports.");

  const toastText =
    (user as any)?.toast_message ||
    (isAutoConverted
      ? "Your free trial has been automatically converted to an active subscription!"
      : "Your payment method is verified! Welcome to your active membership.");

  useEffect(() => {
    if (isToastUnseen && !hasAcknowledgedRef.current) {
      hasAcknowledgedRef.current = true;
      setIsOpen(true);

      // 1. Show toast notification
      toast.success(toastText, {
        duration: 6000,
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      });

      // 2. Call backend endpoint to acknowledge the toast
      acknowledgeConversionToast()
        .then((res) => {
          if (!res.success) {
            console.warn(
              "[ConversionPopupModal] Failed to acknowledge toast on backend:",
              res.message,
            );
          }
        })
        .catch((err) => {
          console.error(
            "[ConversionPopupModal] Error acknowledging toast:",
            err,
          );
        });

      // 3. Update local user state so it will not trigger again in this session
      if (user) {
        setUser({
          ...user,
          is_conversion_toast_seen: true,
          ...(user.current_subscription
            ? {
                current_subscription: {
                  ...user.current_subscription,
                  is_conversion_toast_seen: true,
                },
              }
            : {}),
        });
      }
    }
  }, [isToastUnseen, user, setUser, toastText]);

  if (!isOpen) return null;

  const planName =
    user?.current_subscription?.plan?.name ||
    user?.subscription_plan_name ||
    "Active Subscription";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 overflow-hidden">
        {/* Background gradient decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-bounce-subtle">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
            <span>{popupBadge}</span>
          </div>

          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            {popupTitle}
          </DialogTitle>

          <DialogDescription className="text-sm text-slate-600 leading-relaxed max-w-sm">
            {popupDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Plan card summary */}
        <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Current Plan
            </span>
            <p className="text-base font-bold text-slate-900">{planName}</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active</span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Got it, Continue</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
