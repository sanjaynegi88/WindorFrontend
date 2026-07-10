'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyStepperProps {
    currentStep: 'ADDRESS' | 'SELECTION' | 'FORM' | 'SUCCESS';
}

const steps = [
    { id: 'ADDRESS' as const, label: 'Property Details' },
    { id: 'SELECTION' as const, label: 'Choose Category' },
    { id: 'FORM' as const, label: 'System Details' }
];

export function PropertyStepper({ currentStep }: PropertyStepperProps) {
    const isSuccess = currentStep === 'SUCCESS';
    const currentStepIndex = isSuccess ? steps.length : steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex items-center justify-center gap-4 mb-12">
            {steps.map((s, i) => {
                const isCompleted = currentStepIndex > i;
                const isActive = currentStep === s.id;

                return (
                    <div key={s.id} className="flex items-center gap-2">
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" :
                                isCompleted ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200" :
                                    "bg-muted text-muted-foreground"
                        )}>
                            <div className={cn(
                                "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                                isActive ? "bg-white text-primary" :
                                    isCompleted ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
                            )}>
                                {isCompleted ? <CheckCircle2 className="size-4" /> : i + 1}
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap hidden sm:inline">
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="w-4 h-[2px] bg-muted rounded-full" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
