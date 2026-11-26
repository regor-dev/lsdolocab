import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import type { SharedData } from '@/types';

type RoleData = {
    id: number;
    name: string;
    role_name?: string | null;
    guard_name?: string | null;
    permissions_count: number;
    users_count: number;
    created_at: string;
    permissions?: Array<{ id: number; name: string } | null> | null;
    users?: Array<{ id: number; name: string } | null> | null;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

interface Props {
    roles: PaginatedData<RoleData> | RoleData[];
    filters?: { search?: string | null } | null;
    auth?: SharedData['auth'];
}

const roleFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'unassigned', label: 'Unassigned' },
] as const;

type RoleFilter = (typeof roleFilterOptions)[number]['value'];

export default function RolesIndex({
    roles,
    filters,
    auth: propAuth,
}: Props) {
    const pageProps = usePage().props as Record<string, unknown>;
    const auth = (propAuth ?? pageProps.auth ?? {}) as SharedData['auth'];
    const user = auth?.user ?? null;
    const isAdmin =
        user?.roles?.some((r) => r.role_name?.toLowerCase() === 'admin') ?? false;

    const paginatedRoles = !Array.isArray(roles) && roles ? roles : null;
    const roleList: RoleData[] = Array.isArray(roles) ? roles : (roles?.data ?? []);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

    const [viewingRole, setViewingRole] = useState<RoleData | null>(null);
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);
    const [deletingRole, setDeletingRole] = useState<RoleData | null>(null);

    const editRoleForm = useForm({
        role_name: '',
    });

    const filteredRoles = roleList.filter((r) => {
        const roleName = (r.name ?? r.role_name ?? '').toLowerCase();
        const matchesSearch =
            !search || roleName.includes(search.toLowerCase());
        const matchesFilter =
            roleFilter === 'all'
                ? true
                : roleFilter === 'assigned'
                ? (r.users_count ?? 0) > 0
                : (r.users_count ?? 0) === 0;
        return matchesSearch && matchesFilter;
    });

    const roleCounts: Record<RoleFilter, number> = {
        all: roleList.length,
        assigned: roleList.filter((r) => (r.users_count ?? 0) > 0).length,
        unassigned: roleList.filter((r) => (r.users_count ?? 0) === 0).length,
    };

    function openEditRole(role: RoleData) {
        editRoleForm.clearErrors();
        setEditingRole(role);
        editRoleForm.setData({
            role_name: role.name ?? role.role_name ?? '',
        });
    }

    function handleUpdateRole(e: React.FormEvent) {
        e.preventDefault();
        if (!editingRole) return;
        editRoleForm.put(`/admin/role/${editingRole.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingRole(null);
            },
        });
    }

    function handleDeleteRole() {
        if (!deletingRole) return;
        router.delete(`/admin/role/${deletingRole.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingRole(null);
            },
        });
    }

    return (
        <AppLayout>
            <Head title="Roles" />

            <div className="space-y-6 p-6">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Role Management
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Roles</h1>
                    <p className="text-sm text-muted-foreground">
                        Create, edit, and manage system roles and permissions.
                    </p>
                </div>

                {/* CARD — Roles Management */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Roles
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">
                                Roles Management
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                View, filter, update, and manage all system roles.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input
                                type="text"
                                placeholder="Search role name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            {isAdmin && (
                                <Button
                                    type="button"
                                    onClick={() => router.get('/admin/role/create')}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Create Role
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {roleFilterOptions.map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                size="sm"
                                variant={roleFilter === tab.value ? 'default' : 'outline'}
                                onClick={() => setRoleFilter(tab.value)}
                                className="capitalize"
                            >
                                {tab.label} ({roleCounts[tab.value]})
                            </Button>
                        ))}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Created Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRoles.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoles.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">
                                            {r.name ?? r.role_name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {r.permissions_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {r.users_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {r.created_at
                                                ? new Date(r.created_at).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-3 text-xs font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRole(r)}
                                                    className="text-foreground hover:underline"
                                                >
                                                    View
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditRole(r)}
                                                        className="text-foreground hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingRole(r)}
                                                        className="text-destructive hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {paginatedRoles && paginatedRoles.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                            {paginatedRoles.prev_page_url && (
                                <Link
                                    href={paginatedRoles.prev_page_url}
                                    preserveScroll
                                    className="hover:underline"
                                >
                                    Previous
                                </Link>
                            )}
                            <span className="text-muted-foreground">
                                Page {paginatedRoles.current_page} of {paginatedRoles.last_page}
                            </span>
                            {paginatedRoles.next_page_url && (
                                <Link
                                    href={paginatedRoles.next_page_url}
                                    preserveScroll
                                    className="hover:underline"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* MODAL — View Role Details */}
                <Dialog
                    open={!!viewingRole}
                    onOpenChange={(open) => !open && setViewingRole(null)}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Role:{' '}
                                {viewingRole?.name ?? viewingRole?.role_name ?? '—'}
                            </DialogTitle>
                            <DialogDescription>
                                Role details, permission and user assignment counts.
                            </DialogDescription>
                        </DialogHeader>
                        {viewingRole && (
                            <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Role
                                        </Label>
                                        <p className="font-medium">
                                            {viewingRole.name ?? viewingRole.role_name ?? '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Guard
                                        </Label>
                                        <p className="font-medium">
                                            {viewingRole.guard_name ?? 'web'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Permissions
                                        </Label>
                                        <p className="font-mono font-medium">
                                            {viewingRole.permissions_count ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Users
                                        </Label>
                                        <p className="font-mono font-medium">
                                            {viewingRole.users_count ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Created
                                        </Label>
                                        <p className="font-medium">
                                            {viewingRole.created_at
                                                ? new Date(viewingRole.created_at).toLocaleDateString()
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                                {(viewingRole.permissions ?? []).length > 0 && (
                                    <div className="border-t pt-3">
                                        <Label className="text-xs text-muted-foreground">
                                            Permissions
                                        </Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(viewingRole.permissions ?? []).map((p) => (
                                                <Badge
                                                    key={p?.id}
                                                    variant="outline"
                                                    className="text-xs capitalize"
                                                >
                                                    {p?.name ?? '—'}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" onClick={() => setViewingRole(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL — Edit Role */}
                <Dialog
                    open={!!editingRole}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Role</DialogTitle>
                            <DialogDescription>
                                Update details for role{' '}
                                <span className="font-medium">
                                    {editingRole?.name ?? editingRole?.role_name}
                                </span>
                                .
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            {Object.keys(editRoleForm.errors).length > 0 && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                    {Object.values(editRoleForm.errors).map((err, idx) => (
                                        <div key={idx}>{err}</div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={editRoleForm.data.role_name}
                                    onChange={(e) =>
                                        editRoleForm.setData('role_name', e.target.value)
                                    }
                                    disabled={editRoleForm.processing}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingRole(null)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editRoleForm.processing}>
                                    {editRoleForm.processing ? 'Updating...' : 'Update Role'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL — Delete Role Confirmation */}
                <Dialog
                    open={!!deletingRole}
                    onOpenChange={(open) => !open && setDeletingRole(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Role</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete role{' '}
                                <span className="font-medium text-foreground">
                                    {deletingRole?.name ?? deletingRole?.role_name}
                                </span>
                                ? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingRole(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteRole}
                            >
                                Delete Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
