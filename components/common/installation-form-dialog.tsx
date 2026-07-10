'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { InstallationForm } from '@/components/property-wizard/InstallationForm';
import { updateInstallation, updateInstallationImagesAdmin, updateImagesofPropertyOwnersAdmin } from '@/lib/actions';
import { toast } from 'sonner';

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

    const handleSave = async (values: any, files: { contractorFiles: File[], ownerFiles: File[] }) => {
        try {
            const type = installation.type.toLowerCase();

            const payload = {
                description: values.description,
                install_date: values.installDate,
                supplier: values.supplier,
                installer: values.installer,
                brand: values.brand,
                manufacturer: values.manufacturer,
                type: values.type,
                style: values.style,
                color: values.color,
                material: values.material,
                impact_resistant: values.impactResistant,
                class_rating: values.classRating,
                production_line: values.productionLine,
                order_number: values.orderNumber,
                elevation_data: values.elevationdata,
                windcode: values.windcode,
                u_factor: values.u_factor,
            };

            Object.keys(payload).forEach(key => {
                if (payload[key as keyof typeof payload] === undefined) {
                    delete payload[key as keyof typeof payload];
                }
            });

            const response = await updateInstallation(type, installation.id, payload);

            if (!response.success) {
                toast.error(response.message);
                return;
            }

            if (files.contractorFiles.length > 0) {
                const resp = await updateInstallationImagesAdmin(type, installation.id, files.contractorFiles);
                if (!resp.success) {
                    toast.error(resp.message || `Failed to update ${installation.type} installation`);
                    return;
                }
            }

            if (files.ownerFiles.length > 0) {
                const resp = await updateImagesofPropertyOwnersAdmin(type, installation.id, files.ownerFiles);
                if (!resp.success) {
                    toast.error(resp.message || `Failed to update ${installation.type} installation`);
                    return;
                }
            }

            toast.success(`${installation.type} installation and report updated successfully`);
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || `Failed to update ${installation.type} installation`);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2rem]">
                <DialogHeader className="sr-only">
                    <DialogTitle>Edit {installation.type} Installation</DialogTitle>
                    <DialogDescription>
                        Edit the specifications for this {installation.type} installation at {installation.address}.
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
                            images: installation.images || []
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
