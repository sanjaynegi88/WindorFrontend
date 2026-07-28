'use client';

import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { getServiceProvided } from '@/lib/actions';
import { cn, toPascalCase } from '@/lib/utils';
import { toast } from 'sonner';

export interface ServiceItem {
    id: string;
    service_name: string;
}

interface ServiceSelectProps {
    name?: string;
    otherName?: string;
    label?: string;
    value?: string[];
    onChange?: (value: string[]) => void;
    otherValue?: string;
    onOtherChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    gridClassName?: string;
    inputClassName?: string;
    variant?: 'checkbox' | 'button' | 'badge';
    placeholderOther?: string;
}

export function ServiceSelectContent({
    value = [],
    onChange,
    otherValue = '',
    onOtherChange,
    disabled = false,
    className,
    gridClassName,
    inputClassName,
    variant = 'checkbox',
    placeholderOther = 'Please specify other service...',
}: {
    value?: string[];
    onChange?: (value: string[]) => void;
    otherValue?: string;
    onOtherChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    gridClassName?: string;
    inputClassName?: string;
    variant?: 'checkbox' | 'button' | 'badge';
    placeholderOther?: string;
}) {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOtherChecked, setIsOtherChecked] = useState(false);
    const [otherText, setOtherText] = useState(otherValue || '');

    useEffect(() => {
        let isMounted = true;
        getServiceProvided()
            .then((res) => {
                if (isMounted) {
                    setServices(Array.isArray(res?.data) ? res.data : []);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    toast.error(err?.message || 'Failed to load services');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Synchronize "Other" state from incoming otherValue or fallback custom string in value
    useEffect(() => {
        if (otherValue !== undefined && otherValue !== '') {
            setOtherText(otherValue);
            setIsOtherChecked(true);
            return;
        }

        if (services.length === 0) return;
        const knownIds = new Set(services.map((s) => s.id));
        const customValue = value.find((val) => val && !knownIds.has(val));

        if (customValue !== undefined && !otherValue) {
            setIsOtherChecked(true);
            setOtherText(customValue);
            onOtherChange?.(customValue);
        }
    }, [services, value, otherValue]);

    const handleServiceToggle = (serviceId: string, checked: boolean) => {
        if (!onChange) return;
        const knownIds = new Set(services.map((s) => s.id));
        const knownValues = value.filter((v) => knownIds.has(v));
        if (checked) {
            onChange([...knownValues.filter((v) => v !== serviceId), serviceId]);
        } else {
            onChange(knownValues.filter((v) => v !== serviceId));
        }
    };

    const handleOtherToggle = (checked: boolean) => {
        setIsOtherChecked(checked);

        const knownIds = new Set(services.map((s) => s.id));
        const knownValuesOnly = value.filter((v) => knownIds.has(v));
        onChange?.(knownValuesOnly);

        if (checked) {
            onOtherChange?.(otherText);
        } else {
            setOtherText('');
            onOtherChange?.('');
        }
    };

    const handleOtherTextChange = (text: string) => {
        setOtherText(text);
        onOtherChange?.(text);

        const knownIds = new Set(services.map((s) => s.id));
        const knownValuesOnly = value.filter((v) => knownIds.has(v));
        onChange?.(knownValuesOnly);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-2 py-2">
                <div className="h-4 bg-muted/40 rounded w-1/3"></div>
                <div className="h-9 bg-muted/20 rounded w-full"></div>
            </div>
        );
    }

    if (variant === 'button') {
        return (
            <div className={cn('space-y-3', className)}>
                <div className={cn('grid grid-cols-1 gap-3', gridClassName)}>
                    {services.map((service) => {
                        const selected = value.includes(service.id);
                        return (
                            <button
                                key={service.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleServiceToggle(service.id, !selected)}
                                className="flex items-center gap-3 text-left disabled:opacity-50"
                            >
                                <span
                                    className={cn(
                                        'w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                                        selected
                                            ? 'bg-[#1CA7A6] border-[#1CA7A6]'
                                            : 'bg-white border-[rgba(112,128,144,0.4)]'
                                    )}
                                >
                                    {selected && (
                                        <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 12 10">
                                            <path d="M4 7.8L1.2 5l-.9.9L4 9.6l8-8-.9-.9L4 7.8z" />
                                        </svg>
                                    )}
                                </span>
                                <span className="text-[18px] font-medium text-[#1F2A44] font-asap">
                                    {toPascalCase(service.service_name)}
                                </span>
                            </button>
                        );
                    })}

                    {/* Other option button */}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleOtherToggle(!isOtherChecked)}
                        className="flex items-center gap-3 text-left disabled:opacity-50"
                    >
                        <span
                            className={cn(
                                'w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                                isOtherChecked
                                    ? 'bg-[#1CA7A6] border-[#1CA7A6]'
                                    : 'bg-white border-[rgba(112,128,144,0.4)]'
                            )}
                        >
                            {isOtherChecked && (
                                <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 12 10">
                                    <path d="M4 7.8L1.2 5l-.9.9L4 9.6l8-8-.9-.9L4 7.8z" />
                                </svg>
                            )}
                        </span>
                        <span className="text-[18px] font-medium text-[#1F2A44] font-asap">Other</span>
                    </button>
                </div>

                {isOtherChecked && (
                    <div className="pt-1">
                        <Input
                            disabled={disabled}
                            value={otherText}
                            onChange={(e) => handleOtherTextChange(e.target.value)}
                            placeholder={placeholderOther}
                            className={cn(
                                'h-[50px] px-4 border-[rgba(112,128,144,0.23)] rounded-[6px] text-base font-medium text-[#1F2A44] bg-white placeholder:text-[#1F2A44]/50 font-asap',
                                inputClassName
                            )}
                        />
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'badge') {
        return (
            <div className={cn('space-y-3', className)}>
                <div className={cn('flex flex-wrap gap-2 min-w-0', gridClassName)}>
                    {services.map((service) => {
                        const selected = value.includes(service.id);
                        return (
                            <button
                                key={service.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleServiceToggle(service.id, !selected)}
                                className={cn(
                                    'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all text-left break-words cursor-pointer disabled:opacity-50',
                                    selected
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60'
                                )}
                            >
                                {toPascalCase(service.service_name)}
                            </button>
                        );
                    })}

                    {/* Other option badge */}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleOtherToggle(!isOtherChecked)}
                        className={cn(
                            'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all text-left break-words cursor-pointer disabled:opacity-50',
                            isOtherChecked
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60'
                        )}
                    >
                        Other
                    </button>
                </div>

                {isOtherChecked && (
                    <div className="pt-1">
                        <Input
                            disabled={disabled}
                            value={otherText}
                            onChange={(e) => handleOtherTextChange(e.target.value)}
                            placeholder={placeholderOther}
                            className={cn('h-10 rounded-xl bg-muted/30 border-input text-sm', inputClassName)}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Default 'checkbox' variant
    return (
        <div className={cn('space-y-3', className)}>
            <div className={cn('grid grid-cols-2 gap-3 pt-1', gridClassName)}>
                {services.map((service) => {
                    const checked = value.includes(service.id);
                    return (
                        <div key={service.id} className="flex items-center gap-2 space-y-0">
                            <Checkbox
                                disabled={disabled}
                                checked={checked}
                                onCheckedChange={(val) => handleServiceToggle(service.id, !!val)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className="text-sm font-medium">{toPascalCase(service.service_name)}</span>
                        </div>
                    );
                })}

                {/* Other Checkbox */}
                <div className="flex items-center gap-2 space-y-0">
                    <Checkbox
                        disabled={disabled}
                        checked={isOtherChecked}
                        onCheckedChange={(val) => handleOtherToggle(!!val)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">Other</span>
                </div>
            </div>

            {isOtherChecked && (
                <div className="pt-1">
                    <Input
                        disabled={disabled}
                        value={otherText}
                        onChange={(e) => handleOtherTextChange(e.target.value)}
                        placeholder={placeholderOther}
                        className={cn('h-10 text-sm border-border/60 bg-background', inputClassName)}
                    />
                </div>
            )}
        </div>
    );
}

export function ServiceSelect({
    name,
    otherName = 'other_service',
    label,
    value,
    onChange,
    otherValue,
    onOtherChange,
    disabled = false,
    className,
    gridClassName,
    inputClassName,
    variant = 'checkbox',
    placeholderOther,
}: ServiceSelectProps) {
    const formContext = useFormContext();

    if (name && formContext) {
        const watchedOtherValue = formContext.watch(otherName);
        const currentOtherValue = otherValue !== undefined ? otherValue : (watchedOtherValue ?? '');

        const handleOtherChange = (val: string) => {
            formContext.setValue(otherName, val, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            onOtherChange?.(val);
        };

        return (
            <FormField
                control={formContext.control}
                name={name}
                render={({ field }) => (
                    <FormItem className={className}>
                        {label && <FormLabel>{label}</FormLabel>}
                        <FormControl>
                            <ServiceSelectContent
                                value={field.value || []}
                                onChange={field.onChange}
                                otherValue={currentOtherValue}
                                onOtherChange={handleOtherChange}
                                disabled={disabled}
                                gridClassName={gridClassName}
                                inputClassName={inputClassName}
                                variant={variant}
                                placeholderOther={placeholderOther}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    return (
        <div className={className}>
            {label && <FormLabel className="mb-2 block">{label}</FormLabel>}
            <ServiceSelectContent
                value={value || []}
                onChange={onChange}
                otherValue={otherValue}
                onOtherChange={onOtherChange}
                disabled={disabled}
                gridClassName={gridClassName}
                inputClassName={inputClassName}
                variant={variant}
                placeholderOther={placeholderOther}
            />
        </div>
    );
}

