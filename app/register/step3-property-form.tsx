"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CitySelect } from "@/components/city-zip-selector";
import { getStates } from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  propertyAddress: z.string().min(1, { message: "Property address is required" }),
  mobilePhone: z.string().min(1, { message: "Mobile phone is required" })
    .regex(/^\d{10}$/, { message: "Must be exactly 10 digits" }),
  ownerDateStart: z.string().min(1, { message: "Start date is required" }),
  ownerDateEnd: z.string().optional(),
  state_id: z.string().min(1, { message: "State is required" }),
  city_id: z.string().min(1, { message: "City is required" }),
  zip: z.string().min(1, { message: "Zip code is required" }),
});

export type Step2PropertyValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSubmit: (values: Step2PropertyValues) => void;
  loading: boolean;
}

const inputCls =
  "h-[46px] w-full px-4 bg-white rounded-[4px] font-inter text-[15px] text-[#1F2A44] outline-none placeholder:text-gray-400";

const selectTriggerCls =
  "mt-1 h-[46px] w-full px-4 bg-white rounded-[4px] border-0 font-inter text-[15px] text-[#1F2A44] shadow-none [&>span]:text-gray-400 data-[placeholder]:text-gray-400";

export function NewRegisterStep3Property({ onBack, onSubmit, loading }: Props) {
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  useEffect(() => {
    getStates(1, 1000)
      .then((res) => {
        const raw: any[] = Array.isArray(res) ? res : res?.data || [];
        setStates(raw.map((s: any) => ({ id: String(s.id), name: s.state_name || s.name })));
      })
      .catch(() => { });
  }, []);

  const form = useForm<Step2PropertyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyAddress: "",
      mobilePhone: "",
      ownerDateStart: "",
      ownerDateEnd: "",
      state_id: "",
      city_id: "",
      zip: "",
    },
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

        <FormField control={form.control} name="propertyAddress" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Property Address</label>
            <FormControl>
              <input {...field} className={`mt-1 ${inputCls}`} />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <FormField control={form.control} name="mobilePhone" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Phone (Direct)</label>
            <FormControl>
              <input
                {...field}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={`mt-1 ${inputCls}`}
              />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        {/* State */}
        <FormField control={form.control} name="state_id" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">State</label>
            <Select
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                setSelectedStateId(val);
                // Clear city when state changes
                form.setValue("city_id", "");
                setSelectedCityId("");
              }}
            >
              <FormControl>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        <FormField control={form.control} name="city_id" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">City</label>
            <FormControl>
              <div className="mt-1 [&_button]:h-[46px]! [&_button]:rounded-[4px] [&_button]:border-0 [&_button]:bg-white [&_button]:text-[#1F2A44] [&_button]:text-[15px] [&_button]:font-inter [&_button]:shadow-none [&_button_span]:text-gray-400 [&_button_.text-muted-foreground]:text-gray-400">
                <CitySelect
                  value={field.value}
                  stateValue={selectedStateId}
                  valueType="id"
                  onSelectCity={(city) => {
                    field.onChange(city.id);
                    setSelectedCityId(city.id);
                    if (!selectedStateId && city.state_id) {
                      form.setValue("state_id", city.state_id);
                      setSelectedStateId(city.state_id);
                    }
                  }}
                  syncState={true}
                />
              </div>
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        {/* Zip Code — plain input */}
        <FormField control={form.control} name="zip" render={({ field }) => (
          <FormItem>
            <label className="text-sm font-semibold text-white font-inter">Zip Code</label>
            <FormControl>
              <input
                {...field}
                inputMode="numeric"
                maxLength={10}
                className={`mt-1 ${inputCls}`}
              />
            </FormControl>
            <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
          </FormItem>
        )} />

        {/* Owner Dates */}
        <div>
          <label className="text-sm font-semibold text-white font-inter mb-2 block">Owner Dates</label>
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="ownerDateStart" render={({ field }) => (
              <FormItem>
                <label className="text-xs text-white/70 font-inter">Start Date</label>
                <FormControl>
                  <input type="date" {...field} className={`mt-1 ${inputCls} text-[#708090]`} />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
              </FormItem>
            )} />
            <FormField control={form.control} name="ownerDateEnd" render={({ field }) => (
              <FormItem>
                <label className="text-xs text-white/70 font-inter">End Date</label>
                <FormControl>
                  <input type="date" {...field} className={`mt-1 ${inputCls} text-[#708090]`} />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-red-200 mt-1" />
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onBack} disabled={loading}
            className="flex-1 py-3.5 bg-transparent border-2 border-white text-white rounded-[6px] font-inter text-base font-semibold hover:bg-white/10 transition-all">
            Back
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3.5 bg-[#1F2A44] text-white rounded-[6px] font-inter text-base font-semibold hover:bg-[#132036] transition-all disabled:opacity-70">
            {loading ? "Creating..." : "Register"}
          </button>
        </div>
      </form>
    </Form>
  );
}
