'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Filter, Search, Settings2, X, Hammer, Layout, Maximize2, DoorOpen, MoreHorizontal, MoreVertical, Eye, File, FileText } from 'lucide-react';
import { cn, downloadPdfFromUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generatePdfReport, getPropertyListUser, uploadPropertOwnerImages, uploadPermit } from '@/lib/actions';
import { useUser } from '@/components/providers/user-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type InstallationStatus = 'Verified' | 'Not Verified';

interface Installation {
  id: string;
  propertyId: string;
  address: string;
  type: string;
  componentType: string;
  brand: string;
  installer: string;
  installDate: string;
  status: InstallationStatus;
  owner_uploaded: boolean;
  permit_status: string | null;
  project_id: string | null;
  property_owner_email: string | null;
}

const statusColors: Record<InstallationStatus, string> = {
  Verified: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Not Verified': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const TypeIcon = ({ type }: { type: Installation['type'] }) => {
  switch (type) {
    case 'Roofing': return <Hammer className="size-3.5" />;
    case 'Siding': return <Layout className="size-3.5" />;
    case 'Window': return <Maximize2 className="size-3.5" />;
    case 'Door': return <DoorOpen className="size-3.5" />;
  }
};

export default function InstallationList() {
  const router = useRouter();
  const { user } = useUser();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Installation[]>([]);

  // Image upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Permit upload state
  const [permitDialogOpen, setPermitDialogOpen] = useState(false);
  const [permitInstallation, setPermitInstallation] = useState<Installation | null>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitDescription, setPermitDescription] = useState('');
  const [permitNotes, setPermitNotes] = useState('');
  const [uploadingPermit, setUploadingPermit] = useState(false);
  const permitFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getPropertyListUser();
        const flatData: Installation[] = [];

        if (result && result.data && Array.isArray(result.data)) {
          result.data.forEach((property: any) => {
            if (property.projects && Array.isArray(property.projects)) {
              property.projects.forEach((project: any) => {
                const component = project.components;
                if (!component) return;
                flatData.push({
                  id: component.id,
                  propertyId: property.id,
                  address: `${property.address || ''}, ${property.city_name || property.city?.name || ''}`.trim().replace(/,\s*$/, '') || '',
                  type: (component.component_type.charAt(0) + component.component_type.slice(1).toLowerCase()),
                  componentType: component.component_type,
                  brand: component.brand || 'N/A',
                  installer: component.installer || 'N/A',
                  installDate: property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A',
                  status: property.verified_status ? 'Verified' : 'Not Verified',
                  owner_uploaded: component.owner_uploaded || false,
                  permit_status: component.permit_status ?? null,
                  project_id: project.id,
                  property_owner_email: property.property_owner?.email ?? null,
                });
              });
            }
          });
        }

        setData(flatData);
      } catch (error) {
        console.error('Failed to fetch installations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGeneratePdfReport = async (propertyId: string, type: string) => {
    try {
      const url = await generatePdfReport(propertyId, type.toLowerCase());
      await downloadPdfFromUrl(url, `property-report-${propertyId}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // if (selectedFiles.length + files.length > 5) {
    //   toast.error('Maximum 5 images allowed');
    //   return;
    // }

    setSelectedFiles([...selectedFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleUploadImages = async () => {
    console.log('[handleUploadImages] selectedInstallation:', selectedInstallation, 'files:', selectedFiles.length);
    if (!selectedInstallation || selectedFiles.length === 0) return;

    setUploading(true);
    const result = await uploadPropertOwnerImages(
      selectedInstallation.componentType === 'WINDOWS AND DOORS'
        ? 'window_door'
        : selectedInstallation.componentType.toLowerCase().replace(/_/g, '-'),
      selectedInstallation.id,
      selectedFiles
    );
    setUploading(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to upload images. Please try again.');
      return;
    }

    toast.success('Images uploaded successfully!');
    setData(prevData =>
      prevData.map(item =>
        item.id === selectedInstallation.id
          ? { ...item, owner_uploaded: true }
          : item
      )
    );
    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setPreviews([]);
  };

  const openUploadDialog = (installation: Installation) => {
    setSelectedInstallation(installation);
    setSelectedFiles([]);
    setPreviews([]);
    setUploadDialogOpen(true);
  };

  const openPermitDialog = (installation: Installation) => {
    setPermitInstallation(installation);
    setPermitFile(null);
    setPermitDescription('');
    setPermitNotes('');
    setPermitDialogOpen(true);
  };

  const handlePermitUpload = async () => {
    if (!permitInstallation || !permitFile) return;
    const projectId = permitInstallation.project_id;
    if (!projectId) {
      toast.error('No project associated with this installation');
      return;
    }
    setUploadingPermit(true);
    const result = await uploadPermit(projectId, permitFile, permitDescription, permitNotes);
    setUploadingPermit(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to upload permit');
      return;
    }

    toast.success('Permit uploaded successfully');
    setData(prevData =>
      prevData.map(item =>
        item.id === permitInstallation.id
          ? { ...item, permit_status: 'pending' }
          : item
      )
    );
    setPermitDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Installation>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'id',
        header: () => <DataGridTableRowSelectAll size="sm" />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} size="sm" />,
        enableSorting: false,
        size: 40,
        meta: {
          headerClassName: 'ps-4',
          cellClassName: 'ps-4',
        },
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: 'address',
        id: 'address',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Property Address"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium text-foreground truncate">
              {row.original.address}
            </div>
          );
        },
        size: 250,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="System Type"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <TypeIcon type={row.original.type} />
              </div>
              <span className="text-sm font-medium">{row.original.type}</span>
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'brand',
        id: 'brand',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Brand"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => <div className="truncate">{row.original.brand}</div>,
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'installer',
        id: 'installer',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Installer"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => <div className="truncate">{row.original.installer}</div>,
        size: 180,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'installDate',
        id: 'installDate',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Install Date"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground">{row.original.installDate}</div>
        ),
        size: 130,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Status"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant="outline" className={cn('font-medium', statusColors[status])}>
              {status}
            </Badge>
          );
        },
        size: 130,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleGeneratePdfReport(row.original.propertyId, row.original.type)}
                  className='cursor-pointer'
                >
                  <File />
                  View Report
                </DropdownMenuItem>
                {!row.original.owner_uploaded &&
                  user?.email && row.original.property_owner_email &&
                  user.email.toLowerCase() === row.original.property_owner_email.toLowerCase() && (
                    <DropdownMenuItem
                      onClick={() => openUploadDialog(row.original)}
                      className='cursor-pointer'
                    >
                      <ImagePlus className="size-3.5 mr-2" />
                      Upload Images
                    </DropdownMenuItem>
                  )}
                {row.original.owner_uploaded && (
                  <DropdownMenuItem disabled className='cursor-not-allowed text-muted-foreground'>
                    <ImagePlus className="size-3.5 mr-2" />
                    Images Already Uploaded
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => router.push(`/installations/${row.original.id}`)}
                  className='cursor-pointer'
                >
                  <Eye />
                  View Details
                </DropdownMenuItem>
                {row.original.permit_status === null && row.original.project_id && (
                  <DropdownMenuItem
                    onClick={() => openPermitDialog(row.original)}
                    className='cursor-pointer'
                  >
                    <FileText className="size-3.5" />
                    Add Permit
                  </DropdownMenuItem>
                )}
                {row.original.permit_status !== null && (
                  <DropdownMenuItem disabled className='cursor-not-allowed text-muted-foreground'>
                    <FileText className="size-3.5" />
                    Permit: {row.original.permit_status}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
        enableHiding: false,
      },
    ],
    [user],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        Object.values(item).join(' ').toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, data]);

  const table = useReactTable({
    columns,
    data: filteredData,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });


  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-60 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Card className="border-none shadow-none">
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="size-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }


  return (
    <>
      <DataGrid
        table={table}
        recordCount={filteredData.length}
        tableClassNames={{
          bodyRow: 'group/row',
        }}
        tableLayout={{
          dense: true,
          columnsPinnable: true,
          columnsResizable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
      >

        <Card className="border-none shadow-none">
          <CardHeader className="px-4 py-3">
            <CardHeading>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Input
                    variant="sm"
                    placeholder="Search installations..."
                    startIcon={<Search className="size-4" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-60"
                  />
                  {searchQuery.length > 0 && (
                    <Button
                      mode="icon"
                      variant="ghost"
                      className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery('')}
                    >
                      <X />
                    </Button>
                  )}
                </div>

                <Button size="sm" variant="outline">
                  <Filter className="size-3.5" />
                  Status
                </Button>
              </div>
            </CardHeading>
          </CardHeader>

          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter className="px-4 py-0">
            <DataGridPagination
              className="py-1"
              sizes={[5, 10, 15, 30, 50, 100]}
            />
          </CardFooter>
        </Card>
      </DataGrid>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Installation Images</DialogTitle>
            <DialogDescription>
              Upload up to 5 clear photos of your {selectedInstallation?.type} for verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {previews.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImagePlus className="size-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <p className="text-[0.8rem] text-muted-foreground">
              Clear photos help speed up the verification process.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadImages}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permit Upload Dialog */}
      <Dialog open={permitDialogOpen} onOpenChange={setPermitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Permit</DialogTitle>
            <DialogDescription>
              Upload a permit document for this {permitInstallation?.type} installation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Permit Document <span className="text-destructive">*</span>
              </label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => permitFileInputRef.current?.click()}
              >
                {permitFile ? (
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
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
                    <FileText className="size-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Click to select a PDF or image file
                    </span>
                  </>
                )}
                <input
                  ref={permitFileInputRef}
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
              <label className="text-sm font-medium">Description</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. Initial permit upload for new furnace"
                value={permitDescription}
                onChange={(e) => setPermitDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                'Upload Permit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
