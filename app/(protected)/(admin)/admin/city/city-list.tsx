'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Search,
  MoreVertical,
  Calendar,
  Edit,
  Trash2,
  MapPin,
  Settings2,
  Filter,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCities, deleteCity, getStates } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import { CityFormDialog } from './city-form-dialog';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/helpers';


export default function CityList({ refreshTrigger, onSuccess }: { refreshTrigger: number, onSuccess: () => void }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stateOptions, setStateOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  const handleSuccess = () => {
    onSuccess?.();
    setIsAddDialogOpen(false);
  };

  const fetchData = async (page: number = 1, limit: number = 10, name?: string, state_id?: string) => {
    setLoading(true);
    try {
      const response = await getCities(page, limit, undefined, name || undefined, state_id || undefined, true);
      if (response && response.data) {
        setData(response.data);
        if (response.pagination) {
          setTotalRecords(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setData([]);
      }
    } catch (error: any) {
      console.error('Error fetching city list:', error);
      toast.error(error.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch state options for filter dropdown
  useEffect(() => {
    getStates(1, 1000).then((res) => {
      const raw = Array.isArray(res) ? res : res?.data || [];
      setStateOptions(raw.map((s: any) => ({ id: String(s.id), name: s.state_name || s.name })));
    }).catch(() => { });
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 0 when search or state filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, selectedStateId]);

  useEffect(() => {
    fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch, selectedStateId);
  }, [refreshTrigger, pagination.pageIndex, pagination.pageSize, debouncedSearch, selectedStateId]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const result = await deleteCity(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
    if (!result.success) {
      toast.error(result.message || 'Failed to delete city');
      return;
    }
    toast.success('City deleted successfully');
    fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch, selectedStateId);
  };

  const handleEdit = (city: any) => {
    setEditingCity(city);
  };

  const { pageIndex, pageSize } = pagination;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'index',
        id: 'index',
        header: () => <div className="text-center text-[0.8125rem] font-normal text-foreground/70">Id</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground/70">
            {pageIndex * pageSize + row.index + 1}
          </div>
        ),
        enableSorting: false,
        size: 60,
        meta: {
          skeleton: <Skeleton className="w-1/2 h-5" />,
          headerClassName: 'ps-4',
          cellClassName: 'ps-4',
        }
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="City Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold shrink-0">
                <MapPin className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {row.original.name}
                </span>
              </div>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-1/2 h-5" />
        }
      },
      {
        accessorKey: 'state',
        id: 'state',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="State"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {row.original.state_entity?.state_name || 'N/A'}
                </span>
              </div>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-1/2 h-5" />
        }
      },
      {
        accessorKey: 'zip_codes',
        id: 'zip_codes',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Zip Codes"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex flex-wrap gap-1 max-w-75">
              {(row.original.zip_codes || []).map((zipObj: any, idx: number) => (
                <Badge
                  key={idx}
                  variant="primary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {zipObj}
                </Badge>
              ))}
            </div>
          );
        },
        size: 300,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-3/4 h-5" />
        }
      },
      {
        accessorKey: 'updated_at',
        id: 'updated_at',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Last Updated"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="size-3" />
            {formatDate(row.original.updated_at)}
          </div>
        ),
        size: 160,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-24 h-5" />
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem className='cursor-pointer' onClick={() => handleEdit(row.original)}>
                  <Edit className="size-3.5 mr-2" />
                  Edit City
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete City
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
        enableHiding: false,
      },
    ],
    [pageIndex, pageSize],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const filteredData = data;

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: totalPages || Math.ceil(totalRecords / pagination.pageSize),
    manualPagination: true,
    getRowId: (row: any) => row.id,
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
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={totalRecords}
        isLoading={loading}
        tableClassNames={{
          bodyRow: 'group/row',
        }}
        tableLayout={{
          dense: true,
          columnsResizable: true,
        }}
      >
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="px-4 py-3 flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardHeading className="w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="size-4 text-muted-foreground absolute inset-s-3 top-1/2 -translate-y-1/2" />
                  <Input
                    variant="sm"
                    placeholder="Search cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-full"
                  />
                </div>
                {/* <Select
                  value={selectedStateId || 'all'}
                  onValueChange={(val) => setSelectedStateId(val === 'all' ? '' : val)}
                >
                  <SelectTrigger className="h-8 w-full sm:w-44 text-xs rounded-lg">
                    <SelectValue placeholder="Filter by State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {stateOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto rounded-xl px-4 bg-primary text-white hover:bg-primary/90 shadow-sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="size-4 mr-2" />
                Add City
              </Button>
            </CardToolbar>
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

      <CityFormDialog
        isOpen={isAddDialogOpen || !!editingCity}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingCity(null);
        }}
        city={editingCity}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the city
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? 'Deleting...' : 'Delete City'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};