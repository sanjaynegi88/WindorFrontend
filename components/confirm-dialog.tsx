'use client';

import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'primary' | 'mono' | 'destructive' | 'secondary' | 'outline' | 'dashed' | 'ghost' | 'dim' | 'foreground' | 'inverse';
    showIcon?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'primary',
    showIcon = true,
}: ConfirmDialogProps) {
    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onCancel) onCancel();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px]">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        {showIcon && (
                            <div
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full',
                                    variant === 'destructive'
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-primary/10 text-primary'
                                )}
                            >
                                {variant === 'destructive' ? (
                                    <AlertTriangle className="h-5 w-5" />
                                ) : (
                                    <Info className="h-5 w-5" />
                                )}
                            </div>
                        )}
                        <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
                    </div>
                    {description && (
                        <AlertDialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                    <AlertDialogCancel onClick={handleCancel}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={cn(buttonVariants({ variant }))}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
