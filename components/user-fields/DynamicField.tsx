"use client";

import React, { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  SearchableSelect,
  SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { ServiceSelect } from "@/components/service-select";
import {
  RoleFieldConfig,
  FormContext,
  isFieldRequired,
} from "@/lib/user-role-fields";
import { Loader2 } from "lucide-react";
import { getServiceProvided, getStates, getCities } from "@/lib/actions";
import { cn, toPascalCase } from "@/lib/utils";

export interface DynamicFieldProps {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  context: FormContext;
  isEditing?: boolean;
  disabled?: boolean;
  selectedStateId?: string;
  onStateSelect?: (stateId: string) => void;
  selectedCityName?: string;
  onCitySelect?: (cityId: string, cityName?: string) => void;
  isPresent?: boolean;
  onPresentChange?: (checked: boolean) => void;
  inputCls?: string;
  labelCls?: string;
  errCls?: string;
  statesList?: { id: string; name: string }[];
  isStateLoading?: boolean;
  isCityLoading?: boolean;
}

export const defaultStep2InputCls =
  "h-[65px] px-[19px] border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] leading-[23px] font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap";

export const defaultEditInputCls =
  "h-11 bg-muted/20 focus:bg-background transition-all";

export const defaultProfileInputCls =
  "h-11 rounded-xl bg-muted/30 border-input focus:bg-background transition-all shadow-none";

export function DynamicField({
  config,
  form,
  context,
  isEditing = true,
  disabled = false,
  selectedStateId,
  onStateSelect,
  selectedCityName,
  onCitySelect,
  isPresent = false,
  onPresentChange,
  inputCls,
  labelCls,
  errCls,
  statesList = [],
  isStateLoading = false,
  isCityLoading = false,
}: DynamicFieldProps) {
  const required = isFieldRequired(config, context);

  // Determine styling based on context if not explicitly provided
  const resolvedInputCls =
    inputCls ||
    (context === "profile"
      ? defaultProfileInputCls
      : context === "edit-user"
        ? defaultEditInputCls
        : defaultStep2InputCls);

  // Profile read-only mode rendering
  if (context === "profile" && !isEditing) {
    return (
      <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {config.label}
        </Label>
        <div className="md:col-span-2">
          {renderProfileReadOnlyValue({
            config,
            form,
            selectedStateId,
            selectedCityName,
            isPresent,
            statesList,
            isStateLoading,
            isCityLoading,
          })}
        </div>
      </div>
    );
  }

  // Profile edit mode grid layout wrapper
  if (context === "profile") {
    return (
      <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {config.label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div className="md:col-span-2">
          <RenderFieldInput
            config={config}
            form={form}
            context={context}
            disabled={disabled}
            required={required}
            selectedStateId={selectedStateId}
            onStateSelect={onStateSelect}
            selectedCityName={selectedCityName}
            onCitySelect={onCitySelect}
            isPresent={isPresent}
            onPresentChange={onPresentChange}
            resolvedInputCls={resolvedInputCls}
            errCls={errCls}
            statesList={statesList}
            isStateLoading={isStateLoading}
            isCityLoading={isCityLoading}
          />
        </div>
      </div>
    );
  }

  // Standard form rendering (add-user, edit-user, register, select-role)
  const isGridFull = config.gridSpan === "full";

  const resolvedLabelCls =
    labelCls ||
    (context === "register" || context === "select-role"
      ? "text-[18px] font-medium text-[#1F2A44] font-asap mb-2 block"
      : "");

  return (
    <FormField
      control={form.control}
      name={config.name}
      render={({ field }) => (
        <FormItem className={isGridFull ? "md:col-span-2" : ""}>
          {config.type !== "checkbox" && (
            <FormLabel className={resolvedLabelCls}>
              {config.label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <FieldInputContent
              config={config}
              field={field}
              form={form}
              context={context}
              disabled={disabled}
              selectedStateId={selectedStateId}
              onStateSelect={onStateSelect}
              selectedCityName={selectedCityName}
              onCitySelect={onCitySelect}
              isPresent={isPresent}
              onPresentChange={onPresentChange}
              resolvedInputCls={resolvedInputCls}
              statesList={statesList}
              isStateLoading={isStateLoading}
              isCityLoading={isCityLoading}
            />
          </FormControl>
          <FormMessage className={errCls} />
        </FormItem>
      )}
    />
  );
}

function RenderFieldInput({
  config,
  form,
  context,
  disabled,
  required,
  selectedStateId,
  onStateSelect,
  selectedCityName,
  onCitySelect,
  isPresent,
  onPresentChange,
  resolvedInputCls,
  errCls,
  statesList,
  isStateLoading,
  isCityLoading,
}: {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  context: FormContext;
  disabled?: boolean;
  required?: boolean;
  selectedStateId?: string;
  onStateSelect?: (stateId: string) => void;
  selectedCityName?: string;
  onCitySelect?: (cityId: string, cityName?: string) => void;
  isPresent?: boolean;
  onPresentChange?: (checked: boolean) => void;
  resolvedInputCls: string;
  errCls?: string;
  statesList?: { id: string; name: string }[];
  isStateLoading?: boolean;
  isCityLoading?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={config.name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <FieldInputContent
              config={config}
              field={field}
              form={form}
              context={context}
              disabled={disabled}
              selectedStateId={selectedStateId}
              onStateSelect={onStateSelect}
              selectedCityName={selectedCityName}
              onCitySelect={onCitySelect}
              isPresent={isPresent}
              onPresentChange={onPresentChange}
              resolvedInputCls={resolvedInputCls}
              statesList={statesList}
              isStateLoading={isStateLoading}
              isCityLoading={isCityLoading}
            />
          </FormControl>
          <FormMessage className={errCls} />
        </FormItem>
      )}
    />
  );
}

function FieldInputContent({
  config,
  field,
  form,
  context,
  disabled,
  selectedStateId,
  onStateSelect,
  selectedCityName,
  onCitySelect,
  isPresent,
  onPresentChange,
  resolvedInputCls,
  statesList,
  isStateLoading,
  isCityLoading,
}: {
  config: RoleFieldConfig;
  field: any;
  form: UseFormReturn<any>;
  context: FormContext;
  disabled?: boolean;
  selectedStateId?: string;
  onStateSelect?: (stateId: string) => void;
  selectedCityName?: string;
  onCitySelect?: (cityId: string, cityName?: string) => void;
  isPresent?: boolean;
  onPresentChange?: (checked: boolean) => void;
  resolvedInputCls: string;
  statesList?: { id: string; name: string }[];
  isStateLoading?: boolean;
  isCityLoading?: boolean;
}) {
  const currentFormStateId = form.watch("state_id") || selectedStateId || "";

  switch (config.type) {
    case "phone":
      return (
        <Input
          placeholder={config.placeholder}
          {...field}
          value={field.value || ""}
          disabled={disabled}
          maxLength={config.maxLength || 10}
          inputMode="numeric"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            field.onChange(digits);
          }}
          className={resolvedInputCls}
        />
      );

    case "state":
      return (
        <DynamicStateSelect
          field={field}
          form={form}
          config={config}
          context={context}
          disabled={disabled}
          statesList={statesList}
          isStateLoading={isStateLoading}
          resolvedInputCls={resolvedInputCls}
          onStateSelect={onStateSelect}
          onCitySelect={onCitySelect}
        />
      );

    case "city":
      return (
        <DynamicCitySelect
          field={field}
          form={form}
          config={config}
          context={context}
          disabled={disabled}
          selectedStateId={selectedStateId}
          selectedCityName={selectedCityName}
          isCityLoading={isCityLoading}
          resolvedInputCls={resolvedInputCls}
          onStateSelect={onStateSelect}
          onCitySelect={onCitySelect}
        />
      );

    case "service":
      return (
        <ServiceSelect
          value={field.value || []}
          onChange={field.onChange}
          disabled={disabled}
          variant={
            context === "register" || context === "select-role"
              ? "button"
              : context === "profile"
                ? "badge"
                : "checkbox"
          }
          className={context === "edit-user" ? "md:col-span-2" : undefined}
        />
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`chk-${config.name}`}
            checked={isPresent}
            disabled={disabled}
            onCheckedChange={(checked) => {
              const isChecked = Boolean(checked);
              if (onPresentChange) onPresentChange(isChecked);
              field.onChange(isChecked);
              form.setValue("present", isChecked);
              if (isChecked) {
                form.setValue("ownerDateEnd", "");
              }
            }}
          />
          <label
            htmlFor={`chk-${config.name}`}
            className="text-sm font-medium leading-none cursor-pointer select-none"
          >
            {config.label}
          </label>
        </div>
      );

    case "date":
      if (config.name === "ownerDateEnd") {
        const ownerStartDate =
          form?.watch?.("ownerDateStart") ||
          form?.getValues?.("ownerDateStart") ||
          "";
        const formattedMinDate = ownerStartDate
          ? String(ownerStartDate).split("T")[0]
          : undefined;

        return (
          <Input
            type={isPresent ? "text" : "date"}
            disabled={isPresent || disabled}
            min={isPresent ? undefined : formattedMinDate}
            value={isPresent ? "Present" : field.value || ""}
            onChange={(e) => field.onChange(e.target.value)}
            className={`${resolvedInputCls} ${
              isPresent ? "disabled:bg-muted/40 disabled:opacity-80" : ""
            }`}
          />
        );
      }
      if (config.name === "ownerDateStart") {
        return (
          <Input
            type="date"
            {...field}
            value={field.value || ""}
            disabled={disabled}
            onChange={(e) => {
              const newStartDate = e.target.value;
              field.onChange(newStartDate);
              const currentEndDate = form?.getValues?.("ownerDateEnd");
              if (
                currentEndDate &&
                currentEndDate !== "Present" &&
                newStartDate &&
                currentEndDate < newStartDate
              ) {
                form?.setValue?.("ownerDateEnd", "");
              }
            }}
            className={resolvedInputCls}
          />
        );
      }
      return (
        <Input
          type="date"
          {...field}
          value={field.value || ""}
          disabled={disabled}
          className={resolvedInputCls}
        />
      );

    default:
      return (
        <Input
          type={config.type === "email" ? "email" : "text"}
          placeholder={config.placeholder}
          {...field}
          value={field.value || ""}
          disabled={disabled}
          maxLength={config.maxLength}
          inputMode={config.inputMode}
          className={resolvedInputCls}
        />
      );
  }
}

function ServiceReadOnlyList({ serviceIds }: { serviceIds: string[] }) {
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getServiceProvided()
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          const map: Record<string, string> = {};
          res.data.forEach((s: any) => {
            if (s.id && s.service_name) {
              map[String(s.id)] = s.service_name;
            }
          });
          setServiceMap(map);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!serviceIds.length) {
    return (
      <span className="text-sm font-bold text-muted-foreground">
        Not provided
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Loading services...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 min-w-0">
      {serviceIds.map((item: string) => {
        const name = serviceMap[item] || item;
        return (
          <span
            key={item}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 break-words"
          >
            {toPascalCase(name)}
          </span>
        );
      })}
    </div>
  );
}

function renderProfileReadOnlyValue({
  config,
  form,
  selectedStateId,
  selectedCityName,
  isPresent,
  statesList,
  isStateLoading,
  isCityLoading,
}: {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  selectedStateId?: string;
  selectedCityName?: string;
  isPresent?: boolean;
  statesList: { id: string; name: string }[];
  isStateLoading?: boolean;
  isCityLoading?: boolean;
}) {
  const value = form.watch(config.name);

  if (config.name === "state_id") {
    if (isStateLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading state...</span>
        </div>
      );
    }
    const isUuid = (val: any) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      );
    const stateObj = statesList.find((s) => s.id === String(value));
    return (
      <p className="text-sm font-bold">
        {stateObj?.name || (value && !isUuid(value) ? value : "Not provided")}
      </p>
    );
  }

  if (config.name === "city_id") {
    if (isCityLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading city...</span>
        </div>
      );
    }
    return (
      <p className="text-sm font-bold">{selectedCityName || "Not provided"}</p>
    );
  }

  if (config.name === "ownerDateEnd") {
    const isPres =
      isPresent ||
      value === "Present" ||
      String(value)?.toLowerCase() === "present";
    return (
      <p className="text-sm font-bold">
        {isPres
          ? "Present"
          : value
            ? String(value).split("T")[0]
            : "Not provided"}
      </p>
    );
  }

  if (config.name === "ownerDateStart") {
    return (
      <p className="text-sm font-bold">
        {value ? String(value).split("T")[0] : "Not provided"}
      </p>
    );
  }

  if (config.name === "present") {
    return null; // Handled alongside dates in profile view
  }

  if (config.type === "service") {
    const serviceList = Array.isArray(value) ? value : [];
    return <ServiceReadOnlyList serviceIds={serviceList} />;
  }

  return <p className="text-sm font-bold">{value || "Not provided"}</p>;
}

