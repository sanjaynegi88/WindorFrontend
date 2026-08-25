"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  getRoleFields,
  FormContext,
  RoleFieldConfig,
  getRoleGroup,
} from "@/lib/user-role-fields";
import { DynamicField } from "@/components/user-fields/DynamicField";

export interface RoleFormProps {
  role?: string | null;
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
  isCityLoading?: boolean;
}

export function RoleForm({
  role,
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
}: RoleFormProps) {
  const fields = getRoleFields(role);

  if (!fields || fields.length === 0) {
    return null;
  }

  const group = getRoleGroup(role);

  // Layout wrapper for profile vs standard form
  if (context === "profile") {
    return (
      <div className="divide-y">
        {fields.map((config) => (
          <DynamicField
            key={config.name}
            config={config}
            form={form}
            context={context}
            isEditing={isEditing}
            disabled={disabled}
            selectedStateId={selectedStateId}
            onStateSelect={onStateSelect}
            selectedCityName={selectedCityName}
            onCitySelect={onCitySelect}
            isPresent={isPresent}
            onPresentChange={onPresentChange}
            inputCls={inputCls}
            labelCls={labelCls}
            errCls={errCls}
            statesList={statesList}
            isCityLoading={isCityLoading}
          />
        ))}
      </div>
    );
  }

  // Layout for Add User, Edit User, Registration, Select Role
  const gridContainerCls =
    context === "edit-user"
      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
      : context === "add-user"
      ? "space-y-5"
      : "space-y-5";

  return (
    <div className={gridContainerCls}>
      {fields.map((config) => {
        // Special grouping / grid layout handling for Add User / Step 2
        if (config.name === "mobilePhone" && fields.some((f) => f.name === "companyPhone")) {
          // If in add-user/step2, phone numbers are grouped in a 2-col grid
          if (context === "add-user") {
            const companyPhoneConfig = fields.find((f) => f.name === "companyPhone");
            return (
              <div key="phones-group" className="grid grid-cols-2 gap-4">
                <DynamicField
                  config={config}
                  form={form}
                  context={context}
                  disabled={disabled}
                  selectedStateId={selectedStateId}
                  onStateSelect={onStateSelect}
                  selectedCityName={selectedCityName}
                  onCitySelect={onCitySelect}
                  isPresent={isPresent}
                  onPresentChange={onPresentChange}
                  inputCls={inputCls}
                  labelCls={labelCls}
                  errCls={errCls}
                />
                {companyPhoneConfig && (
                  <DynamicField
                    config={companyPhoneConfig}
                    form={form}
                    context={context}
                    disabled={disabled}
                    selectedStateId={selectedStateId}
                    onStateSelect={onStateSelect}
                    selectedCityName={selectedCityName}
                    onCitySelect={onCitySelect}
                    isPresent={isPresent}
                    onPresentChange={onPresentChange}
                    inputCls={inputCls}
                    labelCls={labelCls}
                    errCls={errCls}
                  />
                )}
              </div>
            );
          }
        }

        if (config.name === "companyPhone" && context === "add-user" && fields.some((f) => f.name === "mobilePhone")) {
          // Already rendered in group above
          return null;
        }

        if (config.name === "ownerDateStart" && fields.some((f) => f.name === "ownerDateEnd")) {
          const ownerEndConfig = fields.find((f) => f.name === "ownerDateEnd");
          const presentConfig = fields.find((f) => f.name === "present");

          if (context === "add-user") {
            return (
              <React.Fragment key="dates-group">
                <div className="grid grid-cols-2 gap-4">
                  <DynamicField
                    config={config}
                    form={form}
                    context={context}
                    disabled={disabled}
                    inputCls={inputCls}
                    labelCls={labelCls}
                    errCls={errCls}
                  />
                  {ownerEndConfig && (
                    <DynamicField
                      config={ownerEndConfig}
                      form={form}
                      context={context}
                      disabled={disabled}
                      isPresent={isPresent}
                      inputCls={inputCls}
                      labelCls={labelCls}
                      errCls={errCls}
                    />
                  )}
                </div>
                {presentConfig && (
                  <DynamicField
                    config={presentConfig}
                    form={form}
                    context={context}
                    disabled={disabled}
                    isPresent={isPresent}
                    onPresentChange={onPresentChange}
                    inputCls={inputCls}
                    labelCls={labelCls}
                    errCls={errCls}
                  />
                )}
              </React.Fragment>
            );
          }

          if (context === "register" || context === "select-role") {
            return (
              <div key="dates-group-reg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DynamicField
                    config={config}
                    form={form}
                    context={context}
                    disabled={disabled}
                    inputCls={inputCls}
                    labelCls={labelCls}
                    errCls={errCls}
                  />
                  {ownerEndConfig && (
                    <DynamicField
                      config={ownerEndConfig}
                      form={form}
                      context={context}
                      disabled={disabled}
                      isPresent={isPresent}
                      inputCls={inputCls}
                      labelCls={labelCls}
                      errCls={errCls}
                    />
                  )}
                </div>
                {presentConfig && (
                  <DynamicField
                    config={presentConfig}
                    form={form}
                    context={context}
                    disabled={disabled}
                    isPresent={isPresent}
                    onPresentChange={onPresentChange}
                    inputCls={inputCls}
                    labelCls={labelCls}
                    errCls={errCls}
                  />
                )}
              </div>
            );
          }
        }

        if ((config.name === "ownerDateEnd" || config.name === "present") && (context === "add-user" || context === "register" || context === "select-role") && fields.some((f) => f.name === "ownerDateStart")) {
          // Already rendered in group above
          return null;
        }

        return (
          <DynamicField
            key={config.name}
            config={config}
            form={form}
            context={context}
            isEditing={isEditing}
            disabled={disabled}
            selectedStateId={selectedStateId}
            onStateSelect={onStateSelect}
            selectedCityName={selectedCityName}
            onCitySelect={onCitySelect}
            isPresent={isPresent}
            onPresentChange={onPresentChange}
            inputCls={inputCls}
            labelCls={labelCls}
            errCls={errCls}
            statesList={statesList}
            isCityLoading={isCityLoading}
          />
        );
      })}
    </div>
  );
}
