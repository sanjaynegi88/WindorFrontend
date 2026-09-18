"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InstallationForm } from "@/components/property-wizard/InstallationForm";
import {
  updateInstallation,
  updateInstallationImagesAdmin,
  updateImagesofPropertyOwnersAdmin,
  uploadOwnerProjectImagesAdmin,
} from "@/lib/actions";
import { buildInstallationPayload } from "@/lib/installation-utils";
import { toast } from "sonner";

interface InstallationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
  installation: {
    id: string;
    type: string;
    address: string;
    [key: string]: any;
  } | null;
  onSuccess?: () => void;
}

export function InstallationFormDialog({
  isOpen,
  onClose,
  installation,
  onSuccess,
}: InstallationFormDialogProps) {
  if (!installation) return null;

  const handleSave = async (
    values: any,
    files: { contractorFiles: File[]; ownerFiles: File[] },
  ) => {
    try {
      const type = installation.type.toLowerCase();
      const payload = buildInstallationPayload(type, values);

      const response = await updateInstallation(type, installation.id, payload);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      if (files.contractorFiles.length > 0) {
        const resp = await updateInstallationImagesAdmin(
          type,
          installation.id,
          files.contractorFiles,
        );
        if (!resp.success) {
          toast.error(
            resp.message ||
              `Failed to update ${installation.type} installation`,
          );
          return;
        }
      }

      if (files.ownerFiles.length > 0) {
        const isOwnerProject =
          installation.project_type === "WINDOWS AND DOORS" ||
          installation.added_by === "PROPERTY_OWNER" ||
          installation.created_by_type === "PROPERTY_OWNER" ||
          Boolean(installation.is_owner_project);

        const resp = isOwnerProject
          ? await uploadOwnerProjectImagesAdmin(
              installation.id,
              files.ownerFiles,
            )
          : await updateImagesofPropertyOwnersAdmin(
              type,
              installation.id,
              files.ownerFiles,
            );

        if (!resp.success) {
          toast.error(
            resp.message ||
              `Failed to update ${installation.type} installation`,
          );
          return;
        }
      }

      toast.success(
        `${installation.type} installation and report updated successfully`,
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to update ${installation.type} installation`,
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit {installation.type} Installation</DialogTitle>
          <DialogDescription>
            Edit the specifications for this {installation.type} installation at{" "}
            {installation.address}.
          </DialogDescription>
        </DialogHeader>
        <div className="p-1">
          <InstallationForm
            type={installation.type.toLowerCase() as any}
            tempPropertyId={null}
            address={installation.address}
            onBack={onClose}
            onSave={handleSave}
            isLastStep={true}
            initialValues={{
              ...installation,
              images: installation.images || [],
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
