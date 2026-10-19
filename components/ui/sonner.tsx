"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="group toaster"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#1e293b] group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:pr-10 group-[.toaster]:font-bold",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:font-medium",
          actionButton:
            "group-[.toast]:rounded-xl group-[.toast]:bg-[#1CA7A6] group-[.toast]:text-white font-bold transition-all hover:bg-[#158f8e]",
          cancelButton:
            "group-[.toast]:rounded-xl group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground font-bold",
          closeButton: [
            // Default styling
            "!bg-white !text-slate-500 !border-slate-200 hover:!bg-slate-100 hover:!text-slate-900",
            // Success styling (matching #1CA7A6 theme)
            "group-data-[type=success]:!bg-white/80 group-data-[type=success]:!text-[#1CA7A6] group-data-[type=success]:!border-[#1CA7A6]/40 group-data-[type=success]:hover:!bg-[#1CA7A6] group-data-[type=success]:hover:!text-white",
            // Error styling (matching #dc2626 theme)
            "group-data-[type=error]:!bg-white/80 group-data-[type=error]:!text-[#dc2626] group-data-[type=error]:!border-[#dc2626]/40 group-data-[type=error]:hover:!bg-[#dc2626] group-data-[type=error]:hover:!text-white",
            // Info styling (matching blue-600 theme)
            "group-data-[type=info]:!bg-white/80 group-data-[type=info]:!text-blue-600 group-data-[type=info]:!border-blue-300 group-data-[type=info]:hover:!bg-blue-600 group-data-[type=info]:hover:!text-white",
          ].join(" "),
          success: "!bg-[#f0fdfa] !text-[#1CA7A6] !border-[#1CA7A6]",
          error: "!bg-[#fee2e2] !text-[#dc2626] !border-[#dc2626]",
          info: "!bg-blue-50 !text-blue-600 !border-blue-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
