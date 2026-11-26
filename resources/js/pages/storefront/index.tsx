import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import StorefrontFilters from '@/components/storefront/StorefrontFilters';
import ProductCard from '@/components/storefront/ProductCard';
import SizePickerModal, { type SizePickerProduct } from '@/components/storefront/SizePickerModal';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StoreProduct {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    brand: string;
    variant: {
        color: string;
        size: string;
        price: number;
    };
    available_stock: number;
}

interface CartEntry {
    [key: string]: number;
    product_id: number;
    quantity: number;
}

interface BillingInfo {
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    configured: boolean;
}

interface CheckoutForm {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    payment_method: 'counter' | 'cod';
    payment_reference: string;
}

interface StorefrontProps {
    products: StoreProduct[];
    billing: BillingInfo;
}

const cartStorageKey = (userId: number | null): string => (userId ? `lsdolocab.customer-cart-${userId}` : 'lsdolocab.customer-cart');
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

function isCartEntry(value: unknown): value is CartEntry {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const entry = value as { product_id?: unknown; quantity?: unknown };

    return (
        typeof entry.product_id === 'number' &&
        Number.isInteger(entry.product_id) &&
        typeof entry.quantity === 'number' &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0
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

        return Array.isArray(value) ? value.filter(isCartEntry) : [];
    } catch (error) {
        console.error('Unable to restore the saved shopping cart.', error);
        return [];
    }
}

