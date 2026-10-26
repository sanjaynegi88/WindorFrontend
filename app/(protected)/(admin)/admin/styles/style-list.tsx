"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Calendar,
  Trash2,
  Plus,
  AlertTriangle,
  Edit,
  MoreVertical,
  Layers,
  Filter,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getSelectColumnDef } from "@/components/tables/table-selection-helper";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StyleFormDialog } from "./style-form-dialog";
import {
  getStyles,
  deleteStyle,
  multiDelete,
  getComponentTypes,
  getProjectTypesforPropertyOwner,
} from "@/lib/actions";
import { formatDate } from "@/lib/helpers";
import { toPascalCase } from "@/lib/utils";

interface StyleListPageProps {
  refreshTrigger?: number;
  onSuccess?: () => void;
}

export default function StylesListPage({
  refreshTrigger = 0,
  onSuccess,
}: StyleListPageProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id?: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<any | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => Boolean(rowSelection[id])),
    [rowSelection],
  );

  const itemToDelete = useMemo(
    () => data.find((item: any) => String(item.id) === String(deleteId)),
    [data, deleteId],
  );

  const bulkSelectedWithInstallations = useMemo(
    () =>
      data.filter(
        (item: any) =>
          selectedIds.includes(String(item.id)) && Boolean(item.has_installations),
      ),
    [data, selectedIds],
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [response, response1] = await Promise.all([
          getComponentTypes().catch(() => null),
          getProjectTypesforPropertyOwner().catch(() => null),
        ]);

        const compTypes = Array.isArray(response?.data)
          ? response.data
          : response?.data?.report_types || response?.report_types || [];
        const ownerTypes = Array.isArray(response1?.data)
          ? response1.data
          : response1?.data?.report_types || response1?.report_types || [];

        const merged = [...compTypes, ...ownerTypes];
        const uniqueNames = new Set<string>();
        const combined = merged.filter((t: any) => {
          if (!t?.name) return false;
          const key = t.name.toUpperCase();
          if (uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        });

        setCategories(combined);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchData = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
  ) => {
    setLoading(true);
    try {
      const categoryParam =
        category && category !== "all" ? category : undefined;
      const response = await getStyles(
        page,
        limit,
        categoryParam,
        search?.trim() || undefined,
      );

      if (response && response.data) {
        setData(response.data);
        if (response.pagination) {
          setTotalRecords(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        } else if (typeof response.total === "number") {
          setTotalRecords(response.total);
          setTotalPages(Math.ceil(response.total / limit));
        }
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalRecords(response.length);
        setTotalPages(Math.ceil(response.length / limit));
      } else {
        setData([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (error: any) {
      console.error("Error fetching styles list:", error);
      toast.error(error.message || "Failed to load styles");
      setData([]);
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

  // Reset to page 0 when search or category filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    setRowSelection({});
    fetchData(
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedSearch,
      selectedCategory,
    );
  }, [
    refreshTrigger,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    selectedCategory,
  ]);

  const handleEdit = (style: any) => {
    setEditingStyle(style);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await deleteStyle(deleteId);
      if (!response.success) {
        toast.error(response.message || "Failed to delete style");
        return;
      }
      toast.success(response.message || "Style deleted successfully");
      fetchData(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch,
        selectedCategory,
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete style");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const response = await multiDelete("/api/styles/bulk", {
        ids: selectedIds,
      });
      if (!response.success) {
        toast.error(response.message || "Failed to delete selected styles");
        return;
      }
      toast.success(
        response.message ||
          `${selectedIds.length} style(s) deleted successfully`,
      );
      setRowSelection({});
      fetchData(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch,
        selectedCategory,
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete selected styles");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const { pageIndex, pageSize } = pagination;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      getSelectColumnDef(),
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
            {pageIndex * pageSize + row.index + 1}
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
        accessorKey: "style",
        id: "style",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Style Name"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const styleName = row.original.style || "";
          return (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {toPascalCase(styleName) || styleName || "—"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {styleName}
                </span>
              </div>
            </div>
          );
        },
        size: 220,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "category",
        id: "category",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Category"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const category =
            row.original.category ||
            row.original.category_name ||
            "";
          return category ? (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground text-sm leading-tight">
                {toPascalCase(category)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        },
        size: 160,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "created_at",
        id: "created_at",
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
            {row.original.created_at
              ? formatDate(row.original.created_at)
              : "—"}
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
        accessorKey: "updated_at",
        id: "updated_at",
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
            {row.original.updated_at
              ? formatDate(row.original.updated_at)
              : "—"}
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
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleEdit(row.original)}
                >
                  <Edit className="size-3.5 mr-2" />
                  Edit Style
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete Style
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
    pageCount: totalPages || Math.ceil(totalRecords / pagination.pageSize) || 1,
    manualPagination: true,
    getRowId: (row: any) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    columnResizeMode: "onChange",
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    variant="sm"
                    placeholder="Search styles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 ps-8 text-xs rounded-[6px] w-full"
                  />
                </div>

                <div className="w-full sm:w-52">
                  <Select
                    value={selectedCategory}
                    onValueChange={(val) => setSelectedCategory(val)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 text-xs rounded-[6px] w-full bg-white border border-[rgba(112,128,144,0.23)] text-[#1F2A44] font-asap font-medium shadow-none"
                    >
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name.toUpperCase()}>
                          {toPascalCase(cat.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                {selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    disabled={isBulkDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Selected ({selectedIds.length})
                  </Button>
                )}
                <Button
                  className="w-full sm:w-auto rounded-xl px-4 bg-primary text-white hover:bg-primary/90 shadow-sm"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Add Style
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

      <StyleFormDialog
        isOpen={isAddDialogOpen || !!editingStyle}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingStyle(null);
        }}
        styleItem={editingStyle}
        categories={categories}
        onSuccess={() => {
          fetchData(
            pagination.pageIndex + 1,
            pagination.pageSize,
            debouncedSearch,
            selectedCategory,
          );
          onSuccess?.();
        }}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-110">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-destructive mb-1">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-foreground">
                Confirm Style Deletion
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete this style? This action cannot be
              undone.
            </AlertDialogDescription>
            {itemToDelete?.has_installations && (
              <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs font-medium leading-relaxed">
                  Warning: This style is currently used in project(s). Deleting it may affect existing project configurations.
                </div>
              </div>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-semibold shadow-none"
            >
              {isDeleting ? "Deleting..." : "Delete Style"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        isOpen={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Selected Styles"
        description={
          bulkSelectedWithInstallations.length > 0
            ? `Are you sure you want to delete ${selectedIds.length} selected style(s)? Warning: ${bulkSelectedWithInstallations.length} of the selected style(s) are currently used in project(s). This action cannot be undone.`
            : `Are you sure you want to delete ${selectedIds.length} selected style(s)? This action cannot be undone.`
        }
        confirmText={
          isBulkDeleting ? "Deleting..." : `Delete (${selectedIds.length})`
        }
        cancelText="Cancel"
        onConfirm={handleConfirmBulkDelete}
        variant="destructive"
      />
    </>
  );
}
