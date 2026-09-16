"use client";

import { useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toTitleCase } from "@/lib/utils";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { focusNextField } from "@/components/ui/searchable-select";

export interface ContractorOption {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  companyName?: string;
}

interface ContractorSelectProps {
  contractors: ContractorOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const defaultTriggerClass =
  "w-full h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] font-asap flex items-center justify-between shadow-none hover:bg-white focus:ring-[#1CA7A6]/20 transition-all text-left";

export function ContractorSelect({
  contractors,
  value,
  onValueChange,
  placeholder = "Contractor",
  searchPlaceholder = "Search contractor...",
  emptyMessage = "No contractors found",
  triggerClassName,
  disabled = false,
}: ContractorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isPointerInteractionRef = useRef(false);
  const justClosedRef = useRef(false);
  const pointerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const shouldFocusNextRef = useRef(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    isPointerInteractionRef.current = false;
    if (!isOpen) {
      justClosedRef.current = true;
      setTimeout(() => {
        justClosedRef.current = false;
      }, 200);
    }
  };

  const handlePointerDown = () => {
    isPointerInteractionRef.current = true;
    if (pointerTimerRef.current) clearTimeout(pointerTimerRef.current);
    pointerTimerRef.current = setTimeout(() => {
      isPointerInteractionRef.current = false;
    }, 300);
  };

  const handleFocus = () => {
    if (disabled) return;
    if (isPointerInteractionRef.current) {
      isPointerInteractionRef.current = false;
      return;
    }
    if (justClosedRef.current) {
      justClosedRef.current = false;
      return;
    }
    setOpen(true);
  };

  const handleSelectOption = (selectedValue: string) => {
    onValueChange(selectedValue);
    setSearch("");
    shouldFocusNextRef.current = true;
    setOpen(false);
  };

  const handleCloseAutoFocus = (e: Event) => {
    if (shouldFocusNextRef.current) {
      e.preventDefault();
      shouldFocusNextRef.current = false;
      focusNextField(buttonRef.current);
    }
  };

  const itemsWithNone: ContractorOption[] = [
    { id: "__none__", displayName: "None" },
    ...contractors.filter((c) => c.id !== "__none__"),
  ];

  const filtered = itemsWithNone.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    if (c.id === "__none__") {
      return "none".includes(q);
    }
    const displayNameMatches = (c.displayName || c.name || "")
      .toLowerCase()
      .includes(q);
    const emailMatches = (c.email || "").toLowerCase().includes(q);
    const companyMatches = (c.companyName || "").toLowerCase().includes(q);
    return displayNameMatches || emailMatches || companyMatches;
  });

  const selectedContractor = contractors.find(
    (c) => c.id === value && c.id !== "__none__",
  );
  const displayValue = selectedContractor
    ? selectedContractor.displayName ||
      selectedContractor.name ||
      selectedContractor.email ||
      ""
    : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onPointerDown={handlePointerDown}
          onFocus={handleFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              focusNextField(buttonRef.current);
            }
          }}
          className={cn(
            triggerClassName ?? defaultTriggerClass,
            !displayValue && "text-[#708090]/50",
          )}
        >
          <span className="truncate flex-1 text-left">
            {displayValue ? toTitleCase(displayValue) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        onCloseAutoFocus={handleCloseAutoFocus}
        className="p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)] w-(--radix-popover-trigger-width)"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3 bg-white">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-[15px] md:text-[16px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-asap"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (filtered.length > 0) {
                    const first = filtered[0];
                    handleSelectOption(first.id === "__none__" ? "" : first.id);
                  }
                }
              }}
            />
          </div>

          <CommandList>
            <div className="max-h-[280px] overflow-y-auto p-1 bg-white">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#708090]">
                  {emptyMessage}
                </div>
              ) : (
                <CommandGroup>
                  {filtered.map((c) => {
                    const isSelected =
                      value === c.id ||
                      (c.id === "__none__" && (!value || value === "__none__"));

                    return (
                      <CommandItem
                        key={c.id}
                        value={`${c.id} ${c.displayName || c.name || ""} ${c.email || ""} ${c.companyName || ""}`}
                        onSelect={() => {
                          handleSelectOption(c.id === "__none__" ? "" : c.id);
                        }}
                        className="text-[15px] font-asap cursor-pointer py-2.5 px-3 flex items-start gap-2.5 hover:bg-slate-50 aria-selected:bg-slate-50 transition-colors"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 text-[#1CA7A6] mt-0.5",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          {/* Display name (title like) */}
                          <span className="font-semibold text-[15px] md:text-[16px] text-[#1F2A44] leading-snug truncate">
                            {c.id === "__none__"
                              ? "None"
                              : toTitleCase(
                                  c.displayName ||
                                    c.name ||
                                    c.email ||
                                    "Unknown Contractor",
                                )}
                          </span>

                          {/* email (small text than title) */}
                          {c.email && c.id !== "__none__" && (
                            <span className="text-[12px] md:text-[13px] text-[#708090] leading-tight truncate">
                              {c.email}
                            </span>
                          )}

                          {/* company name (same style as email) */}
                          {c.companyName && c.id !== "__none__" && (
                            <span className="text-[12px] md:text-[13px] text-[#708090] leading-tight truncate">
                              {toTitleCase(c.companyName)}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
