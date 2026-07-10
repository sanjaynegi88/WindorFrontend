"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { deleteMembership, getMembership } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MembershipDetailsDialog } from "./membership-details-dialog";
import { MembershipForm } from "@/components/forms/membership-form";
import { formatDate } from "@/lib/helpers";
import Link from "next/link";
import { toPascalCase } from "@/lib/utils";

export default function MembershipList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<any | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<
    string | null
  >(null);
  const [selectedMembership, setSelectedMembership] = useState<any | null>(
    null,
  );
  const [data, setData] = useState<any[]>([]);

  const handleEditMembership = (membership: any) => {
    setSelectedMembership(membership);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setSelectedMembership(null);
    fetchData();
  };

  const handleEditCancel = () => {
    setIsEditOpen(false);
    setSelectedMembership(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getMembership();
      if (response && response.data) {
        setData(response.data);
      } else {
        setData([]);
      }
    } catch (error: any) {
      console.error("Error fetching membership list:", error);
      toast.error(error.message || "Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMembership = async () => {
    if (!membershipToDelete) return;
    setLoading(true);
    const result = await deleteMembership(membershipToDelete.id);
    setLoading(false);
    setIsDeleteOpen(false);
    setMembershipToDelete(null);
    if (!result.success) {
      toast.error(result.message || 'Failed to delete membership');
      return;
    }
    toast.success('Membership deleted successfully');
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "index",
        id: "index",
        header: () => (
          <div className="text-center text-[0.8125rem] font-normal text-foreground/70">
            Id
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground/70">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </div>
        ),
        enableSorting: false,
        size: 60,
        meta: {
          headerClassName: "ps-4",
          cellClassName: "ps-4",
          skeleton: <Skeleton className="w-6 h-7" />,
        },
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: "membership_name",
        id: "membership_name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Membership Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground text-sm leading-snug wrap-break-word whitespace-normal">
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
          skeleton: <Skeleton className="w-6 h-7" />,
          cellClassName: "whitespace-normal overflow-visible",
        },
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Description"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="max-w-[300px] line-clamp-2 text-xs text-muted-foreground">
              {row.original.description || "No description"}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "targetRole",
        id: "targetRole",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Target Role"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const role = row.original.targetRole;
          const roleColors: Record<string, string> = {
            CONTRACTOR: "bg-blue-100 text-blue-800",
            INSURANCE_COMPANY: "bg-green-100 text-green-800",
            INSURANCE: "bg-green-100 text-green-800",
            INSPECTOR: "bg-purple-100 text-purple-800",
            PROPERTY_OWNER: "bg-orange-100 text-orange-800",
            MANUFACTURER: "bg-yellow-100 text-yellow-800",
            REALTOR: "bg-cyan-100 text-cyan-800",
          };
          return (
            <Badge
              className={`${roleColors[role] || "bg-gray-100 text-gray-800"} font-medium whitespace-nowrap`}
            >
              {toPascalCase(role) || "N/A"}
            </Badge>
          );
        },
        size: 180,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "roleSpecific",
        id: "roleSpecific",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Role Details"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const { targetRole, level, maxReports } = row.original;
          if (targetRole === "CONTRACTOR" && level) {
            return (
              <div className="text-xs text-muted-foreground">
                Level: <span className="font-medium">{level}</span>
              </div>
            );
          }
          if (targetRole === "INSURANCE_COMPANY" && maxReports) {
            return (
              <div className="text-xs text-muted-foreground">
                Max Reports: <span className="font-medium">{maxReports}</span>
              </div>
            );
          }
          return <div className="text-xs text-muted-foreground">N/A</div>;
        },
        size: 120,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "price_usd",
        id: "price_usd",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Price (Monthly/Yearly)"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const monthly = row.original.monthlyAmount;
          const yearly = row.original.yearlyAmount;
          const fmt = (val: any) =>
            val === null || val === undefined || val === ""
              ? "N/A"
              : `$${Number(val)}`;
          return (
            <div className="flex items-center gap-1.5 font-medium text-sm">
              {fmt(monthly)} <span className="text-lg">/</span> {fmt(yearly)}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Status"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Badge
              appearance="ghost"
              variant={row.original.isActive ? "success" : "destructive"}
            >
              {row.original.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        ),
        size: 160,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
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
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        id: "actions",
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
                  onClick={() => {
                    setSelectedMembershipId(row.original.id);
                    setIsDetailsOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Eye />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEditMembership(row.original)}
                  className="cursor-pointer"
                >
                  <Edit />
                  Edit Membership
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setMembershipToDelete(row.original);
                    setIsDeleteOpen(true);
                  }}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 />
                  Delete Membership
                </DropdownMenuItem>
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
    return data.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        (item.name || "").toLowerCase().includes(searchLower) ||
        (item.description || "").toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, data]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: any) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: "onChange",
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filteredData.length}
        isLoading={loading}
        tableClassNames={{
          bodyRow: "group/row",
        }}
        tableLayout={{
          dense: true,
          columnsResizable: true,
        }}
      >
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="px-4 py-3 flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardHeading className="w-full sm:w-auto">
              {/* <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="size-4 text-muted-foreground absolute inset-s-3 top-1/2 -translate-y-1/2" />
                  <Input
                    variant="sm"
                    placeholder="Search memberships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-full"
                  />
                </div>
              </div> */}
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <Link href="/admin/membership/add-membership" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="size-4 mr-2" /> New Membership
                  </Button>
                </Link>
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

      <MembershipDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedMembershipId(null);
        }}
        membershipId={selectedMembershipId}
      />

      {isEditOpen && selectedMembership && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <MembershipForm
              membership={selectedMembership}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {membershipToDelete?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteOpen(false);
                setMembershipToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMembership}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
