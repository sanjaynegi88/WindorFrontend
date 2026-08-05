"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useMemo } from "react";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = loadStripe(publishableKey || "pk_test_placeholder");

interface StripeWrapperProps {
  clientSecret?: string;
  children: ReactNode;
}

export function StripeWrapper({ clientSecret, children }: StripeWrapperProps) {
  const options = useMemo(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#1CA7A6",
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          colorDanger: "#ef4444",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          borderRadius: "8px",
        },
      },
    };
  }, [clientSecret]);

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

