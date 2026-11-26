import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus } from 'lucide-react';

interface ProductOption {
    id: number;
    name: string;
}

interface StockRecord {
    id: number;
    product_id?: number;
    quantity?: number | string | null;
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    product?: { id: number; name: string; sku?: string; price?: number | string } | null;
    variant?: { product?: { id: number; name: string } | null } | null;
}

interface StockMovementRecord {
    id: number;
    product_id?: number;
    movement_type?: unknown;
    type?: unknown;
    quantity_change?: number | string | null;
    quantity?: number | string | null;
    status?: unknown;
    created_at?: string | null;
    created_at_formatted?: string | null;
    product?: { id: number; name: string } | null;
    variant?: { product?: { id: number; name: string } | null } | null;
    user?: { id: number; name: string } | null;
    logs?: Array<{
        status?: unknown;
        user?: { id: number; name: string } | null;
    }>;
    stock_logs?: Array<{
        status?: unknown;
        user?: { id: number; name: string } | null;
        approved_by?: number | null;
        rejected_by?: number | null;
    }>;
}

interface ProductStock {
    id: number;
    name: string;
    brand_name: string;
    sku: string;
    color: string;
    size: string;
    price: number | string;
    quantity: number | string;
    status: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page?: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
}

interface Props {
    stocks?: PaginatedData<StockRecord> | StockRecord[];
    movements?: PaginatedData<StockMovementRecord> | StockMovementRecord[];
    products?: ProductOption[];
    productStocks?: ProductStock[];
    auth?: {
        user?: {
            roles?: Array<string | { name: string }>;
            role?: string;
        };
        roles?: Array<string | { name: string }>;
    };
}

