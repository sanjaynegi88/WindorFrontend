'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getCities } from '@/lib/actions';

interface CommonProps {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  rounded?: 'md' | 'xl';
  labelClassName?: string;
  disabled?: boolean;
}

interface CitySelectProps extends CommonProps {
  stateName?: string;
  stateValue?: string; // Add this for controlled component support
  zipName?: string;
  valueType?: 'name' | 'id';
  onSelectCity?: (city: any) => void;
  onLoaded?: () => void;
  syncState?: boolean;
}

export function CitySelect({
  name,
  label,
  value: controlledValue,
  onChange: controlledOnChange,
  stateName = 'state',
  stateValue,
  zipName = 'zip',
  valueType = 'name',
  className,
  placeholder = "Select city",
  onSelectCity,
  rounded = 'md',
  labelClassName,
  onLoaded,
  syncState = false,
  disabled,
}: CitySelectProps) {
  const formContext = useFormContext();
  const [cities, setCities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const internalStateValue = stateValue || (stateName && formContext ? formContext.watch(stateName) : undefined);

  React.useEffect(() => {
    let active = true;
    async function fetchCities() {
      try {
        setLoading(true);
        const response = await getCities(undefined, undefined, undefined, undefined, internalStateValue);
        if (active) setCities(response.data || []);
      } catch (error) {
        console.error('Failed to load cities:', error);
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

  const internalValue = name && formContext ? formContext.watch(name) : controlledValue;

  const handleSelect = (city: any | null) => {
    if (city) {
      const newValue = valueType === 'id' ? String(city.id) : city.name;

      if (name && formContext) {
        formContext.setValue(name, newValue);
        if (syncState && stateName) formContext.setValue(stateName, city.state || city.state_id || "");
        if (zipName && city.zip_codes?.length > 0 && !formContext.watch(zipName)) {
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
  };

  const content = (
    <Select
      disabled={disabled}
      value={internalValue ? String(internalValue) : ""}
      onValueChange={(val) => {
        const city = cities.find((c) =>
          valueType === 'id' ? String(c.id) === val : c.name === val
        );
        handleSelect(city || null);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-[39px] md:h-[65px] rounded-[10px] border-[rgba(28,167,166,0.25)] bg-white text-[#708090] font-medium px-4 md:px-6 focus:ring-[#22a699]/20 text-[13px] md:text-[20px] font-asap transition-all w-full shadow-none flex items-center justify-between",
          !internalValue ? "text-[#708090]/60 font-normal" : "text-[#708090] font-medium",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl max-h-[300px]">
        {cities.map((city) => (
          <SelectItem
            key={city.id}
            value={valueType === 'id' ? String(city.id) : city.name}
          >
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (name && formContext) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col w-full">
            {label && <FormLabel className={cn("text-sm font-semibold", labelClassName)}>{label}</FormLabel>}
            <FormControl>
              {content}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      {label && <label className={cn("text-sm font-semibold", labelClassName)}>{label}</label>}
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
  cityName = 'city',
  cityValue: controlledCityValue,
  className,
  placeholder = "Select zip",
  rounded = 'md',
  labelClassName,
  onLoaded,
  disabled,
}: ZipSelectProps) {
  const formContext = useFormContext();
  const [cities, setCities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const internalValue = name && formContext ? formContext.watch(name) : controlledValue;
  const currentCityName = cityName && formContext ? formContext.watch(cityName) : controlledCityValue;

  React.useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const response = await getCities();
        setCities(response.data || []);
      } catch (error) {
        console.error('Failed to load cities:', error);
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

      const found = cities.find(c => c.name === currentCityName || c.id === currentCityName);
      if (!found) {
        try {
          const response = await getCities(undefined, undefined, currentCityName);
          if (response.data) {
            const newCity = Array.isArray(response.data) ? response.data[0] : response.data;
            if (newCity) {
              setCities(prev => [...prev, newCity]);
            }
          }
        } catch (error) {
          console.error('Failed to load specific city:', error);
        }
      }
    }
    fetchSpecificCity();
  }, [currentCityName, cities]);

  const availableZips = React.useMemo(() => {
    if (currentCityName) {

      const city = cities.find(c => c.name === currentCityName || c.id === currentCityName);
      return city?.zip_codes || [];
    }
    return [];
  }, [cities, currentCityName]);
  const handleSelect = (zip: string) => {
    if (name && formContext) {
      formContext.setValue(name, zip);
      if (!currentCityName) {
        const city = cities.find(c => c.zip_codes.includes(zip));
        if (city) {
          formContext.setValue(cityName, city.name);
          formContext.setValue('state', city.state_entity.state_name);
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
        (!internalValue || !currentCityName) ? "text-[#708090]/60 font-normal" : "text-[#708090] font-medium",
        (!currentCityName || disabled) && "cursor-not-allowed opacity-70",
        className
      )}
    >
      <span className="truncate">
        {!currentCityName ? "Select city first" : (internalValue || placeholder)}
      </span>
      <ChevronDown className="h-4 w-4 md:h-6 md:w-6 shrink-0 opacity-50" />
    </Button>
  );

  const content = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-xl overflow-hidden shadow-2xl border-[rgba(28,167,166,0.15)]" align="start">
        <Command>
          <CommandInput placeholder="Search zip..." className="h-12 text-[16px] md:text-[18px] font-asap" />
          <CommandList>
            <CommandEmpty>{loading ? "Loading..." : "No results."}</CommandEmpty>
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
                      zip === internalValue ? "opacity-100" : "opacity-0"
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
            {label && <FormLabel className={cn("text-sm font-semibold", labelClassName)}>{label}</FormLabel>}
            <FormControl>
              {content}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      {label && <label className={cn("text-sm font-semibold", labelClassName)}>{label}</label>}
      {content}
    </div>
  );
}
