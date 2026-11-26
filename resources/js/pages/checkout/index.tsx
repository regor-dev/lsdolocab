import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import SavedAddressCard from '@/components/checkout/SavedAddressCard';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Lock,
    Package,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Store,
    Trash2,
    Truck,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StoreProduct {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    image_url: string | null;
    brand: string;
    variant: {
        color: string;
        size: string;
        price: number;
    };
    available_stock: number;
    size_stocks?: Record<string, number> | null;
}

interface CartEntry {
    product_id: number;
    quantity: number;
    size: string;
}

interface DeliveryAddress {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    payment_method?: 'counter' | 'cod' | 'gcash' | null;
    payment_reference?: string | null;
}

interface CheckoutForm {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    payment_method: 'counter' | 'cod' | 'gcash';
    payment_reference: string;
}

interface CheckoutProps {
    products?: StoreProduct[];
    deliveryAddress?: DeliveryAddress;
}

const cartStorageKey = (userId: number | null): string => (userId ? `lsdolocab.customer-cart-${userId}` : 'lsdolocab.customer-cart');
const buyNowStorageKey = 'lsdolocab.buy_now';
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

interface BuyNowItem {
    product_id: number;
    size: string;
    quantity: number;
}

function isBuyNowItem(value: unknown): value is BuyNowItem {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const entry = value as { product_id?: unknown; quantity?: unknown; size?: unknown };

    return (
        typeof entry.product_id === 'number' &&
        Number.isInteger(entry.product_id) &&
        entry.product_id > 0 &&
        typeof entry.quantity === 'number' &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        entry.quantity <= 1000 &&
        typeof entry.size === 'string' &&
        entry.size !== ''
    );
}

function getBuyNowItem(): BuyNowItem | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.localStorage.getItem(buyNowStorageKey);

        if (!stored) {
            return null;
        }

        const value: unknown = JSON.parse(stored);

        return isBuyNowItem(value) ? value : null;
    } catch (error) {
        console.error('Unable to restore the buy-now item.', error);
        return null;
    }
}

function clearBuyNowItem(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(buyNowStorageKey);
        window.dispatchEvent(new Event('storefront-cart-updated'));
    } catch (error) {
        console.error('Unable to clear the buy-now item.', error);
    }
}

function isCartEntry(value: unknown): value is CartEntry {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const entry = value as { product_id?: unknown; quantity?: unknown; size?: unknown };

    return (
        typeof entry.product_id === 'number' &&
        Number.isInteger(entry.product_id) &&
        typeof entry.quantity === 'number' &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        typeof entry.size === 'string'
    );
}

function readCart(userId: number | null): CartEntry[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = window.localStorage.getItem(cartStorageKey(userId));

        if (!stored) {
            return [];
        }

        const value: unknown = JSON.parse(stored);

        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(isCartEntry).map((entry) => ({
            ...entry,
            size: entry.size || '',
        }));
    } catch (error) {
        console.error('Unable to restore the saved shopping cart.', error);
        return [];
    }
}

function ShoeThumbnail({ product }: { product: StoreProduct }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = product.image_url ?? product.image;

    return (
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
            {imageUrl && !imageFailed ? (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="size-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <Package className="text-muted-foreground size-7" />
            )}
        </div>
    );
}

