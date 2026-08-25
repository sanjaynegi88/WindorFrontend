'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
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
  Plus,
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
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
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
import { getRoles, deleteRoles } from '@/lib/actions';
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
import { RoleFormDialog } from './roles-form-dialog';
import { formatDate } from '@/lib/helpers';
import { toPascalCase } from '@/lib/utils';

export default function RolesListPage({ refreshTrigger, onSuccess }: { refreshTrigger: number, onSuccess: () => void }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [editingPropertyType, setEditingPropertyType] = useState<any | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchData = async (page: number = 1, limit: number = 10, search?: string) => {
    setLoading(true);
    try {
      const response = await getRoles(page, limit, search);
      if (response && response.data) {
        setData(response.data);
        if (response.pagination) {
          setTotalRecords(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching state list:', error);
      ('Failed to load property types');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 0 when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch);
  }, [refreshTrigger, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await deleteRoles(deleteId);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success('Role deleted successfully');
      fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete Role');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (propertyType: any) => {
    setEditingPropertyType(propertyType);
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
          headerClassName: 'ps-4',
          cellClassName: 'ps-4',
          skeleton: <Skeleton className="w-6 h-7" />
        },
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: 'type_name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Role Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {toPascalCase(row.original.role_name)}
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
          skeleton: <Skeleton className="w-6 h-7" />
        }
      },
      {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created At"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="size-3" />
            {formatDate(row.original.created_at)}
          </div>
        ),
        size: 160,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />
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
          skeleton: <Skeleton className="w-6 h-7" />
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
                  Edit Role
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => handleDelete(row.original.id)}
                  disabled={row.original.role_name.toLowerCase() === 'admin'}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete Role
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
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto rounded-xl px-4 bg-primary text-white hover:bg-primary/90 shadow-sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="size-4 mr-2" />
                Add Role
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

      <RoleFormDialog
        isOpen={isAddDialogOpen || !!editingPropertyType}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingPropertyType(null);
        }}
        state={editingPropertyType}
        onSuccess={() => fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role
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
              {isDeleting ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};