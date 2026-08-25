"use client";

import React from "react";
import { Control, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormFieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "checkbox";

export interface SelectOption {
  label: string;
  value: string;
}

export interface DynamicFieldConfig<TFieldValues extends FieldValues = any> {
  name: FieldPath<TFieldValues>;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  rows?: number;
  className?: string;
  inputClassName?: string;
  /** Roles for which this field should be rendered. If undefined, visible for all roles. */
  roles?: string[];
  /** Static select options or a dynamic function that receives targetRole */
  options?: SelectOption[] | ((targetRole: string) => SelectOption[]);
  /** Callback to evaluate if field should be disabled based on current form values */
  isDisabled?: (values: TFieldValues) => boolean;
  /** Custom render function for edge case fields */
  renderCustom?: (form: UseFormReturn<TFieldValues>) => React.ReactNode;
}

// ----------------------------------------------------------------------
// Reusable Input Field Primitive
// ----------------------------------------------------------------------
export interface FormInputFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function FormInputField<TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  disabled,
  className,
  inputClassName,
}: FormInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="font-semibold text-foreground">
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ""}
              disabled={disabled}
              className={cn(
                "h-12 border-input focus:bg-background transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
                inputClassName
              )}
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold" />
        </FormItem>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Reusable Textarea Field Primitive
// ----------------------------------------------------------------------
export interface FormTextareaFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function FormTextareaField<TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  placeholder,
  rows = 4,
  disabled,
  className,
  inputClassName,
}: FormTextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="font-semibold text-foreground">
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              value={field.value ?? ""}
              disabled={disabled}
              className={cn(
                "border-input transition-all shadow-none font-bold resize-none disabled:opacity-50 disabled:cursor-not-allowed",
                inputClassName
              )}
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold" />
        </FormItem>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Reusable Select Field Primitive
// ----------------------------------------------------------------------
export interface FormSelectFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function FormSelectField<TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
  className,
  inputClassName,
}: FormSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="font-semibold text-foreground">
              {label}
            </FormLabel>
          )}
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  "h-12 border-input focus:bg-background transition-all shadow-none",
                  inputClassName
                )}
              >
                <SelectValue placeholder={placeholder || `Select ${label}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-[10px] font-bold" />
        </FormItem>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Reusable Checkbox Field Primitive
// ----------------------------------------------------------------------
export interface FormCheckboxFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckboxField<TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  disabled,
  className,
}: FormCheckboxFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-center gap-2 space-y-0", className)}>
          <FormLabel className="font-semibold text-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold" />
        </FormItem>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Single Dynamic Field Router Component
// ----------------------------------------------------------------------
export function CustomFormField<TFieldValues extends FieldValues = any>({
  config,
  control,
  disabled,
  options,
}: {
  config: DynamicFieldConfig<TFieldValues>;
  control: Control<TFieldValues>;
  disabled?: boolean;
  options?: SelectOption[];
}) {
  switch (config.type) {
    case "text":
    case "number":
      return (
        <FormInputField
          control={control}
          name={config.name}
          label={config.label}
          type={config.type}
          placeholder={config.placeholder}
          disabled={disabled}
          className={config.className}
          inputClassName={config.inputClassName}
        />
      );
    case "textarea":
      return (
        <FormTextareaField
          control={control}
          name={config.name}
          label={config.label}
          placeholder={config.placeholder}
          rows={config.rows}
          disabled={disabled}
          className={config.className}
          inputClassName={config.inputClassName}
        />
      );
    case "select":
      return (
        <FormSelectField
          control={control}
          name={config.name}
          label={config.label}
          placeholder={config.placeholder}
          options={options || []}
          disabled={disabled}
          className={config.className}
          inputClassName={config.inputClassName}
        />
      );
    case "checkbox":
      return (
        <FormCheckboxField
          control={control}
          name={config.name}
          label={config.label}
          disabled={disabled}
          className={config.className}
        />
      );
    default:
      return null;
  }
}

// ----------------------------------------------------------------------
// Dynamic Form Fields List Renderer Component
// ----------------------------------------------------------------------
interface DynamicFormFieldsProps<TFieldValues extends FieldValues = any> {
  fields: DynamicFieldConfig<TFieldValues>[];
  form: UseFormReturn<TFieldValues>;
  targetRole?: string;
  gridClassName?: string;
}

export function DynamicFormFields<TFieldValues extends FieldValues = any>({
  fields,
  form,
  targetRole,
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-8",
}: DynamicFormFieldsProps<TFieldValues>) {
  const formValues = form.watch();

  const visibleFields = fields.filter((field) => {
    if (!field.roles) return true;
    if (!targetRole) return false;
    return field.roles.includes(targetRole);
  });

  if (visibleFields.length === 0) return null;

  return (
    <div className={gridClassName}>
      {visibleFields.map((fieldConfig) => {
        if (fieldConfig.renderCustom) {
          return (
            <React.Fragment key={fieldConfig.name}>
              {fieldConfig.renderCustom(form)}
            </React.Fragment>
          );
        }

        const isDisabled = fieldConfig.isDisabled
          ? fieldConfig.isDisabled(formValues)
          : false;

        const options =
          typeof fieldConfig.options === "function"
            ? fieldConfig.options(targetRole || "")
            : fieldConfig.options || [];

        return (
          <CustomFormField
            key={fieldConfig.name}
            config={fieldConfig}
            control={form.control}
            disabled={isDisabled}
            options={options}
          />
        );
      })}
    </div>
  );
}
