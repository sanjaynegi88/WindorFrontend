"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, BadgeButton } from "@/components/ui/badge";
import { getCities } from "@/lib/actions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiCitySelectorProps {
  selectedCities: string[];
  selectedCityDetails?: { id: string; name: string }[];
  onCitiesChange: (cities: string[]) => void;
}
export function MultiCitySelector({
  selectedCities,
  onCitiesChange,
  selectedCityDetails,
}: MultiCitySelectorProps) {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCityData, setSelectedCityData] = useState(
    selectedCityDetails || []
  );

  useEffect(() => {
    let active = true;
    async function fetchCities() {
      try {
        setLoading(true);
        const response = await getCities(1, 50, undefined, searchValue);
        if (active) setCities(response.data || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCities();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchValue]);

  const handleSelect = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);

    if (!selectedCities.includes(cityId)) {
      onCitiesChange([...selectedCities, cityId]);

      if (city) {
        setSelectedCityData((prev) => {
          const exists = prev.find((c) => c.id === city.id);
          return exists ? prev : [...prev, city];
        });
      }
    }

    setOpen(false);
    setSearchValue("");
  };

  const handleRemove = (cityId: string) => {
    onCitiesChange(selectedCities.filter(id => id !== cityId));

    setSelectedCityData(prev =>
      prev.filter(city => city.id !== cityId)
    );
  };

  const getSelectedCityNames = () => {
    return selectedCities.map(id => {
      const city = selectedCityData.find(c => c.id === id);
      return city ? city.name : id;
    });
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full bg-white border border-[rgba(112,128,144,0.23)] transition-[color,box-shadow]",
              "text-[#a83e00] font-asap font-medium rounded-[6px] cursor-pointer",
              "h-12 px-3 items-center justify-between",
              open && "border-[#1CA7A6] ring-[#1CA7A6]/30",
            )}
          >
            <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
              {selectedCities.length > 0 ? (
                <>
                  {getSelectedCityNames().map((cityName, index) => (
                    <Badge
                      key={selectedCities[index]}
                      variant="primary"
                      appearance="default"
                      className="pl-2 pr-1 py-0 h-7 rounded-md flex items-center gap-1 text-sm border-none shadow-none"
                    >
                      {cityName}
                      <BadgeButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(selectedCities[index]);
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </BadgeButton>
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-[#1F2A44]/50">Select cities...</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[6px] overflow-hidden"
          align="start"
        >
          <Command shouldFilter={false} className="rounded-none">
            <CommandInput
              placeholder="Search cities..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-12 border-none focus:ring-0"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {loading ? "Loading..." : "No cities found."}
              </CommandEmpty>
              <CommandGroup>
                {cities
                  .filter((city) => !selectedCities.includes(city.id))
                  .map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.id}
                      onSelect={() => handleSelect(city.id)}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[#1F2A44]">
                          {city.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {city.state_name || city.state}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
