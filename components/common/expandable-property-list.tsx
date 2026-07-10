"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin } from "lucide-react";

interface ExpandablePropertyItem {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyId?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
}

interface ExpandablePropertyListProps {
  projectData: ExpandablePropertyItem[];
  className?: string;
  emptyMessage?: string;
}

export function ExpandablePropertyList({
  projectData,
  className,
  emptyMessage = "No projects found.",
}: ExpandablePropertyListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!projectData.length) {
    return (
      <div className="rounded-4xl bg-gray-50 py-20 text-center">
        <p className="text-lg font-black uppercase tracking-widest text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`.trim()}>
      {projectData.map((property) => {
        const isExpanded = expandedId === property.id;
        const detailEntries = Object.entries(property.details ?? {});

        return (
          <div
            key={property.id}
            className="overflow-hidden rounded-[10px] border border-[#1CA7A6] bg-white shadow-sm transition-all hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : property.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left md:gap-4 md:px-6 md:py-4"
              aria-expanded={isExpanded}
            >
              <div className="shrink-0">
                <Image
                  src="/assets/home-icon.png"
                  alt="property"
                  width={36}
                  height={36}
                  className="md:hidden"
                />
                <Image
                  src="/assets/home-icon.png"
                  alt="property"
                  width={44}
                  height={44}
                  className="hidden md:block"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate font-asap text-sm font-black uppercase tracking-tight text-[#1e293b] md:text-base">
                    {property.address}
                  </h3>
                  <ChevronDown
                    className={`size-4 shrink-0 text-[#1CA7A6] transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-gray-400 md:text-sm">
                  <MapPin className="size-3 shrink-0" />
                  {property.city}
                  {property.city && property.state ? ", " : ""}
                  {property.state} {property.zip}
                </p>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="border-t border-[#1CA7A6]/20 bg-[#f8fdfd] px-4 py-4 md:px-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {property.propertyId && (
                        <div className="rounded-lg border border-gray-100 bg-white p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Property ID
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#1F2A44]">
                            {property.propertyId}
                          </p>
                        </div>
                      )}

                      {detailEntries.length > 0 ? (
                        detailEntries.map(([key, value]) => (
                          <div key={key} className="rounded-lg border border-gray-100 bg-white p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#1F2A44]">
                              {typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : value ?? "—"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-gray-100 bg-white p-3 sm:col-span-2">
                          <p className="text-sm font-medium text-gray-500">
                            No extra details available.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default ExpandablePropertyList;