export default function StocksIndex({
    stocks,
    movements,
    products = [],
    productStocks = [],
    auth: propAuth,
}: Props) {
    const pageProps = usePage().props as any;
    const auth = propAuth ?? pageProps.auth ?? {};

    const rawRoles = [
        ...(Array.isArray(auth?.roles) ? auth.roles : []),
        ...(Array.isArray(auth?.user?.roles) ? auth.user.roles : []),
        ...(auth?.user?.role ? [auth.user.role] : []),
    ];

    const isAdmin = rawRoles.some((r: any) => {
        const name = typeof r === 'string' ? r : r?.name;
        return typeof name === 'string' && name.toLowerCase() === 'admin';
    });

    // Modals for Total Stocks (Add, View, Edit, Delete)
    const [addStockOpen, setAddStockOpen] = useState(false);
    const [viewingStock, setViewingStock] = useState<StockRecord | null>(null);
    const [editingStock, setEditingStock] = useState<StockRecord | null>(null);
    const [deletingStock, setDeletingStock] = useState<StockRecord | null>(null);

    // Modal for Movements & Logs
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Forms
    const addStockForm = useForm({
        product_id: '',
        quantity: '',
    });

    const editStockForm = useForm({
        quantity: '',
    });

    const movementForm = useForm({
        product_id: '',
        quantity_change: '',
    });

    function getProductStockStatus(stock: ProductStock): string {
        const raw =
            typeof stock.status === 'string' && stock.status.trim() !== ''
                ? stock.status
                : '';
        if (raw !== '') return raw.toLowerCase();
        const qty = Number(stock.quantity ?? 0);
        if (qty <= 0) return 'out_of_stock';
        if (qty <= 10) return 'low_stock';
        return 'in_stock';
    }

    function formatStockStatus(status: string): string {
        switch (status) {
            case 'in_stock': return 'In Stock';
            case 'low_stock': return 'Low Stock';
            case 'out_of_stock': return 'Out of Stock';
            default: return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        }
    }

    const [productSearch, setProductSearch] = useState('');
    const [productStatusFilter, setProductStatusFilter] = useState<
        'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
    >('all');

    const filteredProductStocks = productStocks.filter((stock) => {
        const term = productSearch.toLowerCase();
        const matches =
            stock.name.toLowerCase().includes(term) ||
            stock.brand_name.toLowerCase().includes(term) ||
            stock.sku.toLowerCase().includes(term) ||
            stock.color.toLowerCase().includes(term) ||
            stock.size.toLowerCase().includes(term);
        if (!matches) return false;
        if (productStatusFilter === 'all') return true;
        return getProductStockStatus(stock) === productStatusFilter;
    });

    function openStockInForProduct(productId: number) {
        movementForm.setData('product_id', String(productId));
        movementForm.setData('quantity_change', '');
        setMovementModalOpen(true);
    }

    const stockList: StockRecord[] = Array.isArray(stocks)
        ? stocks
        : Array.isArray(stocks?.data)
          ? stocks.data
          : [];

    const movementPagination: PaginatedData<StockMovementRecord> = Array.isArray(movements)
        ? { data: movements }
        : {
              data: Array.isArray(movements?.data) ? movements.data : [],
              current_page: movements?.current_page,
              prev_page_url: movements?.prev_page_url,
              next_page_url: movements?.next_page_url,
          };

    function getStockStatus(stock: StockRecord): string {
        const qty = Number(stock.quantity ?? 0);
        if (typeof stock.status === 'string' && stock.status.trim() !== '') {
            return stock.status.toLowerCase();
        }
        if (qty <= 0) return 'out_of_stock';
        if (qty <= 10) return 'low_stock';
        return 'in_stock';
    }

    function getMovementStatus(movement: StockMovementRecord): string {
        const rawStatus =
            movement.stock_logs?.[0]?.status ??
            movement.logs?.[0]?.status ??
            movement.status ??
            'pending';

        return typeof rawStatus === 'string' && rawStatus.trim() !== ''
            ? rawStatus.toLowerCase()
            : 'pending';
    }

    const filteredMovements = movementPagination.data.filter((movement) => {
        const status = getMovementStatus(movement);
        if (statusFilter === 'all') return true;
        return status === statusFilter;
    });

    function getStockProductName(stock: StockRecord | null): string {
        if (!stock) return '—';
        return stock.product?.name ?? stock.variant?.product?.name ?? '—';
    }

    // Total Stocks Handlers
    function handleAddStock(e: React.FormEvent) {
        e.preventDefault();
        addStockForm.post('/stocks', {
            preserveScroll: true,
            onSuccess: () => {
                addStockForm.reset();
                setAddStockOpen(false);
            },
        });
    }

    function openEditStock(stock: StockRecord) {
        setEditingStock(stock);
        editStockForm.setData('quantity', String(stock.quantity ?? 0));
    }

    function handleUpdateStock(e: React.FormEvent) {
        e.preventDefault();
        if (!editingStock) return;
        editStockForm.put(`/stocks/${editingStock.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingStock(null);
            },
        });
    }

    function handleDeleteStock() {
        if (!deletingStock) return;
        router.delete(`/stocks/${deletingStock.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingStock(null);
            },
        });
    }

    // Movements & Logs Handlers
    function handleCreateMovement(e: React.FormEvent) {
        e.preventDefault();
        movementForm.post('/stock-movements', {
            preserveScroll: true,
            onSuccess: () => {
                movementForm.reset();
                setMovementModalOpen(false);
            },
        });
    }

    function handleApprove(id: number) {
        if (!window.confirm('Approve this Stock-In request and increment product stock?')) return;
        router.patch(`/stockmovement/${id}/approve`, {}, { preserveScroll: true });
    }

    function handleReject(id: number) {
        if (!window.confirm('Reject this Stock-In request?')) return;
        router.patch(`/stockmovement/${id}/reject`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title="Stocks" />

            <div className="space-y-6 p-6">
                {/* Clean Page Header */}
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Inventory Management
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Stocks</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor total stock levels and manage stock movement logs and approvals.
                    </p>
                </div>

                {/* SECTION 0: Current Product Stock (Read-Only) */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Current Stock
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">
                                Product Stock Levels
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Read-only view of current product stock across the catalog.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                placeholder="Search product, brand, SKU, size, or color..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-80"
                            />
                            {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map(
                                (status) => (
                                    <Button
                                        key={status}
                                        type="button"
                                        size="sm"
                                        variant={
                                            productStatusFilter === status ? 'default' : 'outline'
                                        }
                                        onClick={() => setProductStatusFilter(status)}
                                    >
                                        {status === 'all' ? 'All' : formatStockStatus(status)}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Variant (Size / Color / SKU)</TableHead>
                                <TableHead>Current Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProductStocks.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={isAdmin ? 6 : 5}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProductStocks.map((stock) => {
                                    const status = getProductStockStatus(stock);
                                    return (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-medium">
                                                {stock.name}
                                            </TableCell>
                                            <TableCell>{stock.brand_name}</TableCell>
                                            <TableCell className="text-sm">
                                                {stock.size} / {stock.color} / {stock.sku}
                                            </TableCell>
                                            <TableCell>
                                                {Number(stock.quantity ?? 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        status === 'out_of_stock'
                                                            ? 'destructive'
                                                            : status === 'low_stock'
                                                              ? 'secondary'
                                                              : 'default'
                                                    }
                                                >
                                                    {formatStockStatus(status)}
                                                </Badge>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => openStockInForProduct(stock.id)}
                                                    >
                                                        + Stock In
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </section>

                {/* SECTION 1: Total Stocks (Admin CRUD: Add, View, Edit, Delete) */}
                {isAdmin && (
                    <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    Inventory
                                </p>
                                <h2 className="mt-0.5 text-lg font-semibold">Total Stocks</h2>
                                <p className="text-xs text-muted-foreground">
                                    {stockList.length} total stock records across your catalog.
                                </p>
                            </div>

                            <Button size="sm" onClick={() => setAddStockOpen(true)}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Stock Record
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockList.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No stock records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockList.map((stock) => {
                                        const qty = Number(stock.quantity ?? 0);
                                        const status = getStockStatus(stock);

                                        return (
                                            <TableRow key={stock.id}>
                                                <TableCell className="font-medium">
                                                    {getStockProductName(stock)}
                                                </TableCell>
                                                <TableCell>{qty}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            status === 'out_of_stock'
                                                                ? 'destructive'
                                                                : status === 'low_stock'
                                                                  ? 'secondary'
                                                                  : 'default'
                                                        }
                                                    >
                                                        {status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-3 text-xs font-medium">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingStock(stock)}
                                                            className="text-foreground hover:underline"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditStock(stock)}
                                                            className="text-foreground hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingStock(stock)}
                                                            className="text-destructive hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </section>
                )}

                {/* SECTION 2: Combined Movements & Logs */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Activity & Approvals
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">Movements & Logs</h2>
                            <p className="text-xs text-muted-foreground">
                                Stock additions, deductions, audit trail, and admin approval actions.
                            </p>
                        </div>

                        {isAdmin && (
                            <Button size="sm" onClick={() => setMovementModalOpen(true)}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Stock Movement
                            </Button>
                        )}
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
                            const count =
                                tab === 'all'
                                    ? movementPagination.data.length
                                    : movementPagination.data.filter((m) => getMovementStatus(m) === tab).length;

                            return (
                                <Button
                                    key={tab}
                                    type="button"
                                    size="sm"
                                    variant={statusFilter === tab ? 'default' : 'outline'}
                                    onClick={() => setStatusFilter(tab)}
                                    className="capitalize"
                                >
                                    {tab} ({count})
                                </Button>
                            );
                        })}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Submitted By</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={isAdmin ? 7 : 6}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No {statusFilter === 'all' ? '' : statusFilter} stock movements found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements.map((movement) => {
                                    const submittedBy =
                                        movement.user?.name ??
                                        movement.stock_logs?.[0]?.user?.name ??
                                        movement.logs?.[0]?.user?.name ??
                                        'Unknown';

                                    const qty = Number(
                                        movement.quantity_change ?? movement.quantity ?? 0
                                    );

                                    // Backend enforces Stock-In only, so every row is an inbound movement.
                                    const typeLabel = 'Stock In';

                                    const status = getMovementStatus(movement);

                                    return (
                                        <TableRow key={movement.id}>
                                            <TableCell className="font-medium">
                                                {submittedBy}
                                            </TableCell>
                                            <TableCell>
                                                {movement.product?.name ??
                                                    movement.variant?.product?.name ??
                                                    '—'}
                                            </TableCell>
                                            <TableCell className="capitalize">{typeLabel}</TableCell>
                                            <TableCell>{qty}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        status === 'approved'
                                                            ? 'default'
                                                            : status === 'rejected'
                                                              ? 'destructive'
                                                              : 'secondary'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {movement.created_at_formatted ??
                                                    movement.created_at ??
                                                    '—'}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    {status === 'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleApprove(movement.id)
                                                                }
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    handleReject(movement.id)
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {(movementPagination.prev_page_url || movementPagination.next_page_url) && (
                        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                            {movementPagination.prev_page_url && (
                                <Link
                                    href={movementPagination.prev_page_url}
                                    preserveScroll
                                    className="hover:underline"
                                >
                                    Previous
                                </Link>
                            )}
                            {movementPagination.current_page && (
                                <span className="text-muted-foreground">
                                    Page {movementPagination.current_page}
                                </span>
                            )}
                            {movementPagination.next_page_url && (
                                <Link
                                    href={movementPagination.next_page_url}
                                    preserveScroll
                                    className="hover:underline"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* MODAL 1: Add Stock Record */}
            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stock Record</DialogTitle>
                        <DialogDescription>
                            Create or set an inventory record for a product.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStock} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Product</Label>
                            <Select
                                value={String(addStockForm.data.product_id)}
                                onValueChange={(v) => addStockForm.setData('product_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {addStockForm.errors.product_id && (
                                <p className="text-xs text-destructive">
                                    {addStockForm.errors.product_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={addStockForm.data.quantity}
                                onChange={(e) => addStockForm.setData('quantity', e.target.value)}
                            />
                            {addStockForm.errors.quantity && (
                                <p className="text-xs text-destructive">
                                    {addStockForm.errors.quantity}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddStockOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={addStockForm.processing || !addStockForm.data.product_id}
                            >
                                {addStockForm.processing ? 'Saving...' : 'Save Record'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: View Stock Details */}
            <Dialog open={!!viewingStock} onOpenChange={(open) => !open && setViewingStock(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Stock Information</DialogTitle>
                        <DialogDescription>
                            Detailed inventory record for {getStockProductName(viewingStock)}.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingStock && (
                        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Record ID</span>
                                <span className="font-medium">#{viewingStock.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Product</span>
                                <span className="font-medium">
                                    {getStockProductName(viewingStock)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Quantity</span>
                                <span className="font-semibold">
                                    {Number(viewingStock.quantity ?? 0)} units
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Stock Status</span>
                                <Badge
                                    variant={
                                        getStockStatus(viewingStock) === 'out_of_stock'
                                            ? 'destructive'
                                            : getStockStatus(viewingStock) === 'low_stock'
                                              ? 'secondary'
                                              : 'default'
                                    }
                                >
                                    {getStockStatus(viewingStock)}
                                </Badge>
                            </div>
                            {viewingStock.updated_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{viewingStock.updated_at}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" onClick={() => setViewingStock(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: Edit Stock Quantity */}
            <Dialog open={!!editingStock} onOpenChange={(open) => !open && setEditingStock(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Stock Record</DialogTitle>
                        <DialogDescription>
                            Update the on-hand inventory quantity for{' '}
                            <span className="font-medium text-foreground">
                                {getStockProductName(editingStock)}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStock} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min={0}
                                value={editStockForm.data.quantity}
                                onChange={(e) => editStockForm.setData('quantity', e.target.value)}
                            />
                            {editStockForm.errors.quantity && (
                                <p className="text-xs text-destructive">
                                    {editStockForm.errors.quantity}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingStock(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editStockForm.processing}>
                                {editStockForm.processing ? 'Updating...' : 'Update Stock'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: Delete Stock Confirmation */}
            <Dialog open={!!deletingStock} onOpenChange={(open) => !open && setDeletingStock(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Stock Record</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove the stock record for{' '}
                            <span className="font-medium text-foreground">
                                {getStockProductName(deletingStock)}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingStock(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteStock}>
                            Delete Record
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: Add Stock Movement (for Movements & Logs) */}
            <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Stock Movement</DialogTitle>
                        <DialogDescription>
                            Stock-In request. Staff submissions save as pending and require admin
                            approval before stock is incremented.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateMovement} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Product</Label>
                            <Select
                                value={String(movementForm.data.product_id)}
                                onValueChange={(v) => movementForm.setData('product_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {movementForm.errors.product_id && (
                                <p className="text-xs text-destructive">
                                    {movementForm.errors.product_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Quantity (inbound)</Label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="0"
                                value={movementForm.data.quantity_change}
                                onChange={(e) =>
                                    movementForm.setData('quantity_change', e.target.value)
                                }
                            />
                            {movementForm.errors.quantity_change && (
                                <p className="text-xs text-destructive">
                                    {movementForm.errors.quantity_change}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMovementModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    movementForm.processing ||
                                    !movementForm.data.product_id ||
                                    Number(movementForm.data.quantity_change) <= 0
                                }
                            >
                                {movementForm.processing ? 'Submitting...' : 'Submit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}