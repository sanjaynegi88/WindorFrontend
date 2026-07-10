'use client';

import React from 'react';
// import { useFieldArray, Control } from 'react-hook-form';
import { useFieldArray, Control, FieldValues, ArrayPath } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';


// interface DynamicFeaturesTableProps {
//     control: Control<any>;
//     name: string;
//     title?: string;
//     nameLabel?: string;
//     valueLabel?: string;
//     namePlaceholder?: string;
//     valuePlaceholder?: string;
//     addButtonText?: string;
//     minItems?: number;
// }

// export function DynamicFeaturesTable({
//     control,
//     name,
//     title = "Features",
//     namePlaceholder = "Field name (e.g. Max Properties)",
//     valuePlaceholder = "Value (e.g. 10, true, Unlimited)",
//     addButtonText = "Add New Feature Line",
// }: DynamicFeaturesTableProps) {
//     const { fields, append, remove } = useFieldArray({
//         name,
//         control,
//     });

interface DynamicFeaturesTableProps<T extends FieldValues> {
    control: Control<T>;
    name: ArrayPath<T>;
    title?: string;
    nameLabel?: string;
    valueLabel?: string;
    namePlaceholder?: string;
    valuePlaceholder?: string;
    addButtonText?: string;
    minItems?: number;
}

export function DynamicFeaturesTable<T extends FieldValues>({
    control,
    name,
    title = "Features",
    namePlaceholder = "Field name (e.g. Max Properties)",
    valuePlaceholder = "Value (e.g. 10, true, Unlimited)",
    addButtonText = "Add New Feature Line",
}: DynamicFeaturesTableProps<T>) {

    const { fields, append, remove } = useFieldArray({
        name,
        control,
    });

    return (
        <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center justify-between">
                <FormLabel className="font-semibold text-foreground">
                    {title}
                </FormLabel>
                <Badge variant="outline" className="text-[10px] font-bold text-primary uppercase tracking-wider py-1">
                    {fields.length} Included
                </Badge>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {fields.map((field, index) => (
                        <motion.div
                            key={field.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="flex items-center gap-4 group"
                        >
                            <div className="size-10 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground font-black text-xs border">
                                {index + 1}
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <FormField
                                    control={control as Control<FieldValues>}
                                    name={`${name}.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    placeholder={namePlaceholder}
                                                    {...field}
                                                    className="h-12 rounded-2xl border-input focus:bg-background transition-all shadow-none font-medium"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control as Control<FieldValues>}
                                    name={`${name}.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group/value">
                                                    <Input
                                                        placeholder={valuePlaceholder}
                                                        {...field}
                                                        className="h-12 rounded-2xl border-input focus:bg-background transition-all shadow-none font-medium pr-12"
                                                    />
                                                    {fields.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl opacity-0 group-hover/value:opacity-100 transition-all active:scale-90"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', value: '' } as any)}
                className="w-full h-12 border-dashed border-2 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all group mt-2"
            >
                <Plus className="size-4 mr-2 group-hover:rotate-90 transition-transform" />
                {addButtonText}
            </Button>
        </div>
    );
}

export const convertFeaturesObjectToArray = (features: Record<string, string | number | boolean>) => {
    return Object.entries(features).map(([key, value]) => ({
        name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: String(value),
    }));
};

export const convertFeaturesArrayToObject = (features: { name: string; value: string }[]) => {
    return features.reduce((acc, feature) => {
        const key = feature.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '');

        let parsedValue: string | boolean | number = feature.value;
        const lowerValue = feature.value.toLowerCase();

        if (lowerValue === 'true' || lowerValue === 'yes') parsedValue = true;
        else if (lowerValue === 'false' || lowerValue === 'no') parsedValue = false;
        else if (!isNaN(Number(feature.value)) && feature.value.trim() !== '') {
            parsedValue = Number(feature.value);
        }

        acc[key] = parsedValue;
        return acc;
    }, {} as Record<string, string | boolean | number>);
};