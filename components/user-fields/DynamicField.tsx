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
import { StateSelect, CitySelect } from "@/components/city-zip-selector";
import { ServiceSelect } from "@/components/service-select";
import { RoleFieldConfig, FormContext, isFieldRequired } from "@/lib/user-role-fields";
import { Loader2 } from "lucide-react";
import { getServiceProvided } from "@/lib/actions";
import { toPascalCase } from "@/lib/utils";

export interface DynamicFieldProps {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  context: FormContext;
  isEditing?: boolean; // For profile page read-only vs edit toggle
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
            onCitySelect={onCitySelect}
            isPresent={isPresent}
            onPresentChange={onPresentChange}
            resolvedInputCls={resolvedInputCls}
            errCls={errCls}
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
              onCitySelect={onCitySelect}
              isPresent={isPresent}
              onPresentChange={onPresentChange}
              resolvedInputCls={resolvedInputCls}
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
  onCitySelect,
  isPresent,
  onPresentChange,
  resolvedInputCls,
  errCls,
}: {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  context: FormContext;
  disabled?: boolean;
  required?: boolean;
  selectedStateId?: string;
  onStateSelect?: (stateId: string) => void;
  onCitySelect?: (cityId: string, cityName?: string) => void;
  isPresent?: boolean;
  onPresentChange?: (checked: boolean) => void;
  resolvedInputCls: string;
  errCls?: string;
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
              onCitySelect={onCitySelect}
              isPresent={isPresent}
              onPresentChange={onPresentChange}
              resolvedInputCls={resolvedInputCls}
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
  onCitySelect,
  isPresent,
  onPresentChange,
  resolvedInputCls,
}: {
  config: RoleFieldConfig;
  field: any;
  form: UseFormReturn<any>;
  context: FormContext;
  disabled?: boolean;
  selectedStateId?: string;
  onStateSelect?: (stateId: string) => void;
  onCitySelect?: (cityId: string, cityName?: string) => void;
  isPresent?: boolean;
  onPresentChange?: (checked: boolean) => void;
  resolvedInputCls: string;
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
        <div className={context === "register" || context === "select-role" ? "[&_button]:h-[65px] [&_button]:rounded-[6px] [&_button]:border-[rgba(112,128,144,0.23)] [&_button]:text-[20px] [&_button]:font-asap [&_button]:font-medium [&_button]:text-[#708090] [&_button]:shadow-none [&_button]:bg-white" : context === "profile" ? "[&_button]:h-11 [&_button]:rounded-xl [&_button]:bg-muted/30 [&_button]:border-input [&_button]:shadow-none" : ""}>
          <StateSelect
            value={field.value || ""}
            valueType="id"
            disabled={disabled}
            placeholder={config.placeholder || "Select a state"}
            className={context === "edit-user" ? resolvedInputCls : undefined}
            onSelectState={(st) => {
              field.onChange(st.id);
              form.setValue("state_id", st.id);
              form.setValue("city_id", "");
              if (onStateSelect) onStateSelect(st.id);
            }}
          />
        </div>
      );

    case "city":
      return (
        <div className={context === "register" || context === "select-role" ? "[&_button]:h-[65px] [&_button]:rounded-[6px] [&_button]:border-[rgba(112,128,144,0.23)] [&_button]:text-[20px] [&_button]:font-asap [&_button]:font-medium [&_button]:text-[#708090] [&_button]:shadow-none [&_button]:bg-white" : context === "profile" ? "[&_button]:h-11 [&_button]:rounded-xl [&_button]:bg-muted/30 [&_button]:border-input [&_button]:shadow-none" : ""}>
          <CitySelect
            value={field.value || ""}
            stateValue={currentFormStateId}
            valueType="id"
            disabled={disabled}
            placeholder={config.placeholder || "Select a city"}
            syncState={true}
            onSelectCity={(city) => {
              const cityIdStr = String(city.id);
              field.onChange(cityIdStr);
              form.setValue("city_id", cityIdStr);
              if (!currentFormStateId && city.state_id) {
                const stateIdStr = String(city.state_id);
                form.setValue("state_id", stateIdStr);
                if (onStateSelect) onStateSelect(stateIdStr);
              }
              if (onCitySelect) onCitySelect(cityIdStr, city.name);
            }}
          />
        </div>
      );

    case "service":
      return (
        <ServiceSelect
          value={field.value || []}
          onChange={field.onChange}
          disabled={disabled}
          variant={context === "register" || context === "select-role" ? "button" : context === "profile" ? "badge" : "checkbox"}
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
        return (
          <Input
            type={isPresent ? "text" : "date"}
            disabled={isPresent || disabled}
            value={isPresent ? "Present" : field.value || ""}
            onChange={(e) => field.onChange(e.target.value)}
            className={`${resolvedInputCls} ${
              isPresent ? "disabled:bg-muted/40 disabled:opacity-80" : ""
            }`}
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
    return <span className="text-sm font-bold text-muted-foreground">Not provided</span>;
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
  isCityLoading,
}: {
  config: RoleFieldConfig;
  form: UseFormReturn<any>;
  selectedStateId?: string;
  selectedCityName?: string;
  isPresent?: boolean;
  statesList: { id: string; name: string }[];
  isCityLoading?: boolean;
}) {
  const value = form.watch(config.name);

  if (config.name === "state_id") {
    const stateObj = statesList.find((s) => s.id === String(value));
    return (
      <p className="text-sm font-bold">
        {stateObj?.name || value || "Not provided"}
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
      <p className="text-sm font-bold">
        {selectedCityName || "Not provided"}
      </p>
    );
  }

  if (config.name === "ownerDateEnd") {
    const isPres =
      isPresent ||
      value === "Present" ||
      String(value)?.toLowerCase() === "present";
    return (
      <p className="text-sm font-bold">
        {isPres ? "Present" : value ? String(value).split("T")[0] : "Not provided"}
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

  return (
    <p className="text-sm font-bold">
      {value || "Not provided"}
    </p>
  );
}
