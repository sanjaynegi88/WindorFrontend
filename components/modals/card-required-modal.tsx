"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/providers/user-provider";
import { createSetupIntent, savePaymentMethod, signout } from "@/lib/actions";
import { StripeWrapper } from "@/components/stripe/stripe-wrapper";
import {
  useStripe,
  useElements,
  CardElement,
  PaymentElement,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function CardForm({
  onSuccess,
  clientSecret,
}: {
  onSuccess: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      console.warn("[CardForm] Submit attempted before Stripe/Elements initialization.");
      toast.error("Stripe is not initialized yet. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    console.log("[CardForm] Processing card submission with clientSecret:", clientSecret);

    try {
      // 1. Confirm setup intent or create payment method
      const cardElement = elements.getElement(CardElement);
      let paymentMethodId: string | undefined;

      if (cardElement) {
        console.log("[CardForm] Calling stripe.confirmCardSetup...");
        const result = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name.trim() || undefined,
            },
          },
        });

        console.log("[CardForm] stripe.confirmCardSetup Result:", result);

        if (result.error) {
          console.error("[CardForm] stripe.confirmCardSetup Error:", result.error);
          setErrorMsg(result.error.message || "Failed to process card details");
          setIsSubmitting(false);
          return;
        }

        const setupIntent = result.setupIntent;
        paymentMethodId =
          typeof setupIntent?.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent?.payment_method?.id;
        console.log("[CardForm] Extracted paymentMethodId from SetupIntent:", paymentMethodId);
      } else {
        console.log("[CardForm] Calling stripe.confirmSetup...");
        const result = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
          confirmParams: {
            return_url: window.location.href,
          },
        });

        console.log("[CardForm] stripe.confirmSetup Result:", result);

        if (result.error) {
          console.error("[CardForm] stripe.confirmSetup Error:", result.error);
          setErrorMsg(result.error.message || "Failed to process card details");
          setIsSubmitting(false);
          return;
        }

        const setupIntent = result.setupIntent;
        paymentMethodId =
          typeof setupIntent?.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent?.payment_method?.id;
        console.log("[CardForm] Extracted paymentMethodId from SetupIntent:", paymentMethodId);
      }

      if (!paymentMethodId) {
        console.log("[CardForm] Fallback: Calling stripe.createPaymentMethod...");
        const pmResult = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement!,
          billing_details: {
            name: name.trim() || undefined,
          },
        });
        console.log("[CardForm] stripe.createPaymentMethod Result:", pmResult);

        if (pmResult.error) {
          console.error("[CardForm] stripe.createPaymentMethod Error:", pmResult.error);
          setErrorMsg(pmResult.error.message || "Invalid card details");
          setIsSubmitting(false);
          return;
        }
        paymentMethodId = pmResult.paymentMethod.id;
      }

      console.log("[CardForm] Calling savePaymentMethod API with paymentMethodId:", paymentMethodId);
      const saveRes = await savePaymentMethod(paymentMethodId);
      console.log("[CardForm] savePaymentMethod Response:", saveRes);

      if (!saveRes.success) {
        setErrorMsg(saveRes.message || "Failed to save payment method");
        setIsSubmitting(false);
        return;
      }

      toast.success("Payment method saved successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Card processing error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cardholder-name" className="text-xs font-semibold text-slate-700">
          Cardholder Name
        </Label>
        <input
          id="cardholder-name"
          type="text"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1CA7A6] focus:border-transparent transition-all shadow-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700">
          Card Details
        </Label>
        <div className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#1CA7A6] focus-within:border-transparent transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#0f172a",
                  fontFamily: "Inter, system-ui, sans-serif",
                  "::placeholder": {
                    color: "#94a3b8",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="w-full h-11 bg-secondary-new hover:bg-secondary-new/90 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving Payment Method...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Save Card & Continue</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-[#1CA7A6]" />
        <span>Encrypted with 256-bit SSL standard via Stripe</span>
      </div>
    </form>
  );
}

export function CardRequiredModal() {
  const { user, refreshProfile } = useUser();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isCardRequired = Boolean(user?.is_card_required);

  useEffect(() => {
    if (!isCardRequired) return;

    let isMounted = true;
    const fetchIntent = async () => {
      setIsLoadingIntent(true);
      setIntentError(null);
      try {
        const res = await createSetupIntent();
        if (!isMounted) return;

        if (res.success) {
          if (res.data?.clientSecret) {
            setClientSecret(res.data.clientSecret);
          } else {
            setIntentError("Failed to initialize payment setup. Missing client secret.");
          }
        } else {
          setIntentError(
            res.message || "Failed to initialize payment setup. Please refresh."
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setIntentError("Network error while initializing payment setup.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingIntent(false);
        }
      }
    };

    fetchIntent();

    return () => {
      isMounted = false;
    };
  }, [isCardRequired]);

  if (!isCardRequired) {
    return null;
  }

  const handleSuccess = async () => {
    await refreshProfile();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signout();
      router.push(process.env.NEXT_PUBLIC_LOGIN_URL || "/login");
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-card-required-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Accent Banner using solid full teal green #1CA7A6 */}
        <div className="bg-[#1CA7A6] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mb-3 border border-white/20 shadow-inner">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h2 id="modal-card-required-title" className="text-xl font-bold tracking-tight">
            Action Required: Add Payment Card
          </h2>
          <p className="text-xs text-teal-50/90 mt-1 max-w-xs mx-auto">
            Please provide your card details to unlock access to your account.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Informative Notice Box */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950 block mb-0.5">
                Trial Billing Notice
              </span>
              You must enter a payment card to continue. Billing will automatically be done after your trial expires. You will <strong>not be charged today</strong>.
            </div>
          </div>

          {/* Loading Intent State */}
          {isLoadingIntent && (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#1CA7A6] animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Initializing secure card setup...
              </p>
            </div>
          )}

          {/* Error Intent State */}
          {intentError && !isLoadingIntent && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <p className="text-xs text-red-700 font-medium">{intentError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsLoadingIntent(true);
                  createSetupIntent()
                    .then((res) => {
                      if (res.success) {
                        if (res.data?.clientSecret) {
                          setClientSecret(res.data.clientSecret);
                          setIntentError(null);
                        } else {
                          setIntentError("Failed to initialize payment setup. Missing client secret.");
                        }
                      } else {
                        setIntentError(
                          res.message || "Failed to initialize payment setup."
                        );
                      }
                    })
                    .finally(() => setIsLoadingIntent(false));
                }}
                className="text-xs border-red-200 hover:bg-red-100/50"
              >
                Retry Setup
              </Button>
            </div>
          )}

          {/* Card Form */}
          {clientSecret && !isLoadingIntent && (
            <StripeWrapper clientSecret={clientSecret}>
              <CardForm clientSecret={clientSecret} onSuccess={handleSuccess} />
            </StripeWrapper>
          )}

          {/* Logout Option */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Logged in as <strong>{user?.email}</strong></span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
