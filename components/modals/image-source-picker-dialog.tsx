"use client";

import { Camera, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ImageSourcePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  title?: string;
  description?: string;
}

export function ImageSourcePickerDialog({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  title = "Upload Photo",
  description = "Choose how you would like to upload your image:",
}: ImageSourcePickerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-[20px] p-6 bg-white shadow-2xl font-asap border border-slate-100">
        <DialogHeader className="text-center space-y-2 mb-4">
          <DialogTitle className="text-xl font-extrabold text-[#1F2A44] uppercase tracking-tight text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#708090] text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onSelectCamera}
            className="flex items-center justify-center gap-3 w-full h-[52px] bg-[#1CA7A6] hover:bg-[#189695] text-white font-bold rounded-xl text-base shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Camera className="size-5" />
            <span>Take Photo (Camera)</span>
          </button>

          <button
            type="button"
            onClick={onSelectGallery}
            className="flex items-center justify-center gap-3 w-full h-[52px] bg-slate-100 hover:bg-slate-200 text-[#1F2A44] font-bold rounded-xl text-base transition-all active:scale-[0.98] cursor-pointer border border-slate-200/60"
          >
            <ImageIcon className="size-5 text-[#1CA7A6]" />
            <span>Choose from Gallery</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
