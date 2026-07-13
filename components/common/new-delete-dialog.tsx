"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

import Image from "next/image";

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Delete",
  message = "Are you sure?",
  itemName,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full max-w-[520px] rounded-[24px] bg-white shadow-xl p-0"
      >
        <DialogHeader className="border-0 pt-6 pr-6">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col items-center pb-10 px-10">
          <Image src="/media/illustrations/23.svg" alt="Illustration" width={150} height={150} className="max-h-[150px] mb-10 w-auto" />

          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{title}</h2>

          <p className="text-center text-gray-500 text-[15px] mb-10 max-w-[90%] leading-relaxed">
            {message}
            {itemName && <strong> {itemName}</strong>}?
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => onOpenChange(false)}
              className="px-5 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-2sm"
            >
              {cancelLabel}
            </button>

            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 text-2sm"
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
