'use client';

import { useMemo, useState } from 'react';
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
  Filter,
  Settings2,
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
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ReusableDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  filterButtonText?: string;
  searchFields?: (keyof T)[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onSearch?: (query: string) => void;
  className?: string;
}

// Utility function to convert features object to readable format
export const formatFeaturesForDisplay = (features: Record<string, string | number | boolean>) => {
  return Object.entries(features).map(([key, value]) => {
    const readableKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return { key: readableKey, value };
  });
};

// Utility function to safely parse JSON features
export const parseFeatures = (features: any): Record<string, string | number | boolean> => {
  if (typeof features === 'string') {
    try {
      return JSON.parse(features);
    } catch {
      return {};
    }
  }
  return features || {};
};

// Utility function to convert features to JSON string
export const stringifyFeatures = (features: Record<string, string | number | boolean>): string => {
  try {
    return JSON.stringify(features);
  } catch {
    return '{}';
  }
};

export function ReusableDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search...",
  filterButtonText = "Filter",
  searchFields = [],
  initialPageSize = 15,
  pageSizeOptions = [5, 10, 15, 30, 50, 100],
  onSearch,
  className,
}: ReusableDataTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      
      // If specific search fields are provided, search only in those fields
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const value = item[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      }
      
      // Otherwise, search in all string/number fields
      return Object.values(item).some(value => {
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [searchQuery, data, searchFields]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: T, index) => row.id || String(index),
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <Card>
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
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
      className={className}
    >
      <Card>
        <CardHeader className="px-4 py-3">
          <CardHeading>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 md:flex-initial">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  className="bg-muted/20 border-none h-10 w-full md:w-[300px]"
                  startIcon={<Search className="size-4" />}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Button size="sm" variant="outline">
                <Filter className="size-3.5" />
                {filterButtonText}
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
            sizes={pageSizeOptions}
          />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}