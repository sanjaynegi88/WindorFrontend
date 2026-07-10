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
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
    loading?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onConfirm,
    onCancel,
    title = 'Delete Project',
    description = 'Are you sure you want to delete this project? This action cannot be undone.',
    loading = false,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onCancel(); }}>
            <DialogContent className="max-w-[440px] rounded-2xl p-8 font-asap">
                <DialogHeader className="items-center text-center space-y-3">
                    <div className="size-[60px] rounded-full bg-red-50 flex items-center justify-center">
                        <Trash2 className="size-7 text-red-500" />
                    </div>
                    <DialogTitle className="text-[20px] md:text-[24px] font-bold text-[#1F2A44]">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[14px] md:text-[16px] text-[#708090] leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onCancel}
                        className="md:flex-1 h-[48px] rounded-[10px] border-[#708090]/40 text-[#708090] font-bold text-[16px] font-asap"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="md:flex-1 h-[48px] rounded-[10px] bg-red-500 hover:bg-red-600 text-white font-bold text-[16px] font-asap"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
