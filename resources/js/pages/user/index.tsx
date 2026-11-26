import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Edit3, Eye, Mail, MoreHorizontal, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const USERS_URL = '/admin/user';

export interface Role {
    id: number;
    role_name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    age?: number | null;
    address?: string | null;
    img?: string | null;
    has_img?: boolean;
    updated_at?: string;
    roles?: Role[];
}

interface UserIndexProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { search?: string; role?: string };
    roles?: Role[];
}

export default function UserIndex({ users, filters, roles = [] }: UserIndexProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [role, setRole] = useState(filters?.role || 'all');
    const isInitialMount = useRef(true);

    // Debounced search and filter auto-submit
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                USERS_URL,
                {
                    search,
                    role: role === 'all' ? '' : role,
                },
                { preserveState: true, replace: true, preserveScroll: true, only: ['users', 'filters'] },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, role]);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user account?')) {
            router.delete(`${USERS_URL}/${id}`);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Users', href: USERS_URL },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
                        <p className="text-muted-foreground text-sm">Manage user accounts, system access credentials, and assigned roles.</p>
                    </div>
                    <Button onClick={() => router.get(`${USERS_URL}/create`)} className="gap-2">
                        <Plus className="h-4 w-4" /> Add User
                    </Button>
                </div>

                <Card className="w-full">
                    <CardHeader className="pb-4">
                        <CardTitle>Total Users</CardTitle>
                        <CardDescription>
                            Total records: <span className="text-foreground font-semibold">{users?.total ?? 0}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                            {/* Search Bar */}
                            <div className="relative w-full sm:w-80">
                                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                <Input
                                    placeholder="Type to search user name or email..."
                                    className="pr-8 pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setSearch('')}
                                        className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Role Filter Dropdown with Explicit Admin, Staff, and Customer Options */}
                            <Select value={role} onValueChange={(val) => setRole(val)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>

                                    {/* Standard predefined role filters */}
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Staff">Staff</SelectItem>
                                    <SelectItem value="Customer">Customer</SelectItem>

                                    {/* Dynamic Database Roles fallback */}
                                    {roles
                                        .filter((r) => !['Admin', 'Staff', 'Customer'].includes(r.role_name))
                                        .map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.role_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Users Table */}
                        <div className="w-full overflow-hidden rounded-md border">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[35%]">User Name</TableHead>
                                        <TableHead className="w-[25%]">Email Address</TableHead>
                                        <TableHead className="w-[20%]">System Role</TableHead>
                                        <TableHead className="w-[20%] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.data && users.data.length > 0 ? (
                                        users.data.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {u.has_img ? (
                                                            <img
                                                                src={`${USERS_URL}/${u.id}/avatar?v=${Date.parse(u.updated_at ?? '') || 0}`}
                                                                alt={u.name}
                                                                width={36}
                                                                height={36}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="h-9 w-9 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <Users className="text-muted-foreground h-4 w-4" />
                                                        )}
                                                        {u.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="text-muted-foreground h-3.5 w-3.5" />
                                                        {u.email}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.roles && u.roles.length > 0 ? (
                                                            u.roles.map((r) => (
                                                                <Badge key={r.id} variant="outline" className="font-normal">
                                                                    {r.role_name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <Badge variant="secondary" className="text-muted-foreground font-normal">
                                                                No Role
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${u.name}`}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => router.get(`${USERS_URL}/${u.id}`)}
                                                                className="cursor-pointer gap-2"
                                                            >
                                                                <Eye className="h-4 w-4" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => router.get(`${USERS_URL}/${u.id}/edit`)}
                                                                className="cursor-pointer gap-2"
                                                            >
                                                                <Edit3 className="h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(u.id)}
                                                                className="text-destructive cursor-pointer gap-2"
                                                            >
                                                                <Trash2 className="h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                                                No users found matching criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {users?.links && users.links.length > 3 && (
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-muted-foreground text-sm">
                                    Page {users.current_page} of {users.last_page}
                                </span>
                                <div className="flex gap-1">
                                    {users.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true, only: ['users', 'filters'] })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
