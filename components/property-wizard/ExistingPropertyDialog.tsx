"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExistingProperty, GooglePlaceFlags } from "@/lib/actions";

interface ExistingPropertyDialogProps {
  open: boolean;
  flags?: GooglePlaceFlags | null;
  existingProperties: ExistingProperty[];
  selectedProperty?: {
    address: string;
    address2?: string | null;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  isEdit?: boolean;
  onCancel: () => void;
  onKeep?: () => void;
}

export function ExistingPropertyDialog({
  open,
  flags,
  existingProperties,
  selectedProperty,
  isEdit,
  onCancel,
  onKeep,
}: ExistingPropertyDialogProps) {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  useEffect(() => {
    if (existingProperties && existingProperties.length > 0) {
      const exactMatch = existingProperties.find((p) => p.is_exact_match);
      setSelectedPropertyId(
        exactMatch ? exactMatch.id : existingProperties[0].id,
      );
    } else {
      setSelectedPropertyId("");
    }
  }, [existingProperties, open]);

  const handleEdit = () => {
    if (!selectedPropertyId) return;
    router.push(`/properties/edit/${selectedPropertyId}?mode=address`);
  };

  const toBool = (val: any) =>
    val === true || val === "true" || val === 1 || val === "1";

  const alreadyExists = toBool(flags?.already_exists);
  const isDifferentCity = toBool(flags?.is_different_city);
  const hasExactMatch = existingProperties.some((p) =>
    toBool(p.is_exact_match),
  );

  // If the address exists in a different city (or no exact match in current city):
  const isDifferentCityOnly =
    isDifferentCity ||
    (!alreadyExists && !hasExactMatch && existingProperties.length > 0);

  // In edit mode, user cannot add property - they can only edit
  const canAddProperty = isDifferentCityOnly;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="w-[calc(100vw-24px)] max-w-[540px] max-h-[90dvh] flex flex-col rounded-2xl p-4 sm:p-6 md:p-8 font-asap overflow-hidden">
        <DialogHeader className="items-center text-center space-y-1.5 sm:space-y-2 shrink-0">
          <div className="size-11 sm:size-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle className="size-5 sm:size-7 text-amber-500" />
          </div>
          <DialogTitle className="text-[17px] sm:text-[20px] md:text-[22px] font-bold text-[#1F2A44] leading-snug">
            {canAddProperty
              ? "Address Exists for Another City"
              : "Property Already Exists"}
          </DialogTitle>
          <DialogDescription className="text-[12px] sm:text-[14px] text-[#708090] leading-relaxed">
            {canAddProperty
              ? "The selected property with this city is new, but the same address already exists in a different city. Do you want to add this property or edit the existing one?"
              : "This address already exists in our system. You can only edit the existing property."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 my-2 flex-1 max-h-[50dvh] sm:max-h-[380px] overflow-y-auto pr-1">
          {/* Section 1: This is the property you selected */}
          {selectedProperty && (
            <div className="space-y-1.5">
              <span className="text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#1CA7A6] flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 sm:size-4" />
                This is the property you selected
              </span>
              <div className="p-3 sm:p-3.5 rounded-[10px] border border-[#1CA7A6]/40 bg-[#1CA7A6]/5 flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                  <div className="mt-0.5 shrink-0 text-[#1CA7A6]">
                    <Building2 className="size-4.5 sm:size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-[#1F2A44] break-words line-clamp-2">
                      {selectedProperty.address}
                      {selectedProperty.address2
                        ? `, ${selectedProperty.address2}`
                        : ""}
                    </p>
                    <p className="text-[11px] sm:text-[12px] md:text-[13px] text-[#708090] break-words flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-slate-400 shrink-0" />
                      {[
                        selectedProperty.city,
                        selectedProperty.state,
                        selectedProperty.zip,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                {canAddProperty && (
                  <Button
                    type="button"
                    onClick={onKeep}
                    className="w-full h-10 sm:h-[46px] rounded-[10px] bg-[#1CA7A6] hover:bg-[#188F8E] text-white font-bold text-[13px] sm:text-[14px] md:text-[15px] font-asap shadow-md hover:shadow-lg transition-all cursor-pointer mt-1 sm:mt-1.5"
                  >
                    Keep This Property
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Existing Properties in DB */}
          {existingProperties && existingProperties.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-wider text-[#708090] flex items-center gap-1.5">
                <Building2 className="size-3.5 sm:size-4" />
                Existing Properties in System
              </span>
              <div className="space-y-2">
                {existingProperties.map((p) => {
                  const isSelected = selectedPropertyId === p.id;
                  const isExact = toBool(p.is_exact_match);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-[10px] border transition-all cursor-pointer flex items-start gap-2.5 sm:gap-3 select-none text-left active:scale-[0.99]",
                        isSelected
                          ? "border-[#1CA7A6] bg-white shadow-sm ring-1 ring-[#1CA7A6]"
                          : isExact
                            ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50",
                      )}
                    >
                      <div className="mt-0.5 shrink-0 text-slate-500">
                        <Building2 className="size-4 sm:size-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <p className="text-[12px] sm:text-[13px] md:text-[14px] font-semibold text-[#1F2A44] break-words line-clamp-2">
                            {p.address}
                            {p.address2 ? `, ${p.address2}` : ""}
                          </p>
                          {isExact ? (
                            <span className="shrink-0 text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                              Exact Match
                            </span>
                          ) : (
                            <span className="shrink-0 text-[9px] sm:text-[10px] md:text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                              Different City
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-[12px] md:text-[13px] text-[#708090] break-words flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 text-slate-400 shrink-0" />
                          {[p.city_name, p.state_name, p.zip]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="mt-1 shrink-0">
                        <div
                          className={cn(
                            "size-4 rounded-full border flex items-center justify-center transition-all",
                            isSelected
                              ? "border-[#1CA7A6]"
                              : "border-slate-300",
                          )}
                        >
                          {isSelected && (
                            <div className="size-2 rounded-full bg-[#1CA7A6]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 mt-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:flex-1 h-11 sm:h-[46px] rounded-[10px] border-[#708090]/40 text-[#708090] font-bold text-[13px] sm:text-[14px] md:text-[15px] font-asap hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleEdit}
            disabled={!selectedPropertyId}
            className="w-full sm:flex-1 h-11 sm:h-[46px] rounded-[10px] bg-[#1CA7A6] hover:bg-[#188F8E] text-white font-bold text-[13px] sm:text-[14px] md:text-[15px] font-asap shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Edit Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
