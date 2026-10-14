'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Returns a standardized TanStack ColumnDef for row selection checkboxes.
 * Uses DataGridTableRowSelectAll in the header and DataGridTableRowSelect in each row.
 */
export function getSelectColumnDef<T = any>(): ColumnDef<T> {
  return {
    id: 'select',
    header: () => (
      <div className="flex items-center justify-center w-full">
        <DataGridTableRowSelectAll size="sm" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-full">
        <DataGridTableRowSelect row={row} size="sm" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 44,
    meta: {
      headerClassName: 'text-center !px-0 !ps-0 !pe-0 w-11',
      cellClassName: 'text-center !px-0 !ps-0 !pe-0 w-11',
      skeleton: <Skeleton className="w-4.5 h-4.5 rounded-[3px] mx-auto" />,
    },
  };
}
