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
        "overflow-hidden rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-4 md:px-5 md:py-5">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] md:text-[15px] font-bold uppercase tracking-wide text-[#1F2A44] font-inter">
              {title}
            </p>
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest font-inter",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
          {subtitle ? (
            <p className="mt-1.5 text-[12px] md:text-[13px] text-[#708090] font-asap">
              {subtitle}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {action}
          <button
            type="button"
            onClick={onToggle}
            className="flex size-8 items-center justify-center cursor-pointer rounded-full bg-[rgba(28,167,166,0.12)] text-[#1CA7A6] transition-colors hover:bg-[rgba(28,167,166,0.18)]"
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

      {isExpanded ? (
        <div
          className={cn(
            "border-t border-[#E8EDF2] bg-white px-4 py-4 md:px-5 md:py-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
