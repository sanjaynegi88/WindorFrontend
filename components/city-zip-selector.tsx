"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn, toTitleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCities, getStates } from "@/lib/actions";

interface CommonProps {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  rounded?: "md" | "xl";
  labelClassName?: string;
  disabled?: boolean;
}

export interface StateOption {
  id: string;
  name: string;
  abbreviation?: string;
}

interface StateSelectProps extends CommonProps {
  states?: StateOption[];
  valueType?: "name" | "id";
  onSelectState?: (state: StateOption) => void;
  onLoaded?: () => void;
}

export function StateSelect({
  name,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
  states: externalStates,
  valueType = "id",
  className,
  placeholder = "Select state",
  onSelectState,
  rounded = "md",
  labelClassName,
  onLoaded,
  disabled,
}: StateSelectProps) {
  const formContext = useFormContext();
  const [states, setStates] = React.useState<StateOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (externalStates && externalStates.length > 0) {
      setStates(externalStates);
      if (onLoaded) onLoaded();
      return;
    }

    let active = true;
    async function fetchStates() {
      try {
        setLoading(true);
        const response = await getStates(1, 1000);
        const raw: any[] = Array.isArray(response) ? response : response?.data || [];
        const mapped = raw.map((s: any) => ({
          id: String(s.id),
          name: s.state_name || s.name,
          abbreviation: s.abbreviation,
        }));
        if (active) setStates(mapped);
      } catch (error) {
        console.error("Failed to load states:", error);
      } finally {
        if (active) setLoading(false);
        if (onLoaded) onLoaded();
      }
    }
    fetchStates();
    return () => {
      active = false;
    };
  }, [externalStates]);

  const internalValue =
    name && formContext ? formContext.watch(name) : controlledValue;

  const selectedState = states.find((s) =>
    valueType === "id" ? String(s.id) === String(internalValue) : s.name === internalValue,
  );

  const displayValue = selectedState ? selectedState.name : (internalValue || "");

  const handleSelect = (state: StateOption) => {
    const newValue = valueType === "id" ? String(state.id) : state.name;
    if (name && formContext) {
      formContext.setValue(name, newValue);
    }
    if (controlledOnChange) {
      controlledOnChange(newValue);
    }
    if (onSelectState) {
      onSelectState(state);
    }
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "h-[39px] md:h-[65px] rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap transition-all w-full shadow-none flex items-center justify-between",
        !displayValue
          ? "text-[#708090]/60 font-normal"
          : "text-[#708090] font-medium",
        disabled && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      <span className="truncate">{displayValue || placeholder}</span>
      <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50 ml-2" />
    </Button>
  );

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)] bg-white z-[100]"
        align="start"
      >
        <Command className="w-full">
          <CommandInput
            placeholder="Search state..."
            className="h-12 text-[15px] md:text-[18px] font-asap"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Loading..." : "No states found."}
            </CommandEmpty>
            <CommandGroup>
              {states.map((st) => (
                <CommandItem
                  key={st.id}
                  value={st.name}
                  onSelect={() => handleSelect(st)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (valueType === "id" ? String(st.id) === String(internalValue) : st.name === internalValue)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {st.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (name && formContext) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col w-full">
            {label && (
              <FormLabel
                className={cn("text-sm font-semibold", labelClassName)}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>{content}</FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className={cn("text-sm font-semibold", labelClassName)}>
          {label}
        </label>
      )}
      {content}
    </div>
  );
}

interface CitySelectProps extends CommonProps {
  stateName?: string;
  stateValue?: string; // Add this for controlled component support
  zipName?: string;
  valueType?: "name" | "id";
  onSelectCity?: (city: any) => void;
  onLoaded?: () => void;
  syncState?: boolean;
}

export function CitySelect({
  name,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
  stateName = "state_id",
  stateValue,
  zipName = "zip",
  valueType = "name",
  className,
  placeholder = "Select city",
  onSelectCity,
  rounded = "md",
  labelClassName,
  onLoaded,
  syncState = false,
  disabled,
}: CitySelectProps) {
  const formContext = useFormContext();
  const [cities, setCities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const internalStateValue =
    stateValue !== undefined
      ? stateValue
      : stateName && formContext
        ? formContext.watch(stateName)
        : undefined;

  React.useEffect(() => {
    let active = true;
    async function fetchCities() {
      try {
        setLoading(true);
        const response = await getCities(
          undefined,
          undefined,
          undefined,
          undefined,
          internalStateValue,
        );
        if (active) setCities(response.data || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
      } finally {
        if (active) setLoading(false);
        if (onLoaded) onLoaded();
      }
    }
    fetchCities();
    return () => {
      active = false;
    };
  }, [internalStateValue]);

  const internalValue =
    name && formContext ? formContext.watch(name) : controlledValue;

  const selectedCity = cities.find((c) =>
    valueType === "id" ? String(c.id) === String(internalValue) : c.name === internalValue,
  );

  const displayValue = selectedCity
    ? toTitleCase(selectedCity.name)
    : internalValue
      ? toTitleCase(String(internalValue))
      : "";

  const handleSelect = (city: any | null) => {
    if (city) {
      const newValue = valueType === "id" ? String(city.id) : city.name;

      if (name && formContext) {
        formContext.setValue(name, newValue);
        if (syncState && stateName)
          formContext.setValue(stateName, city.state || city.state_id || "");
        if (
          zipName &&
          city.zip_codes?.length > 0 &&
          !formContext.watch(zipName)
        ) {
          formContext.setValue(zipName, city.zip_codes[0]);
        }
      }

      if (controlledOnChange) {
        controlledOnChange(newValue);
      }

      if (onSelectCity) {
        onSelectCity(city);
      }
    } else {
      if (name && formContext) {
        formContext.setValue(name, "");
        if (syncState && stateName) formContext.setValue(stateName, "");
        if (zipName) formContext.setValue(zipName, "");
      }
      if (controlledOnChange) controlledOnChange("");
    }
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "h-[39px] md:h-[65px] rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap transition-all w-full shadow-none flex items-center justify-between",
        !displayValue
          ? "text-[#708090]/60 font-normal"
          : "text-[#708090] font-medium",
        disabled && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      <span className="truncate">{displayValue || placeholder}</span>
      <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50 ml-2" />
    </Button>
  );

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)] bg-white z-[100]"
        align="start"
      >
        <Command className="w-full">
          <CommandInput
            placeholder="Search city..."
            className="h-12 text-[15px] md:text-[18px] font-asap"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Loading..." : "No cities found."}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.name}
                  onSelect={() => handleSelect(city)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (valueType === "id"
                        ? String(city.id) === String(internalValue)
                        : city.name === internalValue)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {toTitleCase(city.name)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (name && formContext) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col w-full">
            {label && (
              <FormLabel
                className={cn("text-sm font-semibold", labelClassName)}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>{content}</FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className={cn("text-sm font-semibold", labelClassName)}>
          {label}
        </label>
      )}
      {content}
    </div>
  );
}

interface ZipSelectProps extends CommonProps {
  cityName?: string;
  cityValue?: string; // If not using form context
  onLoaded?: () => void;
}

export function ZipSelect({
  name,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
  cityName = "city",
  cityValue: controlledCityValue,
  className,
  placeholder = "Select zip",
  rounded = "md",
  labelClassName,
  onLoaded,
  disabled,
}: ZipSelectProps) {
  const formContext = useFormContext();
  const [cities, setCities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const internalValue =
    name && formContext ? formContext.watch(name) : controlledValue;
  const currentCityName =
    cityName && formContext ? formContext.watch(cityName) : controlledCityValue;

  React.useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const response = await getCities();
        setCities(response.data || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
      } finally {
        setLoading(false);
        if (onLoaded) onLoaded();
      }
    }
    fetchCities();
  }, []);

  React.useEffect(() => {
    async function fetchSpecificCity() {
      if (!currentCityName) return;

      const found = cities.find(
        (c) => c.name === currentCityName || c.id === currentCityName,
      );
      if (!found) {
        try {
          const response = await getCities(
            undefined,
            undefined,
            currentCityName,
          );
          if (response.data) {
            const newCity = Array.isArray(response.data)
              ? response.data[0]
              : response.data;
            if (newCity) {
              setCities((prev) => [...prev, newCity]);
            }
          }
        } catch (error) {
          console.error("Failed to load specific city:", error);
        }
      }
    }
    fetchSpecificCity();
  }, [currentCityName, cities]);

  const availableZips = React.useMemo(() => {
    if (currentCityName) {
      const city = cities.find(
        (c) => c.name === currentCityName || c.id === currentCityName,
      );
      return city?.zip_codes || [];
    }
    return [];
  }, [cities, currentCityName]);
  const handleSelect = (zip: string) => {
    if (name && formContext) {
      formContext.setValue(name, zip);
      if (!currentCityName) {
        const city = cities.find((c) => c.zip_codes.includes(zip));
        if (city) {
          formContext.setValue(cityName, city.name);
          formContext.setValue("state", city.state_entity.state_name);
        }
      }
    }
    if (controlledOnChange) {
      controlledOnChange(zip);
    }
    setOpen(false);
  };

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      disabled={!currentCityName || disabled}
      className={cn(
        "h-[39px] md:h-[65px] rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap transition-all w-full shadow-none flex items-center justify-between",
        !internalValue || !currentCityName
          ? "text-[#708090]/60 font-normal"
          : "text-[#708090] font-medium",
        (!currentCityName || disabled) && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      <span className="truncate">
        {!currentCityName ? "Select city first" : internalValue || placeholder}
      </span>
      <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50" />
    </Button>
  );

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)]"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search zip..."
            className="h-12 text-[16px] md:text-[18px] font-asap"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No results."}
            </CommandEmpty>
            <CommandGroup>
              {availableZips.map((zip: any) => (
                <CommandItem
                  value={zip}
                  key={zip}
                  onSelect={() => handleSelect(zip)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      zip === internalValue ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {zip}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (name && formContext) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col w-full">
            {label && (
              <FormLabel
                className={cn("text-sm font-semibold", labelClassName)}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>{content}</FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className={cn("text-sm font-semibold", labelClassName)}>
          {label}
        </label>
      )}
      {content}
    </div>
  );
}
