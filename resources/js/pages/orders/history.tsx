import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Eye, Package, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface OrderItem {
    id: number;
    quantity: number;
    sub_total: number;
    product: {
        name: string;
        image: string | null;
        brand: string;
        variant: {
            color: string;
            size: string;
            price: number;
        } | null;
    } | null;
}

interface TransactionEvent {
    status: string;
    label: string;
    description: string;
    date: string | null;
}

interface CustomerOrder {
    id: number;
    order_number: string;
    order_date: string | null;
    status: string;
    total: number;
    payment_method: string | null;
    payment_reference: string | null;
    billing: {
        name: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        postal_code: string | null;
        country: string | null;
    };
    items: OrderItem[];
    transaction_log: TransactionEvent[];
}

interface OrdersHistoryProps {
    orders: CustomerOrder[];
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const dateFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

function formatDate(value: string | null): string {
    if (!value) {
        return 'Date unavailable';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function getStatusBadgeColor(status: string): string {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
        case 'processing':
            return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
        case 'completed':
            return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
        case 'cancelled':
            return 'bg-red-500/10 text-red-700 border-red-500/20';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
}

export default function OrdersHistory({ orders, pagination }: OrdersHistoryProps) {
    const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

    return (
        <AppLayout>
            <Head title="Order History | LS Dolocab" />

            <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-10">
                <section className="mt-10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">Your account</p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight">Order history</h1>
                            <p className="text-muted-foreground mt-2 text-sm">Review your past orders, payment details, and status updates.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground text-sm">
                                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                            </span>
                            <Button asChild variant="outline" className="h-10 px-4">
                                <a href={route('shop')}>
                                    <ShoppingBag className="mr-2 size-4" />
                                    Continue shopping
                                </a>
                            </Button>
                        </div>
                    </div>

                    {orders.length > 0 ? (
                        <div className="mt-6 space-y-4">
                            {orders.map((order) => (
                                <article key={order.id} className="bg-card overflow-hidden rounded-2xl border">
                                    <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Order {order.order_number}</p>
                                            <h3 className="mt-1 text-lg font-semibold">Placed {formatDate(order.order_date)}</h3>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {order.payment_method === 'counter' ? 'Pay at the counter' : 'Cash on delivery'}
                                                {order.payment_reference ? ` · Ref: ${order.payment_reference}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-5 sm:justify-end">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(order.status)}`}
                                            >
                                                {order.status.replaceAll('_', ' ')}
                                            </span>
                                            <span className="text-lg font-bold">{currency.format(order.total)}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <Eye className="size-4" />
                                                <span className="sr-only">View order details</span>
                                            </Button>
                                            {order.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Cancel order ${order.order_number}? This will restore the reserved stock.`,
                                                            )
                                                        ) {
                                                            router.delete(route('orders.cancel', order.id));
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                    <span className="sr-only">Cancel order</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="divide-y px-5">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 py-4">
                                                <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-lg">
                                                    {item.product?.image ? (
                                                        <img className="size-full object-cover" src={item.product.image} alt="" />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center">
                                                            <ShoppingBag className="text-muted-foreground size-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{item.product?.name ?? 'Product unavailable'}</p>
                                                    {item.product?.variant && (
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {item.product.brand} · {item.product.variant.color} · Size {item.product.variant.size}
                                                        </p>
                                                    )}
                                                    <p className="text-muted-foreground mt-1 text-xs">Qty {item.quantity}</p>
                                                </div>
                                                <span className="text-sm font-semibold">{currency.format(item.sub_total)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <details className="border-t px-5 py-4">
                                        <summary className="cursor-pointer text-sm font-semibold">View transaction log</summary>
                                        <ol className="mt-4 space-y-4 border-l pl-4">
                                            {order.transaction_log.map((event, index) => (
                                                <li key={`${event.status}-${index}`} className="relative">
                                                    <span className="bg-primary absolute top-1 -left-[1.35rem] size-2 rounded-full" />
                                                    <p className="text-sm font-medium">{event.label}</p>
                                                    <p className="text-muted-foreground mt-1 text-xs">{event.description}</p>
                                                    <time className="text-muted-foreground mt-1 block text-xs">{formatDate(event.date)}</time>
                                                </li>
                                            ))}
                                        </ol>
                                    </details>
                                </article>
                            ))}
                            {pagination && pagination.total > pagination.per_page && (
                                <div className="mt-8 flex items-center justify-between gap-4">
                                    <Button
                                        disabled={pagination.current_page <= 1}
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(route('orders.history'), {
                                                page: pagination.current_page - 1,
                                            }, { preserveScroll: true })
                                        }
                                    >
                                        ← Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {pagination.current_page} of {pagination.last_page}&nbsp;·&nbsp;{pagination.total} orders
                                    </span>
                                    <Button
                                        disabled={pagination.current_page >= pagination.last_page}
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(route('orders.history'), {
                                                page: pagination.current_page + 1,
                                            }, { preserveScroll: true })
                                        }
                                    >
                                        Next →
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
                            <Package className="text-muted-foreground mx-auto size-12" />
                            <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                            <p className="text-muted-foreground mt-2 text-sm">Your order history will appear here once you place an order.</p>
                            <Button asChild className="mt-6" size="lg">
                                <a href={route('shop')}>
                                    <ShoppingBag className="mr-2 size-4" />
                                    Browse shoes
                                </a>
                            </Button>
                        </div>
                    )}
                </section>
            </main>

            <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {selectedOrder && (
                        <div className="space-y-6 pt-3">
                            <DialogHeader>
                                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                    Order {selectedOrder.order_number}
                                </p>
                                <DialogTitle className="text-left text-xl">Placed {formatDate(selectedOrder.order_date)}</DialogTitle>
                                <DialogDescription className="text-left">
                                    {selectedOrder.payment_method === 'counter' ? 'Pay at the counter' : 'Cash on delivery'}
                                    {selectedOrder.payment_reference ? ` · Ref: ${selectedOrder.payment_reference}` : ''}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex items-center justify-between">
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(selectedOrder.status)}`}
                                >
                                    {selectedOrder.status.replaceAll('_', ' ')}
                                </span>
                                <span className="text-lg font-bold">{currency.format(selectedOrder.total)}</span>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="mb-3 text-sm font-semibold">Items</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 py-2">
                                            <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                                                {item.product?.image ? (
                                                    <img className="size-full object-cover" src={item.product.image} alt="" />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center">
                                                        <ShoppingBag className="text-muted-foreground size-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{item.product?.name ?? 'Product unavailable'}</p>
                                                {item.product?.variant && (
                                                    <p className="text-muted-foreground text-xs">
                                                        {item.product.brand} · {item.product.variant.color} · Size {item.product.variant.size}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground text-xs">
                                                    Qty {item.quantity} · {currency.format(item.sub_total)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="mb-3 text-sm font-semibold">Delivery details</h4>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Name</dt>
                                        <dd className="font-medium">{selectedOrder.billing.name ?? '—'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Phone</dt>
                                        <dd className="font-medium">{selectedOrder.billing.phone ?? '—'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Address</dt>
                                        <dd className="font-medium">
                                            {selectedOrder.billing.address ?? '—'}
                                            {selectedOrder.billing.city ? `, ${selectedOrder.billing.city}` : ''}
                                            {selectedOrder.billing.postal_code ? `, ${selectedOrder.billing.postal_code}` : ''}
                                            {selectedOrder.billing.country ? `, ${selectedOrder.billing.country}` : ''}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <details className="border-t pt-4">
                                <summary className="cursor-pointer text-sm font-semibold">View transaction log</summary>
                                <ol className="mt-4 space-y-4 border-l pl-4">
                                    {selectedOrder.transaction_log.map((event, index) => (
                                        <li key={`${event.status}-${index}`} className="relative">
                                            <span className="bg-primary absolute top-1 -left-[1.35rem] size-2 rounded-full" />
                                            <p className="text-sm font-medium">{event.label}</p>
                                            <p className="text-muted-foreground mt-1 text-xs">{event.description}</p>
                                            <time className="text-muted-foreground mt-1 block text-xs">{formatDate(event.date)}</time>
                                        </li>
                                    ))}
                                </ol>
                            </details>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