function DynamicStateSelect({
  field,
  form,
  config,
  context,
  disabled,
  statesList,
  isStateLoading,
  resolvedInputCls,
  onStateSelect,
  onCitySelect,
}: {
  field: any;
  form: UseFormReturn<any>;
  config: RoleFieldConfig;
  context: FormContext;
  disabled?: boolean;
  statesList?: { id: string; name: string }[];
  isStateLoading?: boolean;
  resolvedInputCls: string;
  onStateSelect?: (stateId: string) => void;
  onCitySelect?: (cityId: string, cityName?: string) => void;
}) {
  const [internalStates, setInternalStates] = useState<
    { id: string; name: string }[]
  >([]);
  const [fetchingStates, setFetchingStates] = useState(false);

  useEffect(() => {
    if (statesList && statesList.length > 0) {
      setInternalStates(statesList);
      return;
    }
    let active = true;
    async function loadStates() {
      try {
        setFetchingStates(true);
        const response = await getStates(1, 1000);
        const raw: any[] = Array.isArray(response)
          ? response
          : response?.data || [];
        if (active) {
          setInternalStates(
            raw.map((s: any) => ({
              id: String(s.id),
              name: s.state_name || s.name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch states in DynamicField:", err);
      } finally {
        if (active) setFetchingStates(false);
      }
    }
    loadStates();
    return () => {
      active = false;
    };
  }, [statesList]);

  const availableStates =
    statesList && statesList.length > 0 ? statesList : internalStates;
  const isLoading = isStateLoading || fetchingStates;

  const options: SearchableSelectOption[] = [
    { id: "__none__", name: "None" },
    ...availableStates.map((s) => ({ id: s.id, name: s.name })),
  ];

  const triggerClassName = cn(
    "w-full justify-between font-normal",
    context === "register" || context === "select-role"
      ? "h-[65px] px-[19px] border border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] font-medium text-[#1F2A44] bg-white font-asap shadow-none hover:bg-white"
      : context === "profile"
        ? "h-11 rounded-xl bg-muted/30 border border-input shadow-none text-sm font-medium hover:bg-muted/40"
        : "h-11 rounded-md border border-input bg-muted/20 text-sm font-medium hover:bg-background",
    context === "edit-user" && resolvedInputCls,
  );

  const rawVal =
    field.value !== undefined && field.value !== null
      ? field.value
      : (form.watch(config.name) ?? form.watch("state_id") ?? "");
  const selectValue = rawVal === "__none__" ? "" : rawVal;

  return (
    <SearchableSelect
      options={options}
      value={selectValue}
      onValueChange={(val) => {
        const finalVal = val === "__none__" ? "" : val;
        field.onChange(finalVal);
        form.setValue(config.name, finalVal, { shouldValidate: true, shouldDirty: true });
        form.setValue("state_id", finalVal, { shouldValidate: true, shouldDirty: true });
        form.setValue("city_id", "", { shouldValidate: true, shouldDirty: true });
        if (onStateSelect) onStateSelect(finalVal);
        if (onCitySelect) onCitySelect("", "");
      }}
      placeholder={config.placeholder || "Select a state"}
      searchPlaceholder="Search state..."
      disabled={disabled}
      loading={isLoading}
      triggerClassName={triggerClassName}
    />
  );
}

function DynamicCitySelect({
  field,
  form,
  config,
  context,
  disabled,
  selectedStateId,
  selectedCityName,
  isCityLoading,
  resolvedInputCls,
  onStateSelect,
  onCitySelect,
}: {
  field: any;
  form: UseFormReturn<any>;
  config: RoleFieldConfig;
  context: FormContext;
  disabled?: boolean;
  selectedStateId?: string;
  selectedCityName?: string;
  isCityLoading?: boolean;
  resolvedInputCls: string;
  onStateSelect?: (stateId: string) => void;
  onCitySelect?: (cityId: string, cityName?: string) => void;
}) {
  const currentFormStateId = form.watch("state_id") || selectedStateId || "";
  const [cities, setCities] = useState<
    { id: string; name: string; state_id?: string }[]
  >([]);
  const [fetchingCities, setFetchingCities] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCities() {
      try {
        setFetchingCities(true);
        const stateParam =
          currentFormStateId && currentFormStateId !== "__none__"
            ? currentFormStateId
            : undefined;
        const response = await getCities(
          1,
          1000,
          undefined,
          undefined,
          stateParam,
        );
        const raw: any[] = Array.isArray(response)
          ? response
          : response?.data || [];
        if (active) {
          setCities(
            raw.map((c: any) => ({
              id: String(c.id),
              name: c.name || c.city_name,
              state_id: c.state_id ? String(c.state_id) : undefined,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch cities in DynamicField:", err);
      } finally {
        if (active) setFetchingCities(false);
      }
    }
    loadCities();
    return () => {
      active = false;
    };
  }, [currentFormStateId]);

  const isLoading = isCityLoading || fetchingCities;

  const options: SearchableSelectOption[] = [
    { id: "__none__", name: "None" },
    ...cities.map((c) => ({ id: c.id, name: c.name })),
  ];

  const triggerClassName = cn(
    "w-full justify-between font-normal",
    context === "register" || context === "select-role"
      ? "h-[65px] px-[19px] border border-[rgba(112,128,144,0.23)] rounded-[6px] text-[20px] font-medium text-[#1F2A44] bg-white font-asap shadow-none hover:bg-white"
      : context === "profile"
        ? "h-11 rounded-xl bg-muted/30 border border-input shadow-none text-sm font-medium hover:bg-muted/40"
        : "h-11 rounded-md border border-input bg-muted/20 text-sm font-medium hover:bg-background",
    context === "edit-user" && resolvedInputCls,
  );

  const rawVal =
    field.value !== undefined && field.value !== null
      ? field.value
      : (form.watch(config.name) ?? form.watch("city_id") ?? "");
  const selectValue = rawVal === "__none__" ? "" : rawVal;

  return (
    <SearchableSelect
      options={options}
      value={selectValue}
      displayValueFallback={selectValue ? selectedCityName : undefined}
      onValueChange={(val) => {
        const finalVal = val === "__none__" ? "" : val;
        field.onChange(finalVal);
        form.setValue(config.name, finalVal, { shouldValidate: true, shouldDirty: true });
        form.setValue("city_id", finalVal, { shouldValidate: true, shouldDirty: true });
        const foundCity = cities.find((c) => c.id === finalVal);
        if (!currentFormStateId && foundCity?.state_id) {
          const stateIdStr = String(foundCity.state_id);
          form.setValue("state_id", stateIdStr, { shouldValidate: true, shouldDirty: true });
          if (onStateSelect) onStateSelect(stateIdStr);
        }
        if (onCitySelect) onCitySelect(finalVal, foundCity?.name || "");
      }}
      placeholder={config.placeholder || "Select a city"}
      searchPlaceholder="Search city..."
      disabled={disabled}
      loading={isLoading}
      emptyMessage={isLoading ? "Loading cities..." : "No cities found"}
      triggerClassName={triggerClassName}
    />
  );
}
