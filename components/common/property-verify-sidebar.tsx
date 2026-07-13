'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, ShieldCheck, ShieldOff, CheckCircle2, ShieldX, FilePlus, Upload, X, Eye, Download } from 'lucide-react';
import { cn, toPascalCase } from '@/lib/utils';
import { getPropertyDetail, verifyInstallation, uploadPermit } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import { AwsImage } from '@/components/common/aws-image';

interface PropertyVerifySidebarProps {
  propertyId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <div className="relative w-full h-full overflow-hidden bg-muted/20 rounded-xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-muted/10">
          <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
        </div>
      )}
      <AwsImage
        src={src}
        alt={alt}
        className={cn(
          'object-cover w-full h-full transition-all duration-500',
          loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        )}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

export function PropertyVerifySidebar({
  propertyId,
  isOpen,
  onClose,
}: PropertyVerifySidebarProps) {
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const isInspector = role === 'city_inspector';
  const isOwner = role === 'property_owner';

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Verify confirmation state
  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  const [verifyParams, setVerifyParams] = useState<{ projectId: string; componentId: string } | null>(null);

  // Permit upload state
  const [permitDialogOpen, setPermitDialogOpen] = useState(false);
  const [permitComponent, setPermitComponent] = useState<any>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitDescription, setPermitDescription] = useState('');
  const [permitNotes, setPermitNotes] = useState('');
  const [uploadingPermit, setUploadingPermit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDetail = async (showLoading = true) => {
    if (!propertyId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await getPropertyDetail(propertyId);
      setProperty(res?.data ?? res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load property details');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !propertyId) return;
    setProperty(null);
    fetchDetail(true);
  }, [isOpen, propertyId]);

  const handleVerifyComponent = async (projectId: string, componentId: string) => {
    setVerifyingId(componentId);
    const payload = {
      status: 'VERIFIED',
    }
    try {
      const res = await verifyInstallation(componentId, payload, projectId,);
      if (res?.success) {
        toast.success('Installation verified successfully');
        setProperty((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            projects: prev.projects?.map((p: any) =>
              p.id === projectId
                ? {
                  ...p,
                  components: p.components
                    ? {
                      ...p.components,
                      installerVerified: true,
                      installer_verified: true,
                      verifiedAt: new Date().toISOString(),
                      verified_at: new Date().toISOString(),
                    }
                    : p.components,
                }
                : p
            ),
          };
        });
        // Silent refetch to ensure alignment with server state
        fetchDetail(false);
      } else {
        toast.error(res?.message || 'Failed to verify installation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify installation');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleMarkUnverified = async (projectId: string, componentId: string) => {
    setVerifyingId(componentId);
    try {

      const payload = {
        status: 'REJECTED',
      }
      const res = await verifyInstallation(componentId, payload, projectId,);
      if (res?.success) {
        toast.success('Installation marked as unverified');
        setProperty((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            projects: prev.projects?.map((p: any) =>
              p.id === projectId
                ? {
                  ...p,
                  components: p.components
                    ? {
                      ...p.components,
                      installerVerified: false,
                      installer_verified: false,
                      verifiedAt: null,
                      verified_at: null,
                    }
                    : p.components,
                }
                : p
            ),
          };
        });
        // Silent refetch to ensure alignment with server state
        fetchDetail(false);
      } else {
        toast.error(res?.message || 'Failed to update component verification');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update component verification');
    } finally {
      setVerifyingId(null);
    }
  };

  const openPermitDialog = (comp: any, projectId: string) => {
    setPermitComponent({ ...comp, project_id: projectId });
    setPermitFile(null);
    setPermitDescription('');
    setPermitNotes('');
    setPermitDialogOpen(true);
  };

  const handlePermitUpload = async () => {
    if (!permitComponent || !permitFile) return;
    const projectId = permitComponent.project_id;
    if (!projectId) {
      toast.error('No project associated with this component');
      return;
    }
    setUploadingPermit(true);
    try {
      const res = await uploadPermit(projectId, permitFile, permitDescription, permitNotes);
      if (res?.success) {
        toast.success('Permit uploaded successfully');
        setProperty((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            projects: prev.projects?.map((p: any) =>
              p.id === projectId
                ? {
                  ...p,
                  permitId: 'pending',
                  permit_upload: { status: 'PENDING_VERIFICATION' },
                  components: p.components
                    ? {
                      ...p.components,
                      permit_status: 'PENDING_VERIFICATION',
                      permit_uploaded_at: new Date().toISOString(),
                    }
                    : p.components,
                }
                : p
            ),
          };
        });
        setPermitDialogOpen(false);
        // Silent refetch to get real permit status and URLs from server
        fetchDetail(false);
      } else {
        toast.error(res?.message || 'Failed to upload permit');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload permit');
    } finally {
      setUploadingPermit(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col border-s-0 shadow-2xl"
        >
          <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-lg font-bold">Verify Property</SheetTitle>
          </SheetHeader>

          <SheetBody className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <span className="text-sm font-medium">Loading property details…</span>
              </div>
            )}

            {!loading && !property && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                <MapPin className="size-10" strokeWidth={1.5} />
                <span className="text-sm font-medium">No property data found</span>
              </div>
            )}

            {!loading && property && (
              <>
                {/* Property Images */}
                {(property.front_image || property.other_image) && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Property Images
                    </span>
                    <div className={cn(
                      'grid gap-2',
                      property.front_image && property.other_image ? 'grid-cols-2' : 'grid-cols-1'
                    )}>
                      {property.front_image && (
                        <div className="space-y-1">
                          <div className="aspect-video rounded-2xl overflow-hidden border border-border/50">
                            <ImageWithLoader
                              src={`${property.front_image}`}
                              alt="Front view"
                            />
                          </div>
                          <p className="text-[9px] text-center font-bold uppercase tracking-widest text-muted-foreground">
                            Front
                          </p>
                        </div>
                      )}
                      {property.other_image && (
                        <div className="space-y-1">
                          <div className="aspect-video rounded-2xl overflow-hidden border border-border/50">
                            <ImageWithLoader
                              src={`${property.other_image}`}
                              alt="Other view"
                            />
                          </div>
                          <p className="text-[9px] text-center font-bold uppercase tracking-widest text-muted-foreground">
                            Other
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Property Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">
                        {property.address || ''}
                      </h2>
                      {property.address2 && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {property.address2}
                        </p>
                      )}
                      {property.property_name && (
                        <p className="text-xs font-bold text-[#1CA7A6] mt-0.5">
                          {property.property_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                      { label: 'Parcel ID', value: property.parcel_id },
                      { label: 'Property Type', value: typeof property.property_type === 'object' ? property.property_type?.type_name : property.property_type },
                      { label: 'City', value: property.city_name },
                      { label: 'State', value: property.state_name },
                      { label: 'Zip', value: property.zip },
                      { label: 'Year Built', value: property.yearbuilt },
                      { label: 'Sq. Foot', value: property.square_foot },
                      { label: 'Owner Email', value: property.owner_email },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          {label}
                        </span>
                        <span className="text-xs font-semibold text-foreground break-all">
                          {value ?? 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t" />

                {/* Projects / Installations */}
                {(() => {
                  const projects = property.projects ?? [];
                  const projectsWithComponent = projects.filter((p: any) => p.components);
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Installations ({projectsWithComponent.length})
                      </h3>

                      {projectsWithComponent.length === 0 && (
                        <p className="text-sm text-muted-foreground font-medium">
                          No installations found.
                        </p>
                      )}

                      {projectsWithComponent.map((project: any) => {
                        const comp = project.components;
                        const compImages: string[] = (comp.images ?? []).flatMap((img: any) =>
                          [
                            img.image_url ? `${img.image_url}` : null,
                            img.property_owner_files ? `${img.property_owner_files}` : null,
                          ].filter(Boolean)
                        );

                        const isVerifying = verifyingId === comp.id;
                        const needPermit = !!project.need_permit;
                        const permitUpload = project.permit_upload;
                        const hasPermit = !!permitUpload;
                        const permitVerified = permitUpload?.status === 'VERIFIED';
                        const canVerify = (!needPermit && !hasPermit) || (needPermit && hasPermit && !permitVerified);

                        return (
                          <div
                            key={comp.id}
                            className="rounded-2xl border border-border/60 bg-muted/5 p-4 space-y-3"
                          >
                            {/* Project label */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                {project.project_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="px-2 py-0 text-[9px] font-black uppercase tracking-tighter border-none bg-muted/50 text-muted-foreground"
                              >
                                {toPascalCase(project.project_type)}
                              </Badge>
                            </div>

                            {/* Component header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-black tracking-widest text-foreground">
                                  {toPascalCase(comp.component_type)}
                                </span>

                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'px-2 py-0 text-[9px] font-black uppercase tracking-tighter border-none',
                                    hasPermit
                                      ? 'bg-blue-500/10 text-blue-600'
                                      : 'bg-gray-500/10 text-gray-500'
                                  )}
                                >
                                  {hasPermit ? `${comp.permit_status
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (c: any) => c.toUpperCase())}` : 'No Permit'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* View/Download Permit buttons for admin/inspector when permit exists */}
                                {(isAdmin || isInspector || isOwner) && hasPermit && (project.permit_url || comp.permit_file_url) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(project.permit_url || comp.permit_file_url, '_blank')}
                                      className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg gap-1.5"
                                    >
                                      <Eye className="size-3" />
                                      View
                                    </Button>
                                    <a
                                      href={project.permit_url || comp.permit_file_url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-lg gap-1.5"
                                      >
                                        <Download className="size-3" />
                                        Download
                                      </Button>
                                    </a>
                                  </>
                                )}

                                {/* Upload Permit button: need_permit true and no permit uploaded yet */}
                                {needPermit && !hasPermit && (
                                  <Button
                                    size="sm"
                                    onClick={() => openPermitDialog(comp, project.id)}
                                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg gap-1.5"
                                    variant="ghost"
                                  >
                                    <FilePlus className="size-3" />
                                    Upload Permit
                                  </Button>
                                )}

                                {/* Verify button: no need_permit, OR permit uploaded and not yet VERIFIED */}
                                {canVerify && !permitVerified && !isOwner && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setVerifyParams({ projectId: project.id, componentId: comp.id });
                                      setConfirmVerifyOpen(true);
                                    }}
                                    disabled={isVerifying}
                                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg gap-1.5 bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white"
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="size-3" />
                                    )}
                                    {isVerifying ? 'Verifying…' : 'Verify'}
                                  </Button>
                                )}

                                {/* Admin: can mark verified items back as unverified */}
                                {permitVerified && isAdmin && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkUnverified(project.id, comp.id)}
                                    disabled={isVerifying}
                                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg gap-1.5"
                                    variant="ghost"
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <ShieldX className="size-3" />
                                    )}
                                    {isVerifying ? 'Updating…' : 'Mark Unverified'}
                                  </Button>
                                )}

                                {/* Inspector: verified state is read-only */}
                                {permitVerified && (isInspector || isOwner) && (
                                  <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="size-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Verified
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Component details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              {[
                                { label: 'Brand', value: comp.brand },
                                { label: 'Style', value: comp.style },
                                { label: 'Color', value: comp.color },
                                { label: 'Material', value: comp.material },
                                { label: 'Contractor', value: comp.installer },
                                { label: 'Supplier', value: comp.supplier },
                                {
                                  label: 'Install Date',
                                  value: comp.install_date
                                    ? new Date(comp.install_date).toLocaleDateString()
                                    : null,
                                },
                                {
                                  label: 'Verified At',
                                  value: (comp.verifiedAt || comp.verified_at)
                                    ? new Date(comp.verifiedAt || comp.verified_at).toLocaleDateString()
                                    : null,
                                },
                              ].map(({ label, value }) =>
                                value ? (
                                  <div key={label} className="flex flex-col gap-0.5">
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                                      {label}
                                    </span>
                                    <span className="font-semibold text-foreground">{value}</span>
                                  </div>
                                ) : null
                              )}
                            </div>

                            {comp.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {comp.description}
                              </p>
                            )}

                            {/* Images */}
                            {compImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5">
                                {compImages.map((src, idx) => (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-border/40">
                                    <ImageWithLoader src={src} alt={`${comp.component_type} image ${idx + 1}`} />
                                  </div>
                                ))}
                              </div>
                            )}

                            {compImages.length === 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground/40 text-xs">
                                <ShieldOff className="size-3.5" />
                                <span>No images uploaded</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Permit Upload Dialog */}
      <Dialog open={permitDialogOpen} onOpenChange={setPermitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Permit</DialogTitle>
            <DialogDescription>
              Upload a permit document for this {permitComponent?.component_type} installation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="permit-file">Permit Document <span className="text-destructive">*</span></Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {permitFile ? (
                  <div className="flex items-center gap-2 w-full">
                    <Upload className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate flex-1">{permitFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPermitFile(null); }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Click to select a PDF or image file</span>
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
              <Label htmlFor="permit-description">Description</Label>
              <Input
                id="permit-description"
                placeholder="e.g. Initial permit upload for new furnace"
                value={permitDescription}
                onChange={(e) => setPermitDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permit-notes">Notes</Label>
              <Textarea
                id="permit-notes"
                placeholder="e.g. Received from homeowner"
                value={permitNotes}
                onChange={(e) => setPermitNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermitDialogOpen(false)}
              disabled={uploadingPermit}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePermitUpload}
              disabled={uploadingPermit || !permitFile}
            >
              {uploadingPermit ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload Permit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={confirmVerifyOpen} onOpenChange={setConfirmVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this installation? This will mark the component as verified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmVerifyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 text-white"
              onClick={() => {
                if (verifyParams) {
                  handleVerifyComponent(verifyParams.projectId, verifyParams.componentId);
                }
                setConfirmVerifyOpen(false);
              }}
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
