"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  X,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Home,
  Building2,
  Briefcase,
  HardHat,
  Pencil,
  Trash2,
  UserPlus,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { cn, toPascalCase } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  getUserList,
  deleteUserAdmin,
  getUserById,
  getRoles,
  setUserPasswordAdmin,
} from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
import Link from "next/link";

type UserRole =
  | "ADMIN"
  | "PROPERTY_OWNER"
  | "CITY_INSPECTOR"
  | "INSURANCE_COMPANY"
  | "CONTRACTOR"
  | "REALTOR"
  | "MANUFACTURER";
type UserStatus = "Active" | "Pending" | "Inactive";

interface SystemUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  profile_image_url?: string;
  sub_account?: boolean;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-500/20",

  PROPERTY_OWNER:
    "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-500/20",

  CITY_INSPECTOR:
    "bg-orange-500/10 text-orange-700 border-orange-200 dark:border-orange-500/20",

  INSURANCE_COMPANY:
    "bg-sky-500/10 text-sky-700 border-sky-200 dark:border-sky-500/20",

  CONTRACTOR:
    "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-500/20",

  MANUFACTURER:
    "bg-teal-500/10 text-teal-700 border-teal-200 dark:border-teal-500/20",

  REALTOR:
    "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200 dark:border-fuchsia-500/20",

  GUEST:
    "bg-slate-500/10 text-slate-700 border-slate-200 dark:border-slate-500/20",
};

const planLevelColors: Record<string, string> = {
  FREE: "bg-slate-500/10 text-slate-700 border-slate-200 dark:border-slate-500/20",
  GOLD: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-500/20",
  SILVER:
    "bg-slate-400/15 text-slate-700 border-slate-300 dark:border-slate-500/20",
  PRO: "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-500/20",
  ENTERPRISE:
    "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-500/20",
  STANDARD: "bg-sky-500/10 text-sky-700 border-sky-200 dark:border-sky-500/20",
};

const getPlanLevelColor = (level?: string | null) => {
  if (!level)
    return "bg-slate-500/10 text-slate-700 border-slate-200 dark:border-slate-500/20";
  const upper = level.toUpperCase();
  for (const [key, val] of Object.entries(planLevelColors)) {
    if (upper.includes(key)) return val;
  }
  return "bg-slate-500/10 text-slate-700 border-slate-200 dark:border-slate-500/20";
};

const roleIcons: Record<string, any> = {
  ADMIN: <Shield className="size-3 mr-1.5" />,
  PROPERTY_OWNER: <Home className="size-3 mr-1.5" />,
  CITY_INSPECTOR: <Building2 className="size-3 mr-1.5" />,
  INSURANCE_COMPANY: <Briefcase className="size-3 mr-1.5" />,
  CONTRACTOR: <HardHat className="size-3 mr-1.5" />,
  MANUFACTURER: <Building2 className="size-3 mr-1.5" />,
  REALTOR: <UserPlus className="size-3 mr-1.5" />,
  GUEST: <User className="size-3 mr-1.5" />,
};

const statusIcons: Record<string, any> = {
  Active: <CheckCircle2 className="size-3 text-emerald-500" />,
  Pending: <Clock className="size-3 text-amber-500" />,
  Inactive: <X className="size-3 text-red-500" />,
};

const changePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

