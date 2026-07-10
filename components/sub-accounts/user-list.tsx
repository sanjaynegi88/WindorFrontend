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
import { Search, Shield, Calendar, MoreVertical, Home, Building2, Briefcase, HardHat, Pencil, Trash2, UserPlus } from 'lucide-react';
import { cn, toPascalCase } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { getSubAccounts, deleteStaff } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/helpers';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/user-provider';
import { toast } from 'sonner';
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
import Link from 'next/link';

const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/20',
    PROPERTY_OWNER: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20',
    CITY_INSPECTOR: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20',
    INSURANCE_COMPANY: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20',
    CONTRACTOR: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/20',
};

const roleIcons: Record<string, any> = {
    ADMIN: <Shield className="size-3 mr-1.5" />,
    PROPERTY_OWNER: <Home className="size-3 mr-1.5" />,
    CITY_INSPECTOR: <Building2 className="size-3 mr-1.5" />,
    INSURANCE_COMPANY: <Briefcase className="size-3 mr-1.5" />,
    CONTRACTOR: <HardHat className="size-3 mr-1.5" />,
};



export default function UserList({ route }: { route: string }) {
    const router = useRouter();
    const { role } = useUser();
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 15,
    });

    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

    const fetchData = async (page: number = 1, limit: number = 15) => {
        setLoading(true);
        try {
            const response = await getSubAccounts(page, limit);
            setData(response.data);
            if (response.pagination) {
                setTotalRecords(response.pagination.total);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching user list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;

        try {
            const response = await deleteStaff(deletingUser.id);
            if (!response.success) {
                toast.error(response.message);
                return;
            }
            toast.success('User deleted successfully');
            setDeletingUser(null);
            fetchData(pagination.pageIndex + 1, pagination.pageSize);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const handleEditUser = (userId: string) => {
        router.push(`${route}/edit-user/${userId}`);
    };

    useEffect(() => {
        fetchData(pagination.pageIndex + 1, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'index',
                id: 'index',
                header: () => <div className="text-center text-[0.8125rem] font-normal text-foreground/70">#</div>,
                cell: ({ row }) => (
                    <div className="text-center font-medium text-muted-foreground/70">
                        {pagination.pageIndex * pagination.pageSize + row.index + 1}
                    </div>
                ),
                enableSorting: false,
                size: 60,
                meta: {
                    headerClassName: 'ps-4',
                    cellClassName: 'ps-4',
                },
                enableHiding: false,
                enableResizing: false,
            },
            {
                accessorKey: 'display_name',
                id: 'display_name',
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
                                <AvatarImage src={`${process.env.NEXT_PUBLIC_BASE_URL}${row.original.profile.profile_image_url}`} alt={row.original.email} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {row.original?.first_name?.charAt(0) || "A"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-sm leading-tight">{row.original.first_name} {row.original.last_name}</span>
                                <span className="text-xs text-muted-foreground">{row.original.email}</span>
                            </div>
                        </div>
                    );
                },
                size: 280,
                enableSorting: true,
                enableHiding: false,
                enableResizing: true,
            },
            {
                accessorKey: 'role',
                id: 'role',
                header: ({ column }) => (
                    <DataGridColumnHeader
                        title="System Role"
                        visibility={true}
                        column={column}
                    />
                ),
                cell: ({ row }) => {
                    const role = row.original.role ?? row.original.roleEntity?.role_name;
                    if (!role) return null;
                    return (
                        <Badge variant="outline" className={cn('font-medium whitespace-nowrap shadow-sm', roleColors[role])}>
                            {roleIcons[role] || <Shield className="size-3 mr-1.5" />}
                            {toPascalCase(role)}
                        </Badge>
                    );
                },
                size: 180,
                enableSorting: true,
                enableHiding: true,
                enableResizing: true,
            },
            {
                accessorKey: 'created_at',
                id: 'created_at',
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
                        {formatDate(row.original.created_at)}
                    </div>
                ),
                size: 160,
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
                                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                <DropdownMenuItem className='cursor-pointer' onClick={() => handleEditUser(row.original.id)}>
                                    <Pencil className="size-3.5 mr-2" />
                                    Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive cursor-pointer"
                                    onClick={() => setDeletingUser({ id: row.original.id, name: `${row.original.first_name} ${row.original.last_name}` })}
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
        [pagination],
    );

    const [columnOrder, setColumnOrder] = useState<string[]>(
        columns.map((column) => column.id as string),
    );

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                !searchQuery ||
                item.display_name.toLowerCase().includes(searchLower) ||
                item.email.toLowerCase().includes(searchLower) ||
                (item.role ?? item.roleEntity?.role_name ?? '').toLowerCase().includes(searchLower)
            );
        });
    }, [searchQuery, data]);

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
            <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DataGrid
                table={table}
                recordCount={totalRecords}
                tableClassNames={{
                    bodyRow: 'group/row',
                }}
                tableLayout={{
                    dense: true,
                    columnsResizable: true,
                }}
            >
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="px-4 py-3">
                        <CardHeading>
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        variant="sm"
                                        placeholder="Filter users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="ps-9 w-60"
                                    />
                                </div>

                            </div>
                        </CardHeading>
                        <CardToolbar>
                            <div className="flex items-center gap-2.5">

                                <Link href={`${route}/add-user`}>
                                    <Button size="sm">
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
