"use client";

import { useRef, useState } from "react";
import { Search, PlusCircle, ChevronDown, Check, Loader2 } from "lucide-react";
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

export interface SearchableSelectOption {
  id: string;
  name: string;
  disabled?: boolean;
  isHeader?: boolean;
  isSubBrand?: boolean;
  parentName?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  allowCustom?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  displayValueFallback?: string;
  focusNextDelay?: number;
  autoFocusNext?: boolean;
  triggerRef?: React.Ref<HTMLButtonElement>;
}

const triggerClass =
  "h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] font-asap justify-start text-left w-full shadow-none flex items-center justify-between hover:bg-white focus:ring-[#1CA7A6]/20 transition-all";

function isPopoverElement(el: HTMLElement): boolean {
  return Boolean(
    el.hasAttribute("data-radix-focus-guard") ||
      el.closest("[data-slot='popover-content']") ||
      el.closest("[data-radix-popover-content]") ||
      el.closest("[data-radix-popper-content-wrapper]") ||
      el.closest("[data-radix-portal]") ||
      el.closest("[role='dialog']") ||
      el.closest("[cmdk-root]") ||
      el.closest(".cmdk-root"),
  );
}

export function focusNextField(
  currentElement: HTMLElement | null,
  delay: number = 200,
) {
  if (!currentElement) return;
  const form = currentElement.closest("form") || document.body;

  const attemptFocus = (retriesLeft = 3) => {
    const allCandidateSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const candidates = Array.from(
      form.querySelectorAll<HTMLElement>(allCandidateSelector),
    ).filter(
      (el) =>
        (el.offsetWidth > 0 || el.offsetHeight > 0 || el === currentElement) &&
        !el.classList.contains("pointer-events-none") &&
        !isPopoverElement(el),
    );

    let nextEl: HTMLElement | undefined;
    const currentIndex = candidates.indexOf(currentElement);
    if (currentIndex !== -1 && currentIndex < candidates.length - 1) {
      nextEl = candidates[currentIndex + 1];
    } else {
      nextEl = candidates.find(
        (el) =>
          el !== currentElement &&
          (currentElement.compareDocumentPosition(el) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
      );
    }

    if (nextEl) {
      const isDisabled =
        nextEl.hasAttribute("disabled") ||
        (nextEl as HTMLButtonElement | HTMLInputElement).disabled;

      if (isDisabled && retriesLeft > 0) {
        setTimeout(() => attemptFocus(retriesLeft - 1), 150);
        return;
      }

      if (!isDisabled) {
        nextEl.focus();
      }
    }
  };

  setTimeout(() => {
    attemptFocus();
  }, delay);
}

export function focusPreviousField(
  currentElement: HTMLElement | null,
  delay: number = 200,
) {
  if (!currentElement) return;
  const form = currentElement.closest("form") || document.body;

  const attemptFocus = (retriesLeft = 3) => {
    const allCandidateSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const candidates = Array.from(
      form.querySelectorAll<HTMLElement>(allCandidateSelector),
    ).filter(
      (el) =>
        (el.offsetWidth > 0 || el.offsetHeight > 0 || el === currentElement) &&
        !el.classList.contains("pointer-events-none") &&
        !isPopoverElement(el),
    );

    let prevEl: HTMLElement | undefined;
    const currentIndex = candidates.indexOf(currentElement);
    if (currentIndex > 0) {
      prevEl = candidates[currentIndex - 1];
    } else if (currentIndex === -1) {
      prevEl = [...candidates]
        .reverse()
        .find(
          (el) =>
            el !== currentElement &&
            (currentElement.compareDocumentPosition(el) &
              Node.DOCUMENT_POSITION_PRECEDING) !==
              0,
        );
    }

    if (prevEl) {
      const isDisabled =
        prevEl.hasAttribute("disabled") ||
        (prevEl as HTMLButtonElement | HTMLInputElement).disabled;

      if (isDisabled && retriesLeft > 0) {
        setTimeout(() => attemptFocus(retriesLeft - 1), 150);
        return;
      }

      if (!isDisabled) {
        prevEl.focus();
      }
    }
  };

  setTimeout(() => {
    attemptFocus();
  }, delay);
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage,
  loading = false,
  allowCustom = false,
  triggerClassName,
  disabled = false,
  searchValue,
  onSearchValueChange,
  displayValueFallback,
  focusNextDelay,
  autoFocusNext = true,
  triggerRef,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchState, setSearchState] = useState("");
  const isPointerInteractionRef = useRef(false);
  const justClosedRef = useRef(false);
  const pointerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const shouldFocusNextRef = useRef(false);
  const isTabbingOutRef = useRef<"next" | "prev" | null>(null);

  const setCombinedRef = (node: HTMLButtonElement | null) => {
    buttonRef.current = node;
    if (typeof triggerRef === "function") {
      triggerRef(node);
    } else if (triggerRef && "current" in triggerRef) {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  };

  const search = searchValue !== undefined ? searchValue : searchState;
  const handleSearchChange = (val: string) => {
    if (searchValue === undefined) {
      setSearchState(val);
    }
    if (onSearchValueChange) {
      onSearchValueChange(val);
    }
  };

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
    handleSearchChange("");
    shouldFocusNextRef.current = true;
    setOpen(false);
  };

  const handleCloseAutoFocus = (e: Event) => {
    e.preventDefault();

    if (isTabbingOutRef.current) {
      isTabbingOutRef.current = null;
      return;
    }

    if (shouldFocusNextRef.current) {
      shouldFocusNextRef.current = false;
      if (autoFocusNext) {
        focusNextField(buttonRef.current, focusNextDelay ?? 200);
      }
    }
  };

  const isCustom = value?.startsWith("__custom__:");
  const displayValue = isCustom
    ? value.slice("__custom__:".length)
    : (options.find(
        (o) =>
          o.id === value ||
          (o.id.startsWith("__header__:") &&
            o.id.slice("__header__:".length) === value) ||
          (o.id.startsWith("__subbrand__:") && o.id.split(":")[1] === value),
      )?.name ??
      (value ? displayValueFallback : undefined) ??
      "");

  const uniqueOptions = options.filter(
    (o, index, self) =>
      index ===
      self.findIndex(
        (t) => t.id === o.id && (t.parentName || "") === (o.parentName || ""),
      ),
  );

  const filtered = uniqueOptions.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatches = o.name.toLowerCase().includes(q);
    const parentMatches = o.parentName?.toLowerCase().includes(q);
    if (nameMatches || parentMatches) return true;
    // If this is a header, keep it if any child subBrand matches search query
    if (o.isHeader || o.disabled) {
      return uniqueOptions.some(
        (child) =>
          child.isSubBrand &&
          child.parentName === o.name &&
          child.name.toLowerCase().includes(q),
      );
    }
    return false;
  });

  const selectableFiltered = filtered.filter((o) => !o.isHeader && !o.disabled);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          ref={setCombinedRef}
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
            } else if (e.key === "Tab") {
              e.preventDefault();
              setOpen(false);
              const trigger = buttonRef.current;
              if (e.shiftKey) {
                focusPreviousField(trigger, 0);
              } else {
                focusNextField(trigger, 0);
              }
            }
          }}
          className={cn(
            triggerClassName ?? triggerClass,
            !displayValue && "text-[#708090]/50",
          )}
        >
          <span className="truncate flex-1 text-left">
            {displayValue ? toTitleCase(displayValue) : placeholder}
          </span>

          {loading ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 shrink-0 animate-spin text-[#1CA7A6]" />
          ) : (
            <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onCloseAutoFocus={handleCloseAutoFocus}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement)?.blur();
            isTabbingOutRef.current = e.shiftKey ? "prev" : "next";
            setOpen(false);
            const trigger = buttonRef.current;
            const isShift = e.shiftKey;
            setTimeout(() => {
              if (isShift) {
                focusPreviousField(trigger, 0);
              } else {
                focusNextField(trigger, 0);
              }
            }, 30);
          }
        }}
        className="p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)] w-(--radix-popover-trigger-width)"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3 bg-white">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-[16px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectableFiltered.length > 0) {
                    const first = selectableFiltered[0];
                    handleSelectOption(first.id === "__none__" ? "" : first.id);
                  } else if (allowCustom && search.trim().length > 0) {
                    handleSelectOption(`__custom__:${search.trim()}`);
                  }
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.target as HTMLElement)?.blur();
                  isTabbingOutRef.current = e.shiftKey ? "prev" : "next";
                  setOpen(false);
                  const trigger = buttonRef.current;
                  const isShift = e.shiftKey;
                  setTimeout(() => {
                    if (isShift) {
                      focusPreviousField(trigger, 0);
                    } else {
                      focusNextField(trigger, 0);
                    }
                  }, 30);
                }
              }}
            />
          </div>

          <CommandList>
            <div className="max-h-[260px] overflow-y-auto p-1 bg-white">
              {loading ? (
                <div className="p-4 text-center text-sm text-[#708090]">
                  Loading...
                </div>
              ) : (
                <CommandGroup>
                  {filtered.map((o) => {
                    if (o.isHeader || o.disabled) {
                      return (
                        <div
                          key={o.id}
                          className="text-[12px] font-bold text-[#708090] uppercase tracking-wider bg-slate-50/90 py-1.5 px-3 my-1 rounded border-b border-slate-100 select-none"
                        >
                          {toTitleCase(o.name)}
                        </div>
                      );
                    }

                    return (
                      <CommandItem
                        key={`${o.id}___${o.parentName || ""}`}
                        value={`${o.id}___${o.parentName || ""}___${o.name}`}
                        onSelect={() => {
                          const selectedValue = o.id === "__none__" ? "" : o.id;
                          handleSelectOption(selectedValue);
                        }}
                        className={cn(
                          "text-[15px] font-asap cursor-pointer py-2 flex items-center",
                          o.isSubBrand && "pl-6",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === o.id || (!value && o.id === "__none__")
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {o.isSubBrand && (
                          <span className="text-primary mr-2 text-[24px] leading-none">
                            •
                          </span>
                        )}
                        {toTitleCase(o.name)}
                      </CommandItem>
                    );
                  })}

                  {selectableFiltered.length === 0 &&
                    search.trim().length > 0 &&
                    allowCustom && (
                      <CommandItem
                        value={`__custom__:${search.trim()}`}
                        onSelect={() => {
                          handleSelectOption(`__custom__:${search.trim()}`);
                        }}
                        className="text-[#1CA7A6] text-[15px] font-asap cursor-pointer py-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
                        Add &quot;{toTitleCase(search.trim())}&quot;
                      </CommandItem>
                    )}

                  {selectableFiltered.length === 0 &&
                    (!allowCustom || search.trim().length === 0) && (
                      <div className="p-4 text-center text-sm text-[#708090]">
                        {emptyMessage || "No results found"}
                      </div>
                    )}
                </CommandGroup>
              )}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