function ChangePasswordDialog({
  open,
  onOpenChange,
  user,
}: ChangePasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ password: "", confirmPassword: "" });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, form]);

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      const result = await setUserPasswordAdmin(user.id, {
        password: values.password,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#1F2A44]">
            <KeyRound className="size-5 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Enter a new password for{" "}
            <span className="font-semibold text-foreground">
              {user?.name || "the user"}
            </span>
            {user?.email && (
              <span className="block text-xs text-muted-foreground/80 mt-0.5">
                {user.email}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-1"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground/80">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="pr-10 h-10 rounded-lg text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground/80">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="pr-10 h-10 rounded-lg text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function UserList() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [roles, setRoles] = useState<
    { id?: string; name?: string; role?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingUser, setDeletingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingUserData, setViewingUserData] = useState<any | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<{
    id: string;
    name: string;
    email?: string;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles().catch(() => null);
        const rawRoles = Array.isArray(response)
          ? response
          : response?.data || response?.roles || [];
        setRoles(rawRoles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const fetchData = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
  ) => {
    setLoading(true);
    try {
      const roleParam = role && role !== "all" ? role : undefined;
      const response = await getUserList(page, limit, roleParam, search);
      const mappedData = (response.data || []).map((user: any) => ({
        id: user.id || user.firebase_uid,
        first_name: user.first_name || "N/A",
        last_name: user.last_name || "N/A",
        email: user.email,
        role: user.role || "GUEST",
        status: "Active",
        created_at: user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : "N/A",
        profile_image_url: user.profile?.profile_image_url,
        sub_account: user.sub_account || false,
      }));
      setData(mappedData);
      if (response.pagination) {
        setTotalRecords(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching user list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const result = await deleteUserAdmin(deletingUser.id);

      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("User deleted successfully");
      setDeletingUser(null);
      fetchData(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch,
        selectedRole,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleViewDetails = async (userId: string) => {
    setViewingUserId(userId);
    setViewingUserData(null);
    setLoadingDetails(true);
    try {
      const data = await getUserById(userId);
      setViewingUserData(data);
    } catch (err: any) {
      toast.error("Failed to load user details");
      setViewingUserId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 0 when search or role changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, selectedRole]);

  useEffect(() => {
    fetchData(
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedSearch,
      selectedRole,
    );
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    selectedRole,
  ]);

  const { pageIndex, pageSize } = pagination;

  const columns = useMemo<ColumnDef<SystemUser>[]>(
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
        accessorKey: "display_name",
        id: "display_name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="User"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage
                  src={
                    row.original.profile_image_url &&
                    row.original.profile_image_url !== "undefined" &&
                    row.original.profile_image_url !== "null"
                      ? row.original.profile_image_url.startsWith("http")
                        ? row.original.profile_image_url
                        : `${process.env.NEXT_PUBLIC_BASE_URL}${row.original.profile_image_url.startsWith("/") ? row.original.profile_image_url : `/${row.original.profile_image_url}`}`
                      : ""
                  }
                  alt={row.original.email}
                />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {row.original?.first_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">
                  {row.original.first_name} {row.original.last_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.original.email}
                </span>
              </div>
            </div>
          );
        },
        size: 280,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          skeleton: <Skeleton className="w-6 h-7" />,
        },
      },
      {
        accessorKey: "role",
        id: "role",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="System Role"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <Badge
              variant="outline"
              className={cn(
                "font-medium whitespace-nowrap shadow-sm",
                roleColors[role],
              )}
            >
              {roleIcons[role] || <Shield className="size-3 mr-1.5" />}
              {toPascalCase(role)}
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
        accessorKey: "sub_account",
        id: "sub_account",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Account Type"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const isSub = row.original.sub_account;

          if (isSub) {
            return (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 border-amber-200 font-medium whitespace-nowrap shadow-sm"
              >
                Staff
              </Badge>
            );
          }

          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 border-emerald-200 font-medium whitespace-nowrap shadow-sm"
            >
              Main User
            </Badge>
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
        accessorKey: "status",
        id: "status",
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
            <div className="flex items-center gap-2">
              {statusIcons[status]}
              <span className="text-sm font-medium">{status}</span>
            </div>
          );
        },
        size: 120,
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
            title="Joined Date"
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="size-3" />
            {row.original.created_at}
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
                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleViewDetails(row.original.id)}
                >
                  <Eye className="size-3.5 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/users/edit-user/${row.original.id}`)
                  }
                >
                  <Pencil className="size-3.5 mr-2" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setChangePasswordUser({
                      id: row.original.id,
                      name:
                        `${row.original.first_name} ${row.original.last_name}`.trim() ||
                        row.original.email,
                      email: row.original.email,
                    });
                    setChangePasswordOpen(true);
                  }}
                >
                  <KeyRound className="size-3.5 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() =>
                    setDeletingUser({
                      id: row.original.id,
                      name: `${row.original.first_name} ${row.original.last_name}`,
                    })
                  }
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete User
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
    getRowId: (row: SystemUser) => row.id,
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
    <>
      <Dialog
        open={!!viewingUserId}
        onOpenChange={(open) => {
          if (!open) setViewingUserId(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-[#1F2A44]">
              <User className="size-5 text-primary" />
              User Profile Details
            </DialogTitle>
          </DialogHeader>

          {loadingDetails && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading user details...
              </p>
            </div>
          )}

          {!loadingDetails && viewingUserData && (
            <div className="space-y-6 pt-2">
              {/* Header profile summary card */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="size-16 border-2 border-background shadow-sm">
                  <AvatarImage
                    src={
                      viewingUserData.profile?.profile_image_url &&
                      viewingUserData.profile.profile_image_url !==
                        "undefined" &&
                      viewingUserData.profile.profile_image_url !== "null"
                        ? viewingUserData.profile.profile_image_url.startsWith(
                            "http",
                          )
                          ? viewingUserData.profile.profile_image_url
                          : `${process.env.NEXT_PUBLIC_BASE_URL}${viewingUserData.profile.profile_image_url.startsWith("/") ? viewingUserData.profile.profile_image_url : `/${viewingUserData.profile.profile_image_url}`}`
                        : ""
                    }
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {viewingUserData.first_name?.charAt(0) || "U"}
                    {viewingUserData.last_name?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate">
                    {viewingUserData.first_name} {viewingUserData.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {viewingUserData.email}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium whitespace-nowrap shadow-xs",
                        roleColors[viewingUserData.role],
                      )}
                    >
                      {roleIcons[viewingUserData.role] || (
                        <Shield className="size-3 mr-1.5" />
                      )}
                      {toPascalCase(viewingUserData.role)}
                    </Badge>
                    {viewingUserData.sub_account && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 border-amber-200 font-medium"
                      >
                        Sub Account
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid of basic/core fields */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Core Account Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-card">
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground">
                      User ID
                    </span>
                    <span className="text-sm font-semibold font-mono text-foreground break-all">
                      {viewingUserData.id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground">
                      Location
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {viewingUserData.city_name || viewingUserData.zip ? (
                        <>
                          {viewingUserData.city_name || ""}
                          {viewingUserData.state_name
                            ? `, ${viewingUserData.state_name}`
                            : ""}
                          {viewingUserData.zip
                            ? ` (${viewingUserData.zip})`
                            : ""}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground">
                      Joined Date
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {viewingUserData.created_at
                        ? new Date(viewingUserData.created_at).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  {viewingUserData.sub_account && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Parent Account
                      </span>
                      <span className="text-sm font-semibold font-mono text-foreground break-all">
                        {viewingUserData.parent_email || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details section */}
              {viewingUserData.profile && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Profile Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    <div>
                      <span className="block text-xs font-medium text-muted-foreground">
                        Display Name
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {viewingUserData.profile.display_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-muted-foreground">
                        Company Name
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {viewingUserData.profile.company_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-muted-foreground">
                        Has Membership
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          viewingUserData.profile.has_membership
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {viewingUserData.profile.has_membership ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-muted-foreground">
                        In Directory
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          viewingUserData.profile.is_directory
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {viewingUserData.profile.is_directory ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Membership Details Section */}
              {(() => {
                const subscription =
                  viewingUserData.current_subscription ||
                  viewingUserData.user?.current_subscription;

                return (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-primary" />
                      Membership Details
                    </h4>
                    {subscription ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-card">
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Plan Name
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {subscription.plan?.name || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Plan Level
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-semibold text-xs mt-0.5",
                              getPlanLevelColor(subscription.plan?.level),
                            )}
                          >
                            {toPascalCase(subscription.plan?.level || "N/A")}
                          </Badge>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Status
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-semibold text-xs mt-0.5",
                              subscription.status?.toUpperCase() === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                                : "bg-amber-500/10 text-amber-700 border-amber-200",
                            )}
                          >
                            {subscription.status || "N/A"}
                          </Badge>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Billing Cycle
                          </span>
                          <span className="text-sm font-semibold text-foreground capitalize">
                            {subscription.billing_cycle || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Period End / Renewal Date
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {subscription.current_period_end
                              ? new Date(
                                  subscription.current_period_end,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-muted-foreground">
                            Auto-Renewal
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-semibold text-xs mt-0.5",
                              subscription.autoRenewalEnabled
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {subscription.autoRenewalEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-border/60 bg-card text-sm text-muted-foreground">
                        No active membership subscription
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Form Details Section */}
              {viewingUserData.form_details && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Form / Role-Specific Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-card">
                    {viewingUserData.form_details.title && (
                      <div className="sm:col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground">
                          Title
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.title}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.companyAddress && (
                      <div className="sm:col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground">
                          Company Address
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.companyAddress}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.propertyAddress && (
                      <div className="sm:col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground">
                          Property Address
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.propertyAddress}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.websiteUrl && (
                      <div className="sm:col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground">
                          Website
                        </span>
                        <a
                          href={viewingUserData.form_details.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
                        >
                          {viewingUserData.form_details.websiteUrl}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                    {viewingUserData.form_details.mobilePhone && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          Mobile Phone
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.mobilePhone}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.companyPhone && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          Company Phone
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.companyPhone}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.licenseNumber && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          License Number
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.licenseNumber}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.cityOfficial && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          City Official
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.cityOfficial}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.cityAddress && (
                      <div className="sm:col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground">
                          City Address
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.cityAddress}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.cityPhone && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          City Phone
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.cityPhone}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.ownerDateStart && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          Ownership Start Date
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.ownerDateStart}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.ownerDateEnd && (
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground">
                          Ownership End Date
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {viewingUserData.form_details.ownerDateEnd}
                        </span>
                      </div>
                    )}
                    {viewingUserData.form_details.service_types_details &&
                      viewingUserData.form_details.service_types_details
                        .length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                            Services Provided
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {viewingUserData.form_details.service_types_details.map(
                              (service: any) => (
                                <Badge
                                  key={service.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {service.service_name}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={() => setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={(open) => {
          setChangePasswordOpen(open);
          if (!open) setChangePasswordUser(null);
        }}
        user={changePasswordUser}
      />

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
                  <Search className="size-4 text-muted-foreground absolute inset-s-3 top-1/2 -translate-y-1/2" />
                  <Input
                    variant="sm"
                    placeholder="Filter users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-full"
                  />
                </div>
                <div className="w-full sm:w-52">
                  <Select
                    value={selectedRole}
                    onValueChange={(val) => setSelectedRole(val)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 text-xs rounded-[6px] w-full bg-white border border-[rgba(112,128,144,0.23)] text-[#1F2A44] font-asap font-medium shadow-none"
                    >
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((r: any) => {
                        const roleVal =
                          typeof r === "string"
                            ? r
                            : r.role_name || r.name || r.role || r.id || "";
                        if (!roleVal) return null;
                        return (
                          <SelectItem key={r.id || roleVal} value={roleVal}>
                            {toPascalCase(roleVal)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeading>
            <CardToolbar className="w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <Link href="/admin/users/add-user" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto">
                    <UserPlus className="size-4 mr-2" /> New User
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
    </>
  );
}
