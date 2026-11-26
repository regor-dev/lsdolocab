'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { router } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CART_KEY = 'lsdolocab.customer-cart';

const US_SIZES = ['7', '8', '9', '10', '11', '12'] as const;

const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

interface StoreProduct {
    id: number;
    name: string;
    brand: string;
    color: string;
    image: string | null;
    image_url: string | null;
    variant: {
        color: string;
        size: string;
        price: number;
    };
    available_stock: number;
    size_stocks?: Record<string, number>;
}

interface CartEntry {
    product_id: number;
    quantity: number;
    size: string;
}

interface CartLine extends CartEntry {
    product: StoreProduct;
}

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
    products: StoreProduct[];
    userId?: number | null;
    onCheckout?: (items: CartEntry[]) => void;
}

function cartStorageKey(userId: number | null | undefined): string {
    return userId ? `${CART_KEY}-${userId}` : CART_KEY;
}

function isCartEntry(value: unknown): value is CartEntry {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const entry = value as {
        product_id?: unknown;
        quantity?: unknown;
        size?: unknown;
    };

    return (
        typeof entry.product_id === 'number' &&
        Number.isInteger(entry.product_id) &&
        typeof entry.quantity === 'number' &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        typeof entry.size === 'string'
    );
}

function readCart(userId: number | null | undefined): CartEntry[] {
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

        return value.filter(isCartEntry);
    } catch {
        return [];
    }
}

function stockForSize(product: StoreProduct | undefined, size: string): number {
    return product?.size_stocks?.[size] ?? product?.available_stock ?? 0;
}

