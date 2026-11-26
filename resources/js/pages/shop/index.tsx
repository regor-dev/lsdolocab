import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SizePickerModal, { type SizePickerProduct } from '@/components/storefront/SizePickerModal';
import { Eye, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
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
    product_id: number;
    quantity: number;
    size: string;
}

interface ShopProps {
    products: StoreProduct[];
}

const cartStorageKey = (userId: number | null): string => (userId ? `lsdolocab.customer-cart-${userId}` : 'lsdolocab.customer-cart');
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const AVAILABLE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

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

export default function Shop({ products }: ShopProps) {
    const { auth, flash } = usePage<SharedData>().props;
    const user = auth?.user;
    const { url } = usePage();
    const [cart, setCart] = useState<CartEntry[]>(() => readCart(user?.id));
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [sortOrder, setSortOrder] = useState<'featured' | 'price-low' | 'price-high'>('featured');
    const [buyingNow, setBuyingNow] = useState(false);
    const [sizePickerOpen, setSizePickerOpen] = useState(false);
    const [sizePickerMode, setSizePickerMode] = useState<'cart' | 'buy'>('cart');
    const [sizePickerProduct, setSizePickerProduct] = useState<SizePickerProduct | null>(null);

    const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
    const spotlightProduct = products.find((product) => product.available_stock > 0) ?? products[0];

    useEffect(() => {
        if (selectedProduct) {
            setSelectedSize(selectedProduct.variant.size);
        } else {
            setSelectedSize('');
        }
    }, [selectedProduct]);
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

    function addToCart(entry: { product_id: number; size: string }) {
        const product = productsById.get(entry.product_id);

        if (!product) {
            return;
        }

        setCart((current) => {
            const existing = current.find((e) => e.product_id === entry.product_id);

            if (existing) {
                if (existing.quantity >= product.available_stock) {
                    return current;
                }

                return current.map((e) => (e.product_id === entry.product_id ? { ...e, quantity: existing.quantity + 1, size: entry.size } : e));
            }

            return [...current, { product_id: entry.product_id, quantity: 1, size: entry.size }];
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

    const handleBuyNow = (product: StoreProduct) => {
        router.post(
            route('checkout.store'),
            {
                items: [{ product_id: product.id, quantity: 1 }],
            },
            {
                preserveScroll: false,
                onStart: () => setBuyingNow(true),
                onFinish: () => setBuyingNow(false),
            },
        );
    };

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

                <section className="relative mt-6 min-h-[420px] overflow-hidden rounded-[2rem] bg-neutral-950 text-white sm:min-h-[480px]">
                    <div className="absolute -top-32 -right-20 size-[28rem] rounded-full bg-white/5 blur-3xl" />
                    <div className="relative grid min-h-[420px] gap-8 px-6 py-10 sm:min-h-[480px] sm:px-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:px-16">
                        <div className="relative z-10 max-w-2xl">
                            <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
                                Welcome back, {auth?.user?.name?.split(' ')[0] ?? 'Customer'}
                            </p>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200">
                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                {products.length} curated {products.length === 1 ? 'style' : 'styles'} in the collection
                            </span>
                            <h1 className="mt-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl xl:text-7xl">
                                Find your
                                <br />
                                next favorite
                                <br />
                                <span className="text-neutral-400">pair.</span>
                            </h1>
                            <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-300 sm:text-base">
                                Fresh styles, everyday comfort, and performance-ready footwear—all picked for your next step.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Button asChild className="h-11 bg-white px-5 text-neutral-950 hover:bg-neutral-200">
                                    <a href="#catalog">
                                        Explore shoes
                                        <ShoppingBag className="size-4" />
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
                                >
                                    <a href={route('orders.history')}>Order history</a>
                                </Button>
                                <span className="text-xs text-neutral-400">
                                    {products.filter((product) => product.available_stock > 0).length} styles currently in stock
                                </span>
                            </div>
                        </div>

                        <div className="relative mx-auto flex w-full max-w-xl items-center justify-center lg:h-full">
                            <div className="absolute size-64 rounded-full border border-white/10 sm:size-80" />
                            <div className="absolute size-52 rounded-full border border-white/10 sm:size-64" />
                            {spotlightProduct?.image ? (
                                <img
                                    src={spotlightProduct.image}
                                    alt={spotlightProduct.name}
                                    className="relative aspect-square w-[72%] rotate-3 rounded-[2rem] border border-white/10 object-cover shadow-2xl shadow-black/50"
                                />
                            ) : (
                                <div className="relative flex aspect-square w-[72%] rotate-3 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/50">
                                    <ShoppingBag className="size-24 text-white/60" strokeWidth={1} />
                                </div>
                            )}
                            {spotlightProduct && (
                                <div className="absolute right-0 bottom-5 rounded-2xl border border-white/10 bg-neutral-900/90 px-4 py-3 shadow-xl backdrop-blur sm:right-4">
                                    <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">Spotlight style</p>
                                    <p className="mt-1 max-w-48 truncate text-sm font-semibold">{spotlightProduct.name}</p>
                                    <p className="mt-1 text-sm text-neutral-300">{currency.format(spotlightProduct.variant.price)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section id="catalog" className="scroll-mt-24 pt-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">The collection</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Shoes for every day</h2>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl">
                            <div className="relative min-w-0 flex-1">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <input
                                    aria-label="Search shoes"
                                    className="border-input bg-background placeholder:text-muted-foreground h-11 w-full rounded-md border px-9 py-2 text-sm"
                                    placeholder="Search shoes, brand, or size"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                            <select
                                aria-label="Sort shoes"
                                className="border-input bg-background h-11 rounded-md border px-3 text-sm sm:w-48"
                                value={sortOrder}
                                onChange={(event) => {
                                    const value = event.currentTarget.value;

                                    if (value === 'featured' || value === 'price-low' || value === 'price-high') {
                                        setSortOrder(value);
                                    }
                                }}
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: low to high</option>
                                <option value="price-high">Price: high to low</option>
                            </select>
                        </div>
                    </div>

                    <nav id="brands" className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filter by brand">
                        {['All', ...brands].map((brand) => (
                            <Button
                                key={brand}
                                type="button"
                                size="sm"
                                variant={selectedBrand === brand ? 'default' : 'outline'}
                                className="shrink-0 rounded-full px-4"
                                aria-pressed={selectedBrand === brand}
                                onClick={() => setSelectedBrand(brand)}
                            >
                                {brand}
                            </Button>
                        ))}
                    </nav>

                    {visibleProducts.length > 0 ? (
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {visibleProducts.map((product) => {
                                const cartQuantity = cart.find((entry) => entry.product_id === product.id)?.quantity ?? 0;
                                const unavailable = product.available_stock === 0;
                                const atStockLimit = cartQuantity >= product.available_stock;

                                return (
                                    <article
                                        key={product.id}
                                        className="bg-card group overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                                            {product.image ? (
                                                <img
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                    src={product.image}
                                                    alt={product.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-300 text-neutral-500 dark:from-neutral-800 dark:to-neutral-950">
                                                    <ShoppingBag className="size-16" strokeWidth={1} />
                                                </div>
                                            )}
                                            <span className="bg-background/90 absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium">
                                                {unavailable ? 'Sold out' : `${product.available_stock} in stock`}
                                            </span>
                                        </div>
                                        <div className="flex min-h-56 flex-col space-y-4 p-5">
                                            <div>
                                                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{product.brand}</p>
                                                <h3 className="mt-1 truncate text-lg font-semibold">{product.name}</h3>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {product.variant.color} · {product.variant.size}
                                                </p>
                                            </div>
                                            {product.description && (
                                                <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm">{product.description}</p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold">{currency.format(product.variant.price)}</span>
                                                {cartQuantity > 0 && <span className="text-muted-foreground text-xs">{cartQuantity} in cart</span>}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto justify-start p-0 text-sm"
                                                onClick={() => setSelectedProduct(product)}
                                            >
                                                <Eye className="size-4" />
                                                View product information
                                            </Button>
                                            <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="px-2"
                                                    disabled={unavailable || atStockLimit}
                                                    onClick={() => {
                                                        setSizePickerMode('cart');
                                                        setSizePickerProduct({
                                                            id: product.id,
                                                            name: product.name,
                                                            brand: product.brand,
                                                            price: product.variant.price,
                                                            image: product.image,
                                                            image_url: product.image,
                                                            available_stock: product.available_stock,
                                                        });
                                                        setSizePickerOpen(true);
                                                    }}
                                                >
                                                    <ShoppingCart className="size-4" />
                                                    Add to cart
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="px-2"
                                                    disabled={unavailable || buyingNow}
                                                    onClick={() => {
                                                        setSizePickerMode('buy');
                                                        setSizePickerProduct({
                                                            id: product.id,
                                                            name: product.name,
                                                            brand: product.brand,
                                                            price: product.variant.price,
                                                            image: product.image,
                                                            image_url: product.image,
                                                            available_stock: product.available_stock,
                                                        });
                                                        setSizePickerOpen(true);
                                                    }}
                                                >
                                                    Buy now
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
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

            <Dialog
                open={selectedProduct !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedProduct(null);
                        setSelectedSize('');
                    }
                }}
            >
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
                                        <div className="mt-1">
                                            <Select value={selectedSize} onValueChange={(value) => setSelectedSize(value ?? '')}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Size</SelectLabel>
                                                        {AVAILABLE_SIZES.map((size) => (
                                                            <SelectItem key={size} value={size}>
                                                                {size}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
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
                                        disabled={selectedProduct.available_stock === 0}
                                        onClick={() => {
                                            const product = selectedProduct;
                                            setSelectedProduct(null);
                                            addToCart({ product_id: product.id, size: selectedSize });
                                        }}
                                    >
                                        <ShoppingCart className="size-4" />
                                        Add to cart
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={selectedProduct.available_stock === 0 || buyingNow}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            if (!selectedProduct) {
                                                return;
                                            }
                                            handleBuyNow(selectedProduct);
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

                    {cartLines.length > 0 ? (
                        <>
                            <div className="flex-1 space-y-4 overflow-y-auto py-4">
                                {cartLines.map(({ product, quantity, size }) => (
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
                                                {product.variant.color} · {size}
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
                                <Link
                                    href={route('checkout')}
                                    className="border-input bg-background hover:bg-muted hover:text-foreground-focus inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Continue to checkout
                                    <ShoppingBag className="size-4" />
                                </Link>
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
        </AppLayout>
    );
}