export default function Checkout({ products = [], deliveryAddress }: CheckoutProps) {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const user = auth?.user;
    const address = deliveryAddress ?? ({} as DeliveryAddress);

    const productsById = useMemo(() => new Map((Array.isArray(products) ? products : []).map((product) => [product.id, product])), [products]);

    const [cart, setCart] = useState<CartEntry[]>(() => readCart(user?.id ?? null));
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [checkoutData, setCheckoutData] = useState<CheckoutForm>(() => {
        const defaultPaymentMethod = user?.payment_method === 'cod' ? 'cod' : 'counter';
        return {
            name: address.name ?? user?.billing_name ?? user?.name ?? '',
            phone: address.phone ?? user?.cellphone_number ?? '',
            address: address.address ?? user?.billing_address ?? user?.address ?? '',
            city: address.city ?? '',
            postal_code: address.postal_code ?? '',
            country: address.country ?? 'Philippines',
            payment_method: address.payment_method ?? defaultPaymentMethod,
            payment_reference: address.payment_reference ?? '',
        };
    });

    const searchParams = useMemo(() => {
        if (typeof window === 'undefined') {
            return new URLSearchParams();
        }

        return new URLSearchParams(window.location.search);
    }, []);

    const buyNowMode = searchParams.get('mode') === 'buy_now';
    const buyNowItem = buyNowMode ? getBuyNowItem() : null;

    const buyNowLine = useMemo(() => {
        if (!buyNowItem) {
            return null;
        }

        const product = productsById.get(buyNowItem.product_id) ?? null;
        return { product, quantity: buyNowItem.quantity, size: buyNowItem.size };
    }, [buyNowItem, productsById]);

    const cartLines = useMemo(
        () =>
            cart.flatMap((entry) => {
                const product = productsById.get(entry.product_id);
                return product ? [{ ...entry, product }] : [];
            }),
        [cart, productsById],
    );

    interface OrderLine {
        product: StoreProduct | null;
        quantity: number;
        size: string;
    }

    const selectedCartLines = cartLines.filter((line) => selectedIds.has(line.product.id));

    const orderLines: OrderLine[] = buyNowMode
        ? (buyNowLine ? [buyNowLine] : [])
        : selectedCartLines;

    const selectedTotalItems = orderLines.reduce((sum, line) => sum + line.quantity, 0);
    const selectedSubtotal = orderLines.reduce(
        (total, line) => total + Number(line.product?.variant?.price ?? 0) * line.quantity,
        0,
    );

    useEffect(() => {
        try {
            window.localStorage.setItem(cartStorageKey(user?.id ?? null), JSON.stringify(cart));
        } catch (error) {
            console.error('Unable to save the shopping cart in this browser.', error);
        }
    }, [cart, user?.id]);

    useEffect(() => {
        const ids = new Set(cartLines.map((line) => line.product.id));
        setSelectedIds(ids);
    }, [cartLines]);

    function toggleSelect(productId: number) {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    }

    function toggleSelectAll() {
        if (selectedIds.size === cartLines.length && cartLines.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(cartLines.map((line) => line.product.id)));
        }
    }

    function removeFromCart(productId: number, size: string) {
        setCart((current) => current.filter((entry) => !(entry.product_id === productId && entry.size === size)));
        setSelectedIds((current) => {
            const next = new Set(current);
            next.delete(productId);
            return next;
        });
    }

    function fieldError(field: string) {
        const error = checkoutErrors[field];

        return error ? (
            <p className="text-destructive mt-1.5 text-xs font-medium" role="alert">
                {error}
            </p>
        ) : null;
    }

    function placeOrder() {
        if (processing) {
            return;
        }

        if (buyNowMode) {
            if (!buyNowItem) {
                setCheckoutError('Your buy-now item is no longer available. Please add it again.');
                return;
            }
        } else if (orderLines.length === 0) {
            return;
        }

        setCheckoutError(null);
        setCheckoutErrors({});

        const items = buyNowMode
            ? [
                {
                    product_id: buyNowItem!.product_id,
                    quantity: buyNowItem!.quantity,
                    size: buyNowItem!.size,
                },
            ]
            : orderLines.map((entry) => ({
                product_id: entry.product!.id,
                quantity: entry.quantity,
                size: entry.size,
            }));

        router.post(
            '/checkout',
            {
                items,
                billing: {
                    name: checkoutData.name,
                    phone: checkoutData.phone,
                    address: checkoutData.address,
                    city: checkoutData.city,
                    postal_code: checkoutData.postal_code || null,
                    country: checkoutData.country,
                },
                payment_method: checkoutData.payment_method,
                payment_reference: checkoutData.payment_reference.trim() || null,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const firstError = Object.values(errors).find((value): value is string => typeof value === 'string');
                    setCheckoutError(firstError ?? 'We could not place your order. Please try again.');
                    setCheckoutErrors(errors);
                },
                onSuccess: () => {
                    if (buyNowMode) {
                        clearBuyNowItem();
                    } else {
                        const purchased = new Set(
                            orderLines.map((entry) => `${entry.product!.id}|${entry.size}`),
                        );
                        setCart((current) =>
                            current.filter((entry) => !purchased.has(`${entry.product_id}|${entry.size}`)),
                        );
                    }
                    setSelectedIds(new Set());
                    setCheckoutError(null);
                    setCheckoutErrors({});
                    window.dispatchEvent(new Event('storefront-cart-updated'));
                    router.reload({ only: ['cart', 'cartCount'] });
                },
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    }

    if (orderLines.length === 0) {
        return (
            <AppLayout>
                <Head title="Checkout" />
                <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
                    <Card className="w-full text-center">
                        <CardHeader className="items-center pb-2">
                            <div className="bg-muted mb-3 flex size-14 items-center justify-center rounded-full">
                                <ShoppingCart className="text-muted-foreground size-6" />
                            </div>
                            <CardTitle className="text-xl">Your bag is empty</CardTitle>
                            <CardDescription>Add a pair from the collection to get started.</CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center pt-4">
                            <Button asChild className="rounded-full px-8">
                                <Link href="/shop">
                                    <ShoppingBag className="mr-2 size-4" />
                                    Continue shopping
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Checkout" />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                        <nav className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                            <Link href="/shop" className="hover:text-foreground transition-colors">
                                Shop
                            </Link>
                            <span>/</span>
                            <span className="text-foreground">Checkout</span>
                        </nav>
                        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                    </div>
                    <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-normal">
                        <Lock className="size-3" />
                        Secure Order Reservation
                    </Badge>
                </div>

                <Separator className="mb-8" />

                {checkoutError && (
                    <Alert variant="destructive" className="mb-8">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Unable to place order</AlertTitle>
                        <AlertDescription>{checkoutError}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    {/* LEFT COLUMN: Delivery address + Payment method */}
                    <div className="lg:col-span-7 space-y-10">
                        <form
                            id="checkout-form"
                            className="space-y-8"
                            onSubmit={(event) => {
                                event.preventDefault();
                                placeOrder();
                            }}
                        >
                            {/* STEP 1: Delivery address */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="flex size-6 items-center justify-center rounded-full p-0 text-xs font-bold">1</Badge>
                                    <h2 className="text-lg font-semibold tracking-tight">Delivery address</h2>
                                </div>
                                <SavedAddressCard
                                    billing={{
                                        name: checkoutData.name,
                                        phone: checkoutData.phone,
                                        address: checkoutData.address,
                                        city: checkoutData.city,
                                        postal_code: checkoutData.postal_code,
                                        country: checkoutData.country,
                                    }}
                                    onChange={(field, value) =>
                                        setCheckoutData((current) => ({
                                            ...current,
                                            [field]: value,
                                        }))
                                    }
                                    errors={checkoutErrors}
                                />
                            </section>

                            <Separator />

                            {/* STEP 2: Payment method */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="flex size-6 items-center justify-center rounded-full p-0 text-xs font-bold">2</Badge>
                                    <h2 className="text-lg font-semibold tracking-tight">Payment method</h2>
                                </div>

                                <RadioGroup
                                    value={checkoutData.payment_method}
                                    onValueChange={(value) =>
                                        setCheckoutData((current) => ({
                                            ...current,
                                            payment_method: value as CheckoutForm['payment_method'],
                                            payment_reference: value !== 'gcash' ? '' : current.payment_reference,
                                        }))
                                    }
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                                >
                                    {[
                                        {
                                            value: 'gcash',
                                            label: 'GCash',
                                            description: 'Pay via GCash mobile wallet',
                                            icon: <Wallet className="size-5 shrink-0" />,
                                        },
                                        {
                                            value: 'cod',
                                            label: 'Cash on Delivery',
                                            description: 'Pay upon delivery to your address',
                                            icon: <Truck className="size-5 shrink-0" />,
                                        },
                                        {
                                            value: 'counter',
                                            label: 'Store Counter',
                                            description: 'Pay & collect at the store counter',
                                            icon: <Store className="size-5 shrink-0" />,
                                        },
                                    ].map((method) => (
                                        <Label
                                            key={method.value}
                                            htmlFor={`method-${method.value}`}
                                            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center ${
                                                checkoutData.payment_method === method.value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-muted-foreground/40'
                                            }`}
                                        >
                                            <RadioGroupItem value={method.value} id={`method-${method.value}`} className="mt-1" />
                                            {method.icon}
                                            <span className="text-sm font-semibold">{method.label}</span>
                                            <span className="text-muted-foreground text-[11px] leading-none">{method.description}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>

                                {checkoutData.payment_method === 'gcash' && (
                                    <div className="space-y-1.5 mt-4">
                                        <Label htmlFor="checkout-gcash-reference" className="text-xs font-medium">
                                            GCash reference number
                                        </Label>
                                        <Input
                                            id="checkout-gcash-reference"
                                            autoComplete="off"
                                            placeholder="e.g. GCASH-REF-123456"
                                            className="h-11 rounded-lg"
                                            value={checkoutData.payment_reference}
                                            onChange={(event) =>
                                                setCheckoutData((current) => ({
                                                    ...current,
                                                    payment_reference: event.target.value,
                                                }))
                                            }
                                        />
                                        {fieldError('payment_reference')}
                                    </div>
                                )}

                                {fieldError('payment_method')}
                            </section>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Sticky Order Summary */}
                    <aside className="lg:col-span-5">
                        <Card className="rounded-2xl lg:sticky lg:top-8">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle className="text-lg font-semibold tracking-tight">In Your Bag</CardTitle>
                                    <CardDescription>Review your shoes before placing your order.</CardDescription>
                                </div>
                                <Badge variant="secondary">
                                    {selectedTotalItems} {selectedTotalItems === 1 ? 'item' : 'items'} selected
                                </Badge>
                            </CardHeader>

                            <CardContent className="space-y-5">
                                {/* Price Breakdown */}
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{currency.format(selectedSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Estimated Delivery & Handling</span>
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                                            Free
                                        </Badge>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-base font-bold">
                                        <span>Total</span>
                                        <span>{currency.format(selectedSubtotal)}</span>
                                    </div>
                                </div>

                                <Separator />

                                {!buyNowMode && (
                                    <>
                                        {/* Select All Bar */}
                                        <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-lg px-2 py-2 text-sm">
                                            <Checkbox
                                                checked={selectedIds.size === cartLines.length && cartLines.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                            <label className="text-sm font-medium select-none">
                                                Select all ({selectedCartLines.length} of {cartLines.length})
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* Scrollable Shoe List */}
                                <div
                                    className="max-h-[340px] overflow-y-auto pr-1 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.35)_transparent] [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/40"
                                >
                                    {orderLines.map(({ product, quantity, size }) => (
                                        <div
                                            key={buyNowMode ? `buy-now-${size}` : `${product!.id}-${size}`}
                                            className="flex gap-4 py-4 first:pt-0 last:pb-0"
                                        >
                                            {!buyNowMode && product && (
                                                <Checkbox
                                                    checked={selectedIds.has(product.id)}
                                                    onCheckedChange={() => toggleSelect(product.id)}
                                                />
                                            )}
                                            <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                {product ? (
                                                    <ShoeThumbnail product={product} />
                                                ) : (
                                                    <Package className="text-muted-foreground size-7" />
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col justify-between text-sm">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="leading-snug font-semibold">
                                                            {product?.name ?? 'Buy-now item'}
                                                        </p>
                                                        {product && (
                                                            <p className="text-muted-foreground text-xs">
                                                                {product.brand}
                                                            </p>
                                                        )}
                                                        <div className="mt-1.5 flex items-center gap-1.5">
                                                            <Badge variant="secondary" className="text-[11px]">
                                                                Size {size || product?.variant?.size}
                                                            </Badge><Badge variant="outline" className="text-[11px]">
                                                                {product?.size_stocks?.[size || product?.variant?.size] ?? 0} left
                                                            </Badge><Badge variant="outline" className="text-[11px]">
                                                                Qty {quantity}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {!buyNowMode && product && (
                                                        <button
                                                            onClick={() => removeFromCart(product.id, size)}
                                                            className="text-muted-foreground hover:text-destructive size-6"
                                                        >
                                                            <Trash2 className="size-5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="mt-1.5 font-medium">
                                                    {currency.format(Number(product?.variant?.price ?? 0) * quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 border-t border-white/10 pt-4">
                                <Button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={processing || orderLines.length === 0}
                                    className="w-full justify-center py-3 text-sm font-semibold"
                                >
                                    {processing ? 'Placing order…' : `Place pending order · ${currency.format(selectedSubtotal)}`}
                                    <ShoppingBag className="ml-2 size-4" />
                                </Button>
                                <div className="space-y-1 text-xs text-muted-foreground leading-relaxed text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
                                        <span>Stock is verified and reserved upon order submission.</span>
                                    </div>
                                    <p className="mb-0">
                                        No payment is processed automatically; track your status in Order History.
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
