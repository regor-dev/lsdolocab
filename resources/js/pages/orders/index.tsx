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
    product?: { name: string } | null;
    quantity: number;
    sub_total?: number | string;
};

type OrderData = {
    id: number;
    order_number: string;
    status: string;
    customer_name: string;
    customer_email?: string | null;
    total: number | string;
    order_date: string;
    user?: { id: number; name: string | null; email: string | null } | null;
    order_items?: OrderItem[];
    orderItems?: OrderItem[];
    order_logs?: Array<{
        id: number;
        action?: string | null;
        created_at: string;
        user?: { name: string | null } | null;
    }>;
    orderLogs?: Array<{
        id: number;
        action?: string | null;
        created_at: string;
        user?: { name: string | null } | null;
    }>;
};

type OrderLogData = {
    id: number;
    action?: string | null;
    created_at: string;
    order?: { order_number: string } | null;
    order_item?: {
        product?: { name: string } | null;
        quantity: number;
        order?: { order_number: string } | null;
    } | null;
    orderItem?: {
        product?: { name: string } | null;
        quantity: number;
        order?: { order_number: string } | null;
    } | null;
    stock_movement?: {
        product?: { name: string } | null;
    } | null;
    stockMovement?: {
        product?: { name: string } | null;
    } | null;
    user?: { name: string | null } | null;
};

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    orders: PaginatedData<OrderData> | OrderData[];
    orderLogs?: PaginatedData<OrderLogData> | OrderLogData[] | null;
    filters?: { search?: string | null; status?: string | null } | null;
    auth?: SharedData['auth'];
}

const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

