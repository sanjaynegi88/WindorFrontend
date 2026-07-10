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
  Tag,
  Info,
  Plus,
  Settings2,
  Filter
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
import { getBrands, deleteBrand } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BrandFormDialog } from './brand-form-dialog';
import { formatDate } from '@/lib/helpers';
import { toPascalCase } from '@/lib/utils';


export default function BrandList({ onAddBrand }: { onAddBrand: () => void }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async (page: number = 1, limit: number = 10, search?: string) => {
    setLoading(true);
    try {
      const response = await getBrands(page, limit, undefined, search);
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
      console.error('Error fetching brand list:', error);
      toast.error(error.message || 'Failed to load brands');
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

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData(pagination.pageIndex + 1, pagination.pageSize, debouncedSearch);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      const result = await deleteBrand(id);
      if (!result.success) {
        toast.error(result.message || 'Failed to delete brand');
        return;
      }
      toast.success('Brand deleted successfully');
      fetchData(pagination.pageIndex + 1, pagination.pageSize);
    }
  };

  const handleEdit = (brand: any) => {
    setEditingBrand(brand);
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
        accessorKey: 'brand_name',
        id: 'brand_name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Brand Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                {row.original.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-foreground text-sm leading-tight">
                {row.original.name}
              </span>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-3/4 h-5" />
        }
      },
      {
        accessorKey: 'category',
        id: 'category',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Category"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground text-sm leading-tight">
                {toPascalCase(row.original.category)}
              </span>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-3/4 h-5" />
        }
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Description"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="max-w-[400px] truncate text-xs text-muted-foreground whitespace-normal">
              {row.original.description || 'No description'}
            </div>
          );
        },
        size: 400,
        enableSorting: true,
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
          skeleton: <Skeleton className="w-3/4 h-5" />
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
                  Edit Brand
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete Brand
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

  const table = useReactTable({
    columns,
    data: data,
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
                    placeholder="Search brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-full"
                  />
                </div>
              </div>
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <Button size="sm" onClick={onAddBrand} className="w-full sm:w-auto">
                  <Plus className="size-4 mr-2" /> New Brand
                </Button>
              </div>
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

      <BrandFormDialog
        isOpen={!!editingBrand}
        onClose={() => setEditingBrand(null)}
        brand={editingBrand as any}
        onSuccess={() => fetchData(pagination.pageIndex + 1, pagination.pageSize)}
      />
    </>
  );
};

