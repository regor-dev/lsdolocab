import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SharedData } from '@/types';

type OrderItem = {
    id: number;
    product: { name: string } | null;
    quantity: number;
    sub_total: number;
};

type OrderLog = {
    id: number;
    created_at: string;
    user?: { name: string | null };
};

type OrderData = {
    id: number;
    order_number: string;
    status: string;
    customer_name: string | null;
    customer_email: string | null;
    order_date?: string | null;
    user: { name: string | null; email: string | null } | null;
    items: OrderItem[];
    orderItems?: OrderItem[];
    orderLogs: OrderLog[];
    items_count?: number | null;
    total: number;
};

const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

function statusBadgeVariant(
    status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch ((status ?? '').toLowerCase()) {
        case 'completed':
            return 'default';
        case 'cancelled':
            return 'destructive';
        case 'processing':
            return 'outline';
        default:
            return 'secondary';
    }
}

export default function StaffOrdersPage() {
    const { auth, flash, orders, order } = usePage<SharedData>().props;
    const orderList: OrderData[] = Array.isArray(orders)
        ? orders
        : ((orders as { data?: OrderData[] })?.data ?? []);
    const currentOrder: OrderData | null = (order ?? null) as OrderData | null;
    const detailOrderItems: OrderItem[] = currentOrder
        ? currentOrder.orderItems ?? currentOrder.items ?? []
        : [];

    const paginatedOrders =
        !Array.isArray(orders) && orders
            ? (orders as {
                  current_page: number;
                  last_page: number;
                  prev_page_url: string | null;
                  next_page_url: string | null;
                  links: { url: string | null; label: string; active: boolean }[];
              })
            : null;

    const rawRoles = [
        ...(Array.isArray(auth?.roles) ? auth.roles : []),
        ...(Array.isArray(auth?.user?.roles) ? auth.user.roles : []),
        ...(auth?.user?.role ? [auth.user.role] : []),
    ];
    const isStaffOrAdmin = rawRoles.some((r) => {
        const name = typeof r === 'string' ? r : r?.name;
        const roleName = typeof name === 'string' ? name.toLowerCase() : '';
        return roleName === 'staff' || roleName === 'admin';
    });

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    if (!isStaffOrAdmin) {
        return (
            <AppLayout>
                <Head title="Access Denied" />
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have permission to view orders.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const filteredOrders = orderList.filter((o) => {
        const normalizedStatus = (o.status ?? '').toLowerCase();
        const term = search.toLowerCase();
        const matchesSearch =
            !term ||
            o.order_number?.toLowerCase().includes(term) ||
            o.user?.name?.toLowerCase().includes(term) ||
            o.user?.email?.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts: Record<StatusFilter, number> = {
        all: orderList.length,
        pending: orderList.filter((o) => (o.status ?? '').toLowerCase() === 'pending').length,
        processing: orderList.filter((o) => (o.status ?? '').toLowerCase() === 'processing').length,
        completed: orderList.filter((o) => (o.status ?? '').toLowerCase() === 'completed').length,
        cancelled: orderList.filter((o) => (o.status ?? '').toLowerCase() === 'cancelled').length,
    };

    function handleStatusUpdate(orderId: number, value: string) {
        if (!value) return;
        const target =
            orderList.find((o) => o.id === orderId) ??
            (currentOrder?.id === orderId ? currentOrder : null);
        if (value === (target?.status ?? '').toLowerCase()) return;
        router.patch(route('staff-orders.status', orderId), { status: value }, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout>
            <Head title="Staff Orders" />

            {(flash?.success || flash?.message) && (
                <div className="mb-4 p-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm">
                    {flash.success ?? flash.message}
                </div>
            )}

            <div className="space-y-6 p-6">
                {/* Page header */}
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        STORE OPERATIONS
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        View customer orders, filter by fulfillment status, and manage order details.
                    </p>
                </div>

                {currentOrder ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline" size="sm">
                                <a href={route('staff-orders.index')}>← Back to orders</a>
                            </Button>
                            <h2 className="text-lg font-semibold">
                                Order #{currentOrder.order_number}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60">
                                <CardHeader>
                                    <CardTitle>Order Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Customer
                                            </Label>
                                            <p className="font-medium">
                                                {currentOrder.customer_name ||
                                                    currentOrder.user?.name ||
                                                    'Walk-in Customer'}
                                            </p>
                                            {(currentOrder.customer_email ||
                                                currentOrder.user?.email) && (
                                                <div className="text-xs text-muted-foreground">
                                                    {currentOrder.customer_email ||
                                                        currentOrder.user?.email}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Order Number
                                            </Label>
                                            <p className="font-medium font-mono">
                                                {currentOrder.order_number}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Status</Label>
                                            <Badge variant={statusBadgeVariant(currentOrder.status)}>
                                                {(currentOrder.status ?? '').toLowerCase()}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Total</Label>
                                            <p className="font-medium">
                                                ₱{Number(currentOrder.total ?? 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Order Date
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {currentOrder.order_date
                                                    ? new Date(currentOrder.order_date).toLocaleDateString()
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs text-muted-foreground">Items</Label>
                                            <p className="text-sm">
                                                {Array.isArray(detailOrderItems) &&
                                                detailOrderItems.length > 0
                                                    ? `${detailOrderItems.reduce(
                                                        (sum, item) =>
                                                            sum + Number(item.quantity ?? 1),
                                                        0,
                                                    )} item(s)`
                                                    : currentOrder?.items_count != null
                                                        ? `${currentOrder.items_count} item(s)`
                                                        : '0 items'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {currentOrder.status !== 'completed' &&
                                currentOrder.status !== 'cancelled' && (
                                <Card className="rounded-xl border border-zinc-800 bg-zinc-950/60">
                                    <CardHeader>
                                        <CardTitle>Update Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <Select
                                                value={currentOrder.status}
                                                onValueChange={(value) =>
                                                    value &&
                                                    handleStatusUpdate(currentOrder.id, value)
                                                }
                                                size="sm"
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder={
                                                        (currentOrder.status ?? '').toLowerCase()
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions
                                                        .filter((o) => o.value !== 'all')
                                                        .map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60">
                                <CardHeader>
                                    <CardTitle>Order Logs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="-space-y-px">
                                        {(currentOrder.orderLogs ?? []).length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No logs yet.
                                            </p>
                                        ) : (
                                            <Table>
                                                <TableBody>
                                                    {(currentOrder.orderLogs ?? []).map((log) => (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="w-48 text-sm text-muted-foreground">
                                                                {new Date(
                                                                    log.created_at
                                                                ).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {log.user?.name ?? 'System'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    CUSTOMER ORDERS
                                </p>
                                <h2 className="mt-0.5 text-lg font-semibold">Order Queue</h2>
                                <p className="text-xs text-muted-foreground">
                                    Track, filter, and update customer order fulfillment status.
                                </p>
                            </div>
                            <Input
                                type="text"
                                placeholder="Search order #, customer, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-80"
                            />
                        </div>

                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {statusOptions.map((tab) => (
                                <Button
                                    key={tab.value}
                                    type="button"
                                    size="sm"
                                    variant={statusFilter === tab.value ? 'default' : 'outline'}
                                    onClick={() => setStatusFilter(tab.value)}
                                >
                                    {tab.label} ({statusCounts[tab.value]})
                                </Button>
                            ))}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((o) => {
                                        return (
                                            <TableRow key={o.id}>
                                                <TableCell className="font-mono font-medium">
                                                    {o.order_number}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {o.customer_name ||
                                                        o.user?.name ||
                                                        'Walk-in Customer'}
                                                    {(o.customer_email || o.user?.email) && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {o.customer_email || o.user?.email}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-xs text-sm">
                                                    {Array.isArray(o.items) && o.items.length > 0
                                                        ? `${o.items.reduce(
                                                            (sum, item) => sum + Number(item.quantity ?? 1),
                                                            0,
                                                        )} item(s)`
                                                        : o.items_count != null
                                                            ? `${o.items_count} item(s)`
                                                            : '0 items'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {o.order_date
                                                        ? new Date(o.order_date).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₱{Number(o.total ?? 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusBadgeVariant(o.status)}>
                                                        {(o.status ?? '').toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Button asChild size="sm" variant="outline">
                                                            <a href={route('staff-orders.show', o.id)}>
                                                                View Details
                                                            </a>
                                                        </Button>
                                                        {o.status !== 'completed' &&
                                                            o.status !== 'cancelled' && (
                                                            <Select
                                                                value={o.status}
                                                                onValueChange={(value) =>
                                                                    value &&
                                                                    handleStatusUpdate(o.id, value)
                                                                }
                                                                size="sm"
                                                            >
                                                                <SelectTrigger className="w-32">
                                                                    <SelectValue placeholder={
                                                                        (o.status ?? '').toLowerCase()
                                                                    } />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {statusOptions
                                                                        .filter((s) => s.value !== 'all')
                                                                        .map((opt) => (
                                                                            <SelectItem
                                                                                key={opt.value}
                                                                                value={opt.value}
                                                                            >
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {paginatedOrders?.links && paginatedOrders.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                                {paginatedOrders.prev_page_url && (
                                    <Link
                                        href={paginatedOrders.prev_page_url}
                                        preserveScroll
                                        className="hover:underline"
                                    >
                                        Previous
                                    </Link>
                                )}
                                <span className="text-muted-foreground">
                                    Page {paginatedOrders.current_page} of{' '}
                                    {paginatedOrders.last_page}
                                </span>
                                {paginatedOrders.next_page_url && (
                                    <Link
                                        href={paginatedOrders.next_page_url}
                                        preserveScroll
                                        className="hover:underline"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