export default function Storefront({ products, billing }: StorefrontProps) {
    const { auth, flash } = usePage<SharedData>().props;
    const user = auth?.user;
    const { url } = usePage();
    const [cart, setCart] = useState<CartEntry[]>(() => readCart(user?.id));
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState<CartEntry[]>([]);
    const [buyNowProductId, setBuyNowProductId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [sortOrder, setSortOrder] = useState<'featured' | 'price-low' | 'price-high'>('featured');
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [sizePickerProduct, setSizePickerProduct] = useState<SizePickerProduct | null>(null);
    const [sizePickerMode, setSizePickerMode] = useState<'cart' | 'buy'>('cart');
    const [sizePickerOpen, setSizePickerOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<CheckoutForm>({
        name: billing.name,
        phone: billing.phone ?? '',
        address: billing.address ?? '',
        city: billing.city ?? '',
        postal_code: billing.postal_code ?? '',
        country: billing.country ?? 'Philippines',
        payment_method: billing.payment_method === 'cod' ? 'cod' : 'counter',
        payment_reference: '',
    });

    const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
    const cartLines = useMemo(
        () =>
            cart.flatMap((entry) => {
                const product = productsById.get(entry.product_id);
                return product ? [{ ...entry, product }] : [];
            }),
        [cart, productsById],
    );
    const cartCount = cartLines.reduce((total, entry) => total + entry.quantity, 0);
    const subtotal = cartLines.reduce((total, entry) => total + entry.product.variant.price * entry.quantity, 0);
    const checkoutLines = useMemo(
        () =>
            checkoutItems.flatMap((entry) => {
                const product = productsById.get(entry.product_id);
                return product ? [{ ...entry, product }] : [];
            }),
        [checkoutItems, productsById],
    );
    const checkoutSubtotal = checkoutLines.reduce((total, entry) => total + entry.product.variant.price * entry.quantity, 0);
    const normalizedSearch = search.trim().toLowerCase();
    const visibleProducts = useMemo(
        () =>
            products
                .filter((product) => selectedBrand === 'All' || product.brand === selectedBrand)
                .filter((product) =>
                    [product.name, product.brand, product.variant.color, product.variant.size].some((value) =>
                        value.toLowerCase().includes(normalizedSearch),
                    ),
                )
                .sort((a, b) => {
                    if (sortOrder === 'price-low') {
                        return a.variant.price - b.variant.price;
                    }

                    if (sortOrder === 'price-high') {
                        return b.variant.price - a.variant.price;
                    }

                    return 0;
                }),
        [products, selectedBrand, normalizedSearch, sortOrder],
    );

    useEffect(() => {
        try {
            window.localStorage.setItem(cartStorageKey(user?.id), JSON.stringify(cart));
            window.dispatchEvent(new Event('storefront-cart-updated'));
        } catch (error) {
            console.error('Unable to save the shopping cart in this browser.', error);
        }
    }, [cart, user?.id]);

    useEffect(() => {
        const query = url.split('?')[1]?.split('#')[0] ?? '';

        if (new URLSearchParams(query).get('openCart') === '1') {
            setCartOpen(true);
        }
    }, [url]);

    function addToCart(product: StoreProduct) {
        setCart((current) => {
            const existing = current.find((entry) => entry.product_id === product.id);

            if (existing) {
                if (existing.quantity >= product.available_stock) {
                    return current;
                }

                return current.map((entry) => (entry.product_id === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
            }

            return [...current, { product_id: product.id, quantity: 1 }];
        });
    }

    function updateQuantity(productId: number, quantity: number) {
        const product = productsById.get(productId);

        if (quantity < 1) {
            setCart((current) => current.filter((entry) => entry.product_id !== productId));
            return;
        }

        if (!product) {
            return;
        }

        setCart((current) =>
            current.map((entry) => (entry.product_id === productId ? { ...entry, quantity: Math.min(quantity, product.available_stock) } : entry)),
        );
    }

    function beginCheckout(items: CartEntry[], purchasedProductId?: number) {
        if (items.length === 0 || processing) {
            return;
        }

        setCheckoutItems(items);
        setBuyNowProductId(purchasedProductId ?? null);
        setCheckoutError(null);
        setCheckoutErrors({});
        setCartOpen(false);
        setCheckoutOpen(true);
    }

    function placeOrder() {
        if (checkoutItems.length === 0 || processing) {
            return;
        }

        setCheckoutError(null);
        setCheckoutErrors({});
        router.post(
            '/checkout',
            {
                items: checkoutItems,
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
                    setCheckoutOpen(true);
                },
                onSuccess: () => {
                    setCart((current) => (buyNowProductId === null ? [] : current.filter((entry) => entry.product_id !== buyNowProductId)));
                    setBuyNowProductId(null);
                    setCheckoutError(null);
                    setCheckoutErrors({});
                    setCheckoutOpen(false);
                    setCartOpen(false);
                    router.reload({ only: ['cart', 'cartCount'] });
                },
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    }

    function openSizePicker(product: SizePickerProduct, mode: 'cart' | 'buy') {
        setSizePickerProduct(product);
        setSizePickerMode(mode);
        setSizePickerOpen(true);
    }

    function fieldError(field: string) {
        const error = checkoutErrors[field];

        return error ? (
            <p className="text-destructive mt-1 text-xs" role="alert">
                {error}
            </p>
        ) : null;
    }

    return (
        <AppLayout>
            <Head title="Shop Shoes | LS Dolocab" />

            <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
                {flash?.success && (
                    <div
                        className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                        role="status"
                    >
                        {flash.success}
                    </div>
                )}

                <section id="catalog" className="scroll-mt-24 pt-7">
                    <StorefrontFilters
                        search={search}
                        setSearch={setSearch}
                        selectedBrand={selectedBrand}
                        setSelectedBrand={setSelectedBrand}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        brands={brands}
                        totalStyles={visibleProducts.length}
                    />
                    {visibleProducts.length > 0 ? (
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {visibleProducts.map((product) => {
                                const cartQuantity = cart.find((entry) => entry.product_id === product.id)?.quantity ?? 0;
                                const unavailable = product.available_stock === 0;
                                const atStockLimit = cartQuantity >= product.available_stock;

                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        cartQuantity={cartQuantity}
                                        unavailable={unavailable}
                                        atStockLimit={atStockLimit}
                                        onAddToCart={(product) => openSizePicker(product, 'cart')}
                                        onBuyNow={(product) => openSizePicker(product, 'buy')}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
                            <ShoppingBag className="text-muted-foreground mx-auto size-10" />
                            <h3 className="mt-4 font-semibold">{search ? 'No matching shoes' : 'No shoes available yet'}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {search ? 'Try another search term.' : 'Please check back soon for new styles.'}
                            </p>
                        </div>
                    )}
                </section>
            </main>

            <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    {selectedProduct && (
                        <div className="grid gap-6 pt-3 sm:grid-cols-2 sm:items-center">
                            <div className="bg-muted aspect-square overflow-hidden rounded-2xl">
                                {selectedProduct.image ? (
                                    <img className="size-full object-cover" src={selectedProduct.image} alt={selectedProduct.name} />
                                ) : (
                                    <div className="flex size-full items-center justify-center">
                                        <ShoppingBag className="text-muted-foreground size-20" strokeWidth={1} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <DialogHeader>
                                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{selectedProduct.brand}</p>
                                    <DialogTitle className="text-left text-2xl">{selectedProduct.name}</DialogTitle>
                                    <DialogDescription className="text-left">
                                        {selectedProduct.description || 'A versatile style from the LS Dolocab collection.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-muted/60 rounded-lg p-3">
                                        <dt className="text-muted-foreground text-xs">Color</dt>
                                        <dd className="mt-1 font-medium">{selectedProduct.variant.color}</dd>
                                    </div>
                                    <div className="bg-muted/60 rounded-lg p-3">
                                        <dt className="text-muted-foreground text-xs">Size</dt>
                                        <dd className="mt-1 font-medium">{selectedProduct.variant.size}</dd>
                                    </div>
                                    <div className="bg-muted/60 rounded-lg p-3">
                                        <dt className="text-muted-foreground text-xs">Availability</dt>
                                        <dd className="mt-1 font-medium">
                                            {selectedProduct.available_stock > 0 ? `${selectedProduct.available_stock} in stock` : 'Sold out'}
                                        </dd>
                                    </div>
                                    <div className="bg-muted/60 rounded-lg p-3">
                                        <dt className="text-muted-foreground text-xs">Price</dt>
                                        <dd className="mt-1 font-semibold">{currency.format(selectedProduct.variant.price)}</dd>
                                    </div>
                                </dl>
                                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={selectedProduct.available_stock === 0 || processing}
                                        onClick={() => {
                                            const product = selectedProduct;
                                            setSelectedProduct(null);
                                            addToCart(product);
                                        }}
                                    >
                                        <ShoppingCart className="size-4" />
                                        Add to cart
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={selectedProduct.available_stock === 0 || processing}
                                        onClick={() => {
                                            const product = selectedProduct;
                                            setSelectedProduct(null);
                                            beginCheckout([{ product_id: product.id, quantity: 1 }], product.id);
                                        }}
                                    >
                                        Buy now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {sizePickerProduct && (
                <SizePickerModal
                    product={sizePickerProduct}
                    mode={sizePickerMode}
                    open={sizePickerOpen}
                    onClose={() => {
                        setSizePickerOpen(false);
                        setSizePickerProduct(null);
                    }}
                />
            )}

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent className="flex w-full flex-col sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Your cart ({cartCount})</SheetTitle>
                        <SheetDescription>Review your shoes before placing your order.</SheetDescription>
                    </SheetHeader>

                    {checkoutError && (
                        <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm" role="alert">
                            {checkoutError}
                        </p>
                    )}

                    {cartLines.length > 0 ? (
                        <>
                            <div className="flex-1 space-y-4 overflow-y-auto py-4">
                                {cartLines.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex gap-3 border-b pb-4">
                                        <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
                                            {product.image ? (
                                                <img className="size-full object-cover" src={product.image} alt="" />
                                            ) : (
                                                <div className="flex size-full items-center justify-center">
                                                    <ShoppingBag className="text-muted-foreground size-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {product.variant.color} Â· {product.variant.size}
                                            </p>
                                            <p className="mt-2 text-sm font-semibold">{currency.format(product.variant.price)}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7"
                                                    aria-label={`Decrease ${product.name} quantity`}
                                                    onClick={() => updateQuantity(product.id, quantity - 1)}
                                                >
                                                    <Minus className="size-3" />
                                                </Button>
                                                <span className="w-5 text-center text-sm">{quantity}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7"
                                                    aria-label={`Increase ${product.name} quantity`}
                                                    disabled={quantity >= product.available_stock}
                                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                                >
                                                    <Plus className="size-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive ml-auto size-7"
                                                    aria-label={`Remove ${product.name} from cart`}
                                                    onClick={() => updateQuantity(product.id, 0)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto border-t pt-4">
                                <div className="mb-4 flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-semibold">{currency.format(subtotal)}</span>
                                </div>
                                <Button
                                    type="button"
                                    className="w-full"
                                    disabled={processing || cartLines.length === 0}
                                    onClick={() => beginCheckout(cartLines.map(({ product, quantity }) => ({ product_id: product.id, quantity })))}
                                >
                                    Continue to checkout
                                    <ShoppingBag className="size-4" />
                                </Button>
                                <p className="text-muted-foreground mt-2 text-center text-xs">
                                    Select a payment method and confirm your billing details in checkout.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                            <ShoppingCart className="text-muted-foreground size-10" />
                            <p className="mt-3 font-medium">Your cart is empty</p>
                            <p className="text-muted-foreground mt-1 text-sm">Add a pair from the collection to get started.</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog
                open={checkoutOpen}
                onOpenChange={(open) => {
                    setCheckoutOpen(open);
                    if (!open) {
                        setCheckoutError(null);
                        setCheckoutErrors({});
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Checkout</DialogTitle>
                        <DialogDescription>Confirm your delivery details and choose how you want to pay.</DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            placeOrder();
                        }}
                    >
                        {checkoutError && (
                            <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm" role="alert">
                                {checkoutError}
                            </p>
                        )}

                        <section aria-labelledby="billing-heading">
                            <h3 id="billing-heading" className="mb-3 text-sm font-semibold">
                                Delivery and billing details
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="text-sm font-medium sm:col-span-2">
                                    Full name
                                    <Input
                                        className="mt-1.5"
                                        autoComplete="name"
                                        value={checkoutData.name}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, name: event.target.value }))}
                                    />
                                    {fieldError('billing.name')}
                                </label>
                                <label className="text-sm font-medium">
                                    Phone number
                                    <Input
                                        className="mt-1.5"
                                        type="tel"
                                        autoComplete="tel"
                                        value={checkoutData.phone}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, phone: event.target.value }))}
                                    />
                                    {fieldError('billing.phone')}
                                </label>
                                <label className="text-sm font-medium">
                                    City
                                    <Input
                                        className="mt-1.5"
                                        autoComplete="address-level2"
                                        value={checkoutData.city}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, city: event.target.value }))}
                                    />
                                    {fieldError('billing.city')}
                                </label>
                                <label className="text-sm font-medium sm:col-span-2">
                                    Street address
                                    <Input
                                        className="mt-1.5"
                                        autoComplete="street-address"
                                        value={checkoutData.address}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, address: event.target.value }))}
                                    />
                                    {fieldError('billing.address')}
                                </label>
                                <label className="text-sm font-medium">
                                    Postal code <span className="text-muted-foreground font-normal">(optional)</span>
                                    <Input
                                        className="mt-1.5"
                                        autoComplete="postal-code"
                                        value={checkoutData.postal_code}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, postal_code: event.target.value }))}
                                    />
                                    {fieldError('billing.postal_code')}
                                </label>
                                <label className="text-sm font-medium">
                                    Country
                                    <Input
                                        className="mt-1.5"
                                        autoComplete="country-name"
                                        value={checkoutData.country}
                                        onChange={(event) => setCheckoutData((current) => ({ ...current, country: event.target.value }))}
                                    />
                                    {fieldError('billing.country')}
                                </label>
                            </div>
                        </section>

                        <section aria-labelledby="payment-heading" className="space-y-3">
                            <h3 id="payment-heading" className="text-sm font-semibold">
                                Payment method
                            </h3>
                            <select
                                aria-label="Payment method"
                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                value={checkoutData.payment_method}
                                onChange={(event) =>
                                    setCheckoutData((current) => ({
                                        ...current,
                                        payment_method: event.target.value === 'cod' ? 'cod' : 'counter',
                                        payment_reference: '',
                                    }))
                                }
                            >
                                <option value="counter">Pay at the counter</option>
                                <option value="cod">Cash on delivery</option>
                            </select>
                            {fieldError('payment_method')}
                            {checkoutData.payment_method === 'counter' ? (
                                <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <p className="text-sm font-medium">Pay at the counter</p>
                                    <p className="text-muted-foreground text-xs leading-5">Pay for your order at the counter when you collect it.</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground bg-muted/60 rounded-lg p-3 text-xs">
                                    Payment will be due upon delivery. The order will remain pending until confirmed by the store.
                                </p>
                            )}
                        </section>

                        <section aria-labelledby="checkout-summary-heading" className="space-y-3 border-t pt-4">
                            <h3 id="checkout-summary-heading" className="text-sm font-semibold">
                                Order summary
                            </h3>
                            <div className="max-h-36 space-y-2 overflow-y-auto">
                                {checkoutLines.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex justify-between gap-4 text-sm">
                                        <span className="truncate">
                                            {product.name} × {quantity}
                                        </span>
                                        <span className="shrink-0">{currency.format(product.variant.price * quantity)}</span>
                                    </div>
                                ))}
                                {checkoutLines.length === 0 && <p className="text-muted-foreground text-sm">No available items in this order.</p>}
                            </div>
                            <div className="flex justify-between border-t pt-3 text-sm font-semibold">
                                <span>Subtotal</span>
                                <span>{currency.format(checkoutSubtotal)}</span>
                            </div>
                        </section>

                        <Button type="submit" className="w-full" disabled={processing || checkoutLines.length === 0}>
                            {processing ? 'Placing order…' : `Place pending order · ${currency.format(checkoutSubtotal)}`}
                            <ShoppingBag className="size-4" />
                        </Button>
                        <p className="text-muted-foreground text-center text-xs">
                            No payment is processed automatically. Your order and payment status will appear in transaction history.
                        </p>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