export default function OrdersIndex({
    orders,
    orderLogs,
    filters,
    auth: propAuth,
}: Props) {
    const pageProps = usePage().props as Record<string, unknown>;
    const auth = (propAuth ?? pageProps.auth ?? {}) as SharedData['auth'];
    const user = auth?.user ?? null;
    const isAdmin =
        user?.roles?.some((r) => r.role_name?.toLowerCase() === 'admin') ?? false;

    const paginatedOrders = !Array.isArray(orders) && orders ? orders : null;
    const orderList: OrderData[] = Array.isArray(orders)
        ? orders
        : (orders?.data ?? []);

    const orderLogsList: OrderLogData[] = Array.isArray(orderLogs)
        ? orderLogs
        : (orderLogs?.data ?? []);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        (filters?.status as StatusFilter) ?? 'all'
    );

    const [viewingOrder, setViewingOrder] = useState<OrderData | null>(null);
    const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<OrderData | null>(null);

    const editOrderForm = useForm({
        order_number: '',
        customer_name: '',
        customer_email: '',
        status: '',
        total: 0 as number | string,
        order_date: '',
        user_id: null as number | null,
    });

    const filteredOrders = orderList.filter((o) => {
        const normalizedStatus = (o.status ?? '').toLowerCase();
        const matchesSearch =
            !search ||
            o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
            o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' || normalizedStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts: Record<StatusFilter, number> = {
        all: orderList.length,
        pending: orderList.filter((o) => o.status?.toLowerCase() === 'pending').length,
        processing: orderList.filter((o) => o.status?.toLowerCase() === 'processing').length,
        completed: orderList.filter((o) => o.status?.toLowerCase() === 'completed').length,
        cancelled: orderList.filter((o) => o.status?.toLowerCase() === 'cancelled').length,
    };

    function openEditOrder(order: OrderData) {
        editOrderForm.clearErrors();
        setEditingOrder(order);
        editOrderForm.setData({
            order_number: order.order_number ?? '',
            customer_name: order.customer_name ?? '',
            customer_email: order.customer_email ?? order.user?.email ?? '',
            status: order.status ?? 'pending',
            total: order.total ?? 0,
            order_date: order.order_date
                ? String(order.order_date).slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            user_id: order.user?.id ?? null,
        });
    }

    function handleUpdateOrder(e: React.FormEvent) {
        e.preventDefault();
        if (!editingOrder) return;
        editOrderForm.put(`/admin/order/${editingOrder.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingOrder(null);
            },
        });
    }

    function handleDeleteOrder() {
        if (!deletingOrder) return;
        router.delete(`/admin/order/${deletingOrder.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingOrder(null);
            },
        });
    }

    function getStatusBadgeVariant(
        status: string
    ): 'default' | 'secondary' | 'destructive' | 'outline' {
        const s = status?.toLowerCase();
        if (s === 'completed') return 'default';
        if (s === 'cancelled') return 'destructive';
        if (s === 'processing') return 'outline';
        return 'secondary';
    }

    return (
        <AppLayout>
            <Head title="Orders" />

            <div className="space-y-6 p-6">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Order Management
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage customer orders and review past order transaction logs.
                    </p>
                </div>

                {/* CARD 1 — Orders Management */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Orders
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">Orders Management</h2>
                            <p className="text-xs text-muted-foreground">
                                View, filter, update, and manage all customer orders.
                            </p>
                        </div>

                        <Input
                            type="text"
                            placeholder="Search order #, customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64"
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
                                className="capitalize"
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
                                <TableHead>Products & Quantities</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created Date</TableHead>
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
                                    const items = o.order_items ?? o.orderItems ?? [];
                                    const isLocked = o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'cancelled';

                                    return (
                                        <TableRow key={o.id}>
                                            <TableCell className="font-mono font-medium">
                                                {o.order_number}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {o.customer_name}
                                                {(o.customer_email || o.user?.email) && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {o.customer_email ?? o.user?.email}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs text-sm">
                                                {items
                                                    .map(
                                                        (item) =>
                                                            `${item.product?.name ?? 'Unknown Product'} (x${item.quantity})`
                                                    )
                                                    .join(', ') || '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${Number(o.total ?? 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStatusBadgeVariant(o.status)}
                                                    className="capitalize"
                                                >
                                                    {o.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {o.order_date
                                                    ? new Date(o.order_date).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-3 text-xs font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingOrder(o)}
                                                        className="text-foreground hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                    {isAdmin && !isLocked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditOrder(o)}
                                                            className="text-foreground hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingOrder(o)}
                                                            className="text-destructive hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {paginatedOrders && paginatedOrders.last_page > 1 && (
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
                                Page {paginatedOrders.current_page} of {paginatedOrders.last_page}
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

                {/* CARD 2 — Order Logs Table */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-4">
                        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Order Logs
                        </p>
                        <h2 className="mt-0.5 text-lg font-semibold">Order Log History</h2>
                        <p className="text-xs text-muted-foreground">
                            Audit trail of past order transactions, status changes, and stock movements.
                        </p>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Ordered Product(s)</TableHead>
                                <TableHead>Stock Product</TableHead>
                                <TableHead>Action / Status</TableHead>
                                <TableHead>Performed By</TableHead>
                                <TableHead>Created Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderLogsList.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No order logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orderLogsList.map((log) => {
                                    const item = log.order_item ?? log.orderItem;
                                    const movement = log.stock_movement ?? log.stockMovement;
                                    const orderNum =
                                        log.order?.order_number ??
                                        item?.order?.order_number ??
                                        '—';

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-sm font-medium">
                                                {orderNum}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item?.product?.name ? (
                                                    <>
                                                        {item.product.name}{' '}
                                                        <span className="text-muted-foreground">
                                                            (x{item.quantity})
                                                        </span>
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {movement?.product?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm capitalize">
                                                {log.action ?? 'Order Logged'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.user?.name ?? 'System'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {log.created_at
                                                    ? new Date(log.created_at).toLocaleString()
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </section>
            </div>

            {/* MODAL — View Order Details */}
            <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order #{viewingOrder?.order_number}</DialogTitle>
                        <DialogDescription>
                            Complete order breakdown, customer info, and itemized products.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingOrder && (
                        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Customer</Label>
                                    <p className="font-medium">{viewingOrder.customer_name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="font-medium">
                                        {viewingOrder.customer_email ??
                                            viewingOrder.user?.email ??
                                            'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Order Number</Label>
                                    <p className="font-mono font-medium">
                                        {viewingOrder.order_number}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        <Badge
                                            variant={getStatusBadgeVariant(viewingOrder.status)}
                                            className="capitalize"
                                        >
                                            {viewingOrder.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Total</Label>
                                    <p className="font-medium">
                                        ${Number(viewingOrder.total ?? 0).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Order Date</Label>
                                    <p className="font-medium">
                                        {viewingOrder.order_date
                                            ? new Date(viewingOrder.order_date).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <Label className="text-xs text-muted-foreground">Ordered Items</Label>
                                <div className="mt-2 space-y-1.5">
                                    {(viewingOrder.order_items ?? viewingOrder.orderItems ?? []).map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between text-sm"
                                            >
                                                <span>
                                                    {item.product?.name ?? 'Unknown Product'}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    x{item.quantity} · $
                                                    {Number(item.sub_total ?? 0).toFixed(2)}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" onClick={() => setViewingOrder(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL — Edit Order */}
            <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Order</DialogTitle>
                        <DialogDescription>
                            Update details for order #{editingOrder?.order_number}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateOrder} className="space-y-4">
                        {Object.keys(editOrderForm.errors).length > 0 && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                {Object.values(editOrderForm.errors).map((err, idx) => (
                                    <div key={idx}>{err}</div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Order Number</Label>
                            <Input
                                value={editOrderForm.data.order_number}
                                onChange={(e) =>
                                    editOrderForm.setData('order_number', e.target.value)
                                }
                                disabled={editOrderForm.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                                value={editOrderForm.data.customer_name}
                                onChange={(e) =>
                                    editOrderForm.setData('customer_name', e.target.value)
                                }
                                disabled={editOrderForm.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={editOrderForm.data.status}
                                onValueChange={(value) => editOrderForm.setData('status', value)}
                                disabled={editOrderForm.processing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
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
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingOrder(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editOrderForm.processing}>
                                {editOrderForm.processing ? 'Updating...' : 'Update Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL — Delete Order Confirmation */}
            <Dialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete order{' '}
                            <span className="font-medium text-foreground">
                                {deletingOrder?.order_number}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingOrder(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteOrder}>
                            Delete Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
