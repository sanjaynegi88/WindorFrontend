'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

interface ConfirmSubmitDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
}

export function ConfirmSubmitDialog({
    open,
    onConfirm,
    onCancel,
    title = 'Confirm Submission',
    description,
}: ConfirmSubmitDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
            <DialogContent className="max-w-[440px] rounded-2xl p-8 font-asap">
                <DialogHeader className="items-center text-center space-y-3">
                    <div className="size-[60px] rounded-full bg-amber-50 flex items-center justify-center">
                        <ShieldAlert className="size-7 text-amber-500" />
                    </div>
                    <DialogTitle className="text-[20px] md:text-[24px] font-bold text-[#1F2A44]">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[14px] md:text-[16px] text-[#708090] leading-relaxed">
                        {description ?? (
                            <>
                                Once confirmed, this information{' '}
                                <span className="font-semibold text-[#1F2A44]">cannot be edited</span>{' '}
                                by you. Only an admin will be able to make changes after submission.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="md:flex-1 h-[48px] rounded-[10px] border-[#708090]/40 text-[#708090] font-bold text-[16px] font-asap"
                    >
                        Go Back & Review
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="md:flex-1 h-[48px] rounded-[10px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold text-[16px] font-asap"
                    >
                        Yes, Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
