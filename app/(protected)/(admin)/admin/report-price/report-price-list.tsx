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
  MoreVertical,
  Calendar,
  Edit,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import {
  DataGridTable,
} from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getReportPrice } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ReportPriceFormDialog } from './report-price-form-dialog';
import { formatDate } from '@/lib/helpers';

const formatReportPriceKey = (key: string) => {
  switch (key) {
    case 'report_price':
      return 'Report Price (Contractor Projects)';
    case 'add_user_price':
      return 'Contractor Additional User Price (Monthly)';
    case 'add_user_price_annual':
      return 'Contractor Additional User Price (Annual)';
    case 'individual_project_price':
      return 'Individual Project Report Price';
    case 'full_report_price':
      return 'Full Report Price (Owner, Contractor Projects)';
    default:
      return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

export default function ReportPriceListPage({ refreshTrigger, onSuccess }: { refreshTrigger: number, onSuccess: () => void }) {
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


  const fetchData = async (page: number = 1, limit: number = 10, name?: string) => {
    setLoading(true);
    try {
      const response = await getReportPrice();
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
      console.error('Error fetching state list:', error);
      toast.error(error.message || 'Failed to load property types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.pageIndex + 1, pagination.pageSize);
  }, [refreshTrigger, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchData(1, pagination.pageSize, debouncedSearch);
  }, [debouncedSearch]);

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
        accessorKey: 'price',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Price"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <div className="">
                <DollarSign className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {row.original.value}
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
        accessorKey: 'key',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Key"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {formatReportPriceKey(row.original.key)}
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
            {formatDate(row.original.createdAt)}
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
            {formatDate(row.original.updatedAt)}
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
                  Edit Price
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
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter className="px-4 py-0">
          </CardFooter>
        </Card>
      </DataGrid>

      <ReportPriceFormDialog
        isOpen={isAddDialogOpen || !!editingPropertyType}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingPropertyType(null);
        }}
        state={editingPropertyType}
        onSuccess={() => fetchData(pagination.pageIndex + 1, pagination.pageSize)}
      />
    </>
  );
};