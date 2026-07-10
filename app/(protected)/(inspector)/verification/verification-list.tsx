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
import { Filter, Search, Settings2, Hammer, Layout, Maximize2, DoorOpen, Calendar, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

type VerificationStatus = 'Pending' | 'Passed' | 'Failed' | 'Scheduled';

interface Verification {
  id: string;
  address: string;
  type: 'Roofing' | 'Siding' | 'Window' | 'Door';
  submittedDate: string;
  inspectionDate: string | null;
  status: VerificationStatus;
}

const demoData: Verification[] = [
  {
    id: 'VER-9921',
    address: '742 Evergreen Terrace, Springfield',
    type: 'Roofing',
    submittedDate: '2026-03-01',
    inspectionDate: '2026-03-15',
    status: 'Scheduled',
  },
  {
    id: 'VER-8832',
    address: '1094 Venables St, Vancouver',
    type: 'Window',
    submittedDate: '2026-02-28',
    inspectionDate: '2026-03-05',
    status: 'Passed',
  },
  {
    id: 'VER-7741',
    address: '1600 Pennsylvania Avenue, NW',
    type: 'Door',
    submittedDate: '2026-03-05',
    inspectionDate: null,
    status: 'Pending',
  },
  {
    id: 'VER-6655',
    address: '221B Baker Street, London',
    type: 'Siding',
    submittedDate: '2026-03-02',
    inspectionDate: '2026-03-04',
    status: 'Failed',
  },
  {
    id: 'VER-5540',
    address: '350 Fifth Avenue, New York',
    type: 'Roofing',
    submittedDate: '2026-03-08',
    inspectionDate: '2026-03-20',
    status: 'Scheduled',
  },
];

const statusColors: Record<VerificationStatus, string> = {
  Passed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const TypeIcon = ({ type }: { type: Verification['type'] }) => {
  switch (type) {
    case 'Roofing': return <Hammer className="size-3.5" />;
    case 'Siding': return <Layout className="size-3.5" />;
    case 'Window': return <Maximize2 className="size-3.5" />;
    case 'Door': return <DoorOpen className="size-3.5" />;
  }
};

export default function VerificationList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = useMemo<ColumnDef<Verification>[]>(
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
            title="Property"
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
            title="Type"
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
        size: 130,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'submittedDate',
        id: 'submittedDate',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Submitted"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground">{row.original.submittedDate}</div>
        ),
        size: 130,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'inspectionDate',
        id: 'inspectionDate',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Inspection Date"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-3.5" />
            {row.original.inspectionDate || 'Not set'}
          </div>
        ),
        size: 150,
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
                <DropdownMenuItem>Start Verification</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Submission</DropdownMenuItem>
                <DropdownMenuItem>Re-schedule</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
        enableHiding: false,
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const filteredData = useMemo(() => {
    return demoData.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        Object.values(item).join(' ').toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((demoData?.length || 0) / pagination.pageSize),
    getRowId: (row: Verification) => row.id,
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
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <Card className="border-none shadow-none">
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="size-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
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
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
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
                  placeholder="Search verifications..."
                  startIcon={<Search className="size-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60"
                />
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
  );
}
