"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadPermit } from "@/lib/actions";

export interface StagedPermitData {
  file: File | null;
  description: string;
  notes: string;
}

interface PermitUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectType?: string;
  isEditMode?: boolean;
  projectId?: string;
  initialData?: StagedPermitData | null;
  onSaveStaged?: (data: StagedPermitData) => void;
  onUploadSuccess?: () => void;
}

export function PermitUploadDialog({
  open,
  onOpenChange,
  projectType,
  isEditMode = false,
  projectId,
  initialData,
  onSaveStaged,
  onUploadSuccess,
}: PermitUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitDescription, setPermitDescription] = useState("");
  const [permitNotes, setPermitNotes] = useState("");
  const [uploadingPermit, setUploadingPermit] = useState(false);

  useEffect(() => {
    if (open) {
      setPermitFile(initialData?.file || null);
      setPermitDescription(initialData?.description || "");
      setPermitNotes(initialData?.notes || "");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!permitFile) {
      toast.error("Please select a permit file");
      return;
    }

    if (onSaveStaged) {
      onSaveStaged({
        file: permitFile,
        description: permitDescription,
        notes: permitNotes,
      });
      toast.success("Permit document attached");
      onOpenChange(false);
      return;
    }

    if (isEditMode && projectId) {
      setUploadingPermit(true);
      try {
        const res = await uploadPermit(
          projectId,
          permitFile,
          permitDescription,
          permitNotes,
        );
        if (res?.success) {
          toast.success("Permit uploaded successfully");
          onUploadSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res?.message || "Failed to upload permit");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to upload permit");
      } finally {
        setUploadingPermit(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-asap">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1F2A44]">
            Upload Permit
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {projectType
              ? `Upload a permit document for this ${projectType} project.`
              : "Upload a permit document for this project."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="permit-file" className="text-sm font-medium">
              Permit Document <span className="text-destructive">*</span>
            </Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {permitFile ? (
                <div className="flex items-center gap-2 w-full">
                  <Upload className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">
                    {permitFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPermitFile(null);
                    }}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Click to select a PDF or image file
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                id="permit-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPermitFile(f);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permit-description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="permit-description"
              placeholder="e.g. Initial permit upload for new project"
              value={permitDescription}
              onChange={(e) => setPermitDescription(e.target.value)}
              disabled={uploadingPermit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permit-notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="permit-notes"
              placeholder="e.g. Received from homeowner"
              value={permitNotes}
              onChange={(e) => setPermitNotes(e.target.value)}
              rows={3}
              disabled={uploadingPermit}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadingPermit}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={uploadingPermit || !permitFile}
            className="bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white"
          >
            {uploadingPermit ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading…
              </>
            ) : onSaveStaged ? (
              <>
                <Upload className="mr-2 size-4" />
                Attach Permit
              </>
            ) : isEditMode ? (
              <>
                <Upload className="mr-2 size-4" />
                Upload Permit
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Attach Permit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
