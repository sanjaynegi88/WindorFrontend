"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeItem {
  label: string;
  className?: string;
}

interface ExpandableProjectCardProps {
  title: string;
  subtitle?: string;
  badges?: BadgeItem[];
  action?: ReactNode;
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
  contentClassName?: string;
}

export function ExpandableProjectCard({
  title,
  subtitle,
  badges = [],
  action,
  children,
  isExpanded = false,
  onToggle,
  className,
  contentClassName,
}: ExpandableProjectCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] transition-all",
        className,
      )}
    >
      <div className="px-3.5 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="min-w-0 flex-1 text-left cursor-pointer"
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <p className="text-[13px] sm:text-[15px] font-bold uppercase tracking-wide text-[#1F2A44] font-inter">
                {title}
              </p>
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider font-inter shrink-0",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            {subtitle ? (
              <p className="mt-1 text-[11px] sm:text-[13px] text-[#708090] font-asap leading-snug">
                {subtitle}
              </p>
            ) : null}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {action ? (
              <div className="hidden sm:flex items-center gap-2">
                {action}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onToggle}
              className="flex size-8 shrink-0 items-center justify-center cursor-pointer rounded-full bg-[rgba(28,167,166,0.12)] text-[#1CA7A6] transition-colors hover:bg-[rgba(28,167,166,0.18)]"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </div>
        </div>

        {action ? (
          <div className="mt-2.5 flex sm:hidden items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#F0F4F8]">
            {action}
          </div>
        ) : null}
      </div>

      {isExpanded ? (
        <div
          className={cn(
            "border-t border-[#E8EDF2] bg-white px-3.5 py-3.5 sm:px-5 sm:py-4",
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
