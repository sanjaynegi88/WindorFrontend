"use client";

import { useState } from "react";
import { Search, PlusCircle, ChevronDown, Check } from "lucide-react";
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
  loading?: boolean;
  allowCustom?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  displayValueFallback?: string;
}

const triggerClass =
  "h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] font-asap justify-start text-left w-full shadow-none flex items-center justify-between hover:bg-white focus:ring-[#1CA7A6]/20 transition-all";

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  loading = false,
  allowCustom = false,
  triggerClassName,
  disabled = false,
  searchValue,
  onSearchValueChange,
  displayValueFallback,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchState, setSearchState] = useState("");

  const search = searchValue !== undefined ? searchValue : searchState;
  const handleSearchChange = (val: string) => {
    if (searchValue === undefined) {
      setSearchState(val);
    }
    if (onSearchValueChange) {
      onSearchValueChange(val);
    }
  };

  const isCustom = value?.startsWith("__custom__:");
  const displayValue = isCustom
    ? value.slice("__custom__:".length)
    : (options.find((o) => o.id === value)?.name ?? displayValueFallback ?? "");

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            triggerClassName ?? triggerClass,
            !displayValue && "text-[#708090]/50",
          )}
        >
          <span className="truncate flex-1 text-left">
            {displayValue ? toTitleCase(displayValue) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
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
                          onValueChange(o.id);
                          handleSearchChange("");
                          setOpen(false);
                        }}
                        className={cn(
                          "text-[15px] font-asap cursor-pointer py-2 flex items-center",
                          o.isSubBrand && "pl-6",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === o.id ? "opacity-100" : "opacity-0",
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
                          onValueChange(`__custom__:${search.trim()}`);
                          handleSearchChange("");
                          setOpen(false);
                        }}
                        className="text-[#1CA7A6] text-[15px] font-asap cursor-pointer py-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
                        Add "{toTitleCase(search.trim())}"
                      </CommandItem>
                    )}

                  {selectableFiltered.length === 0 &&
                    (!allowCustom || search.trim().length === 0) && (
                      <div className="p-4 text-center text-sm text-[#708090]">
                        No results found
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