export default function CartDrawer({
    open,
    onClose,
    products,
    userId = null,
    onCheckout,
}: CartDrawerProps) {
    const productsById = useMemo(
        () => new Map(products.map((product) => [product.id, product])),
        [products],
    );
    const [cart, setCart] = useState<CartEntry[]>(() => readCart(userId));
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const checkedInitialized = useRef(false);

    useEffect(() => {
        try {
            window.localStorage.setItem(cartStorageKey(userId), JSON.stringify(cart));
            window.dispatchEvent(new Event('storefront-cart-updated'));
        } catch (error) {
            console.error('Unable to save the shopping cart in this browser.', error);
        }
    }, [cart, userId]);

    useEffect(() => {
        if (!checkedInitialized.current && cart.length > 0) {
            checkedInitialized.current = true;
            setChecked(new Set(cart.map((entry) => entry.product_id)));
        }
    }, [cart]);

    const toggleProduct = useCallback((productId: number): void => {
        setChecked((current) => {
            const next = new Set(current);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    }, []);

    const updateQuantity = useCallback(
        (productId: number, size: string, quantity: number): void => {
            const product = productsById.get(productId);
            const stock = stockForSize(product, size);
            const nextQuantity = Math.min(Math.max(quantity, 1), stock);

            setCart((current) =>
                current.map((entry) => {
                    if (entry.product_id !== productId || entry.size !== size) {
                        return entry;
                    }

                    return { ...entry, quantity: nextQuantity };
                }),
            );
        },
        [productsById],
    );

    const changeSize = useCallback(
        (productId: number, currentSize: string, nextSize: string): void => {
            const product = productsById.get(productId);
            const stock = stockForSize(product, nextSize);

            setCart((current) =>
                current.map((entry) => {
                    if (entry.product_id !== productId || entry.size !== currentSize) {
                        return entry;
                    }

                    return {
                        ...entry,
                        size: nextSize,
                        quantity: Math.min(Math.max(entry.quantity, 1), stock) || 1,
                    };
                }),
            );
        },
        [productsById],
    );

    const removeEntry = useCallback(
        (productId: number, size: string): void => {
            setCart((current) =>
                current.filter(
                    (entry) => !(entry.product_id === productId && entry.size === size),
                ),
            );
            setChecked((current) => {
                const next = new Set(current);
                next.delete(productId);
                return next;
            });
        },
        [],
    );

    const unsized = useMemo(
        () =>
            cart
                .map((entry) => {
                    const product = productsById.get(entry.product_id);
                    return product ? ({ ...entry, product } as CartLine) : null;
                })
                .filter((line): line is CartLine => line !== null && line.size.length === 0),
        [cart, productsById],
    );
    const sized = useMemo(
        () =>
            cart
                .map((entry) => {
                    const product = productsById.get(entry.product_id);
                    return product ? ({ ...entry, product } as CartLine) : null;
                })
                .filter((line): line is CartLine => line !== null && line.size.length > 0),
        [cart, productsById],
    );
    const selectedLines = sized.filter((line) => checked.has(line.product.id));
    const cartCount = cart.reduce((total, entry) => total + entry.quantity, 0);
    const selectedSubtotal = selectedLines.reduce(
        (total, line) => total + line.product.variant.price * line.quantity,
        0,
    );
    const hasSelection = selectedLines.length > 0;

    const handleCheckoutSelected = useCallback((): void => {
        if (!hasSelection) {
            return;
        }

        const nextCart = selectedLines.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
            size: line.size,
        }));

        try {
            window.localStorage.setItem(cartStorageKey(userId), JSON.stringify(nextCart));
            window.dispatchEvent(new Event('storefront-cart-updated'));
        } catch (error) {
            console.error('Unable to persist the selected items for checkout.', error);
            return;
        }

        if (onCheckout) {
            onCheckout(nextCart);
            return;
        }

        router.visit('/checkout');
    }, [hasSelection, selectedLines, userId, onCheckout]);

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Your cart ({cartCount})</SheetTitle>
                    <SheetDescription>Review your shoes before placing your order.</SheetDescription>
                </SheetHeader>

                {unsized.length > 0 ? (
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Select a US size for these items before checking out:
                        </p>
                        {unsized.map((line) => (
                            <div
                                key={`${line.product.id}-unsized`}
                                className="flex gap-3 border-b pb-4"
                            >
                                <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
                                    {line.product.image ? (
                                        <img
                                            className="size-full object-cover"
                                            src={line.product.image}
                                            alt=""
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center">
                                            <ShoppingBag className="text-muted-foreground size-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold">
                                        {line.product.name}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {line.product.brand} Â· {line.product.variant.color}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold">
                                        {currency.format(line.product.variant.price)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs font-medium text-destructive">
                                            Size required
                                        </span>
                                        <select
                                            value={line.size}
                                            onChange={(event) =>
                                                changeSize(
                                                    line.product_id,
                                                    line.size,
                                                    event.target.value,
                                                )
                                            }
                                            className="border-input bg-background text-xs rounded-md border px-2 py-1.5"
                                            aria-label={`Select size for ${line.product.name}`}
                                        >
                                            <option value="">Select a US size</option>
                                            {US_SIZES.map((size) => (
                                                <option
                                                    key={size}
                                                    value={size}
                                                    disabled={stockForSize(line.product, size) < 1}
                                                >
                                                    US {size}
                                                    {stockForSize(line.product, size) < 1
                                                        ? ' (out of stock)'
                                                        : ` (${stockForSize(line.product, size)} left)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {sized.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <ShoppingCart className="text-muted-foreground size-10" />
                                <p className="mt-3 font-medium">Your cart is empty</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Add a pair from the collection to get started.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                                    {sized.map((line) => {
                                        const product = line.product;
                                        const stock = stockForSize(product, line.size);
                                        const isOutOfStock = stock < 1;

                                        return (
                                            <div
                                                key={`${line.product.id}-${line.size}`}
                                                className="flex gap-3 border-b pb-4"
                                            >
                                                <Checkbox
                                                    checked={checked.has(product.id)}
                                                    onCheckedChange={() => toggleProduct(product.id)}
                                                    aria-label={`Select ${product.name} for checkout`}
                                                />
                                                <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
                                                    {product.image ? (
                                                        <img
                                                            className="size-full object-cover"
                                                            src={product.image}
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center">
                                                            <ShoppingBag className="text-muted-foreground size-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-semibold">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {product.variant.color} Â· {line.size}
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold">
                                                        {currency.format(product.variant.price)}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[11px] shrink-0">
                                                            US {line.size}
                                                        </Badge>
                                                        <select
                                                            value={line.size}
                                                            onChange={(event) =>
                                                                changeSize(
                                                                    line.product_id,
                                                                    line.size,
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="border-input bg-background text-xs rounded-md border px-2 py-1.5 shrink-0"
                                                            disabled={isOutOfStock}
                                                            aria-label={`Switch size for ${product.name}`}
                                                        >
                                                            {US_SIZES.map((size) => {
                                                                const optionStock = stockForSize(
                                                                    product,
                                                                    size,
                                                                );
                                                                return (
                                                                    <option
                                                                        key={size}
                                                                        value={size}
                                                                        disabled={optionStock < 1}
                                                                    >
                                                                        US {size}
                                                                        {optionStock < 1
                                                                            ? ' — out of stock'
                                                                            : ` (${optionStock} left)`}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7"
                                                                disabled={isOutOfStock || line.quantity <= 1}
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        line.product_id,
                                                                        line.size,
                                                                        line.quantity - 1,
                                                                    )
                                                                }
                                                                aria-label={`Decrease ${product.name} quantity`}
                                                            >
                                                                <Minus className="size-3" />
                                                            </Button>
                                                            <span className="w-5 text-center text-sm">
                                                                {line.quantity}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7"
                                                                disabled={
                                                                    isOutOfStock ||
                                                                    line.quantity >= stock
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        line.product_id,
                                                                        line.size,
                                                                        line.quantity + 1,
                                                                    )
                                                                }
                                                                aria-label={`Increase ${product.name} quantity`}
                                                            >
                                                                <Plus className="size-3" />
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive ml-auto size-7"
                                                            aria-label={`Remove ${product.name} from cart`}
                                                            onClick={() =>
                                                                removeEntry(line.product_id, line.size)
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-auto border-t pt-4">
                                    <div className="mb-4 flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Subtotal (selected)
                                        </span>
                                        <span className="font-semibold">
                                            {currency.format(selectedSubtotal)}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full"
                                        disabled={!hasSelection}
                                        onClick={handleCheckoutSelected}
                                    >
                                        Checkout Selected Items
                                    </Button>
                                    <p className="text-muted-foreground mt-2 text-center text-xs">
                                        Only checked pairs are sent to checkout.
                                    </p>
                                </div>
                            </>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
