"use client";

import { useState, useEffect } from "react";
import { Search, Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getStates, getCities } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useUser } from "../providers/user-provider";
import { cn, toTitleCase } from "@/lib/utils";

export type SearchScope = "all" | "brand" | "color" | "style";

interface UnifiedSearchBarProps {
  onSearch?: (params: {
    search: string;
    searchBy: SearchScope;
    state: string;
    city: string;
    state_id: string;
    city_id: string;
  }) => void;
  onChange?: (params: {
    search: string;
    searchBy: SearchScope;
    state: string;
    city: string;
    state_id: string;
    city_id: string;
  }) => void;
  onSearchTriggered?: () => void;
  showSearchButton?: boolean;
  className?: string;
  isMapView?: boolean;
  allowEmptySearch?: boolean;
}

export function UnifiedSearchBar({
  onSearch,
  onChange,
  onSearchTriggered,
  showSearchButton = false,
  className,
  isMapView = false,
  allowEmptySearch = false,
}: UnifiedSearchBarProps) {
  const [search, setSearch] = useState("");
  const { user } = useUser();
  const role = user?.role?.toLowerCase() || "";
  const isContractor = role === "contractor";
  const isCityInspector = role === "city_inspector";
  const [searchBy, setSearchBy] = useState<SearchScope>("all");
  const [state, setState] = useState("all");
  const [city, setCity] = useState("all");

  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const statesRes = await getStates(1, 1000);
        setStates(Array.isArray(statesRes) ? statesRes : statesRes?.data || []);
        const citiesRes = await getCities();
        setCities(Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || []);
      } catch (error) {
        console.error("Failed to fetch search options:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const stateId = state !== "all" ? state : undefined;
        const citiesRes = await getCities(
          undefined,
          undefined,
          undefined,
          undefined,
          stateId,
        );
        const fetchedCities = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || [];
        setCities(fetchedCities);
        setCity((prevCity) => {
          if (prevCity === "all") return "all";
          const exists = fetchedCities.some(
            (c: any) => String(c.id) === String(prevCity),
          );
          return exists ? prevCity : "all";
        });
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, [state]);

  useEffect(() => {
    if (onChange) {
      onChange({
        search,
        searchBy,
        state,
        city,
        state_id: state !== "all" ? state : "",
        city_id: city !== "all" ? city : "",
      });
    }
  }, [search, searchBy, state, city, onChange]);

  const isSearchInputDone =
    allowEmptySearch ||
    (isCityInspector || isMapView
      ? search.trim().length > 0
      : state !== "all" &&
        state !== "" &&
        city !== "all" &&
        city !== "" &&
        search.trim().length > 0);
  const isSearchDisabled = !isSearchInputDone;

  const handleSearchClick = () => {
    if (isSearchDisabled) return;
    const params = {
      search,
      searchBy,
      state,
      city,
      state_id: state !== "all" ? state : "",
      city_id: city !== "all" ? city : "",
    };
    if (onSearch) {
      onSearch(params);
    } else if (onSearchTriggered) {
      onSearchTriggered();
    }
  };

  useEffect(() => {
    if (isContractor) {
      setSearchBy("all");
    }
  }, [isContractor]);

  useEffect(() => {
    if (isCityInspector || isMapView) {
      setState("all");
      setCity("all");
    }
  }, [isCityInspector, isMapView]);

  const getPlaceholder = () => {
    if (isContractor) return "Search Property";

    switch (searchBy) {
      case "brand":
        return "Search by brand...";
      case "color":
        return "Search by color...";
      case "style":
        return "Search by style...";
      default:
        return "Search Property";
    }
  };

  const selectedStateObj = states.find((s) => String(s.id) === String(state));
  const selectedStateName =
    state === "all"
      ? "Select State"
      : selectedStateObj?.state_name ||
        selectedStateObj?.name ||
        "Select State";

  const selectedCityObj = cities.find((c) => String(c.id) === String(city));
  const selectedCityName =
    city === "all"
      ? "City"
      : selectedCityObj?.city_name || selectedCityObj?.name || "City";

  return (
    <div className={`space-y-[10px] md:space-y-[30px] w-full ${className}`}>
      {/* Dropdowns Row */}
      {!isCityInspector && !isMapView && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] md:gap-[19.8px]">
          {/* Searchable State Dropdown */}
          <Popover open={openState} onOpenChange={setOpenState}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openState}
                className="h-[39px] md:h-[65px] w-full justify-between rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap shadow-none hover:bg-white"
              >
                <span className="truncate">
                  {toTitleCase(selectedStateName)}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#1CA7A6]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl bg-white shadow-xl border border-[rgba(28,167,166,0.25)] z-50">
              <Command>
                <CommandInput
                  placeholder="Search state..."
                  className="h-10 text-sm font-asap"
                />
                <CommandList className="max-h-[220px] overflow-y-auto p-1">
                  <CommandEmpty className="py-2 text-center text-xs text-muted-foreground font-asap">
                    No state found.
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="Select State"
                      onSelect={() => {
                        setState("all");
                        setOpenState(false);
                      }}
                      className="cursor-pointer text-sm font-asap py-2 rounded-lg"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-[#1CA7A6]",
                          state === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Select State
                    </CommandItem>
                    {states.map((s) => {
                      const name = s.state_name || s.name || "";
                      return (
                        <CommandItem
                          key={s.id}
                          value={name}
                          onSelect={() => {
                            setState(s.id);
                            setOpenState(false);
                          }}
                          className="cursor-pointer text-sm font-asap py-2 rounded-lg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#1CA7A6]",
                              state === s.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Searchable City Dropdown */}
          <Popover open={openCity} onOpenChange={setOpenCity}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCity}
                className="h-[39px] md:h-[65px] w-full justify-between rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap shadow-none hover:bg-white"
              >
                <span className="truncate">
                  {toTitleCase(selectedCityName)}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#1CA7A6]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl bg-white shadow-xl border border-[rgba(28,167,166,0.25)] z-50">
              <Command>
                <CommandInput
                  placeholder="Search city..."
                  className="h-10 text-sm font-asap"
                />
                <CommandList className="max-h-[220px] overflow-y-auto p-1">
                  <CommandEmpty className="py-2 text-center text-xs text-muted-foreground font-asap">
                    No city found.
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="City"
                      onSelect={() => {
                        setCity("all");
                        setOpenCity(false);
                      }}
                      className="cursor-pointer text-sm font-asap py-2 rounded-lg"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-[#1CA7A6]",
                          city === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      City
                    </CommandItem>
                    {cities.map((c: any) => {
                      const name = c.city_name || c.name || "";
                      const cityStateId = c.state_id || c.state?.id || c.state_id;
                      return (
                        <CommandItem
                          key={c.id}
                          value={name}
                          onSelect={() => {
                            setCity(c.id);
                            if (cityStateId) {
                              setState(String(cityStateId));
                            }
                            setOpenCity(false);
                          }}
                          className="cursor-pointer text-sm font-asap py-2 rounded-lg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#1CA7A6]",
                              city === c.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {toTitleCase(name)}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Search Input Row with Search By */}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 bg-white rounded-[10px] border border-[rgba(28,167,166,0.26)] transition-all shadow-sm overflow-hidden min-h-[39px] md:min-h-[65px]">
        {!isContractor && (
          <>
            <div className="flex items-center py-2 sm:py-0">
              <span className="text-[11px] md:text-xl font-bold text-[#1CA7A6] ml-3 whitespace-nowrap">
                Search By:
              </span>

              <div className="w-full sm:w-[150px]">
                <Select
                  value={searchBy}
                  onValueChange={(value) => setSearchBy(value as SearchScope)}
                >
                  <SelectTrigger className="h-[39px] md:h-[65px] rounded-lg sm:rounded-l-lg border-none bg-transparent hover:bg-gray-50 focus:ring-0 shadow-none text-[13px] md:text-[20px] font-bold text-[#1CA7A6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-100 mx-2" />
          </>
        )}

        <div className="relative flex-1 group">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isSearchDisabled && handleSearchClick()
            }
            placeholder={getPlaceholder()}
            className="w-full h-[39px] md:h-[65px] pl-6 pr-14 bg-transparent border-none focus:ring-0 transition-all text-[14px] md:text-[20px] outline-none text-[#708090] placeholder:text-gray-300 font-medium font-inter"
          />
          <button
            type="button"
            disabled={isSearchDisabled}
            onClick={handleSearchClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-[#1CA7A6]/10 rounded-full transition-colors group-focus-within:text-[#1CA7A6] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Search className="size-4 md:size-6 text-[#708090]" />
          </button>
        </div>
      </div>

      {showSearchButton && (
        <Button
          disabled={isSearchDisabled}
          onClick={handleSearchClick}
          className="h-[52px] md:h-[77px] w-full bg-[#1CA7A6] hover:bg-[#1d8e82] text-white font-bold text-[20px] md:text-[30px] leading-[23px] md:leading-[34px] rounded-[10px] transition-all shadow-none font-asap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1CA7A6]"
        >
          Search
        </Button>
      )}
    </div>
  );
}
