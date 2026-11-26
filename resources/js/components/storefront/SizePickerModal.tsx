'use client';

import { Button } from '@/components/ui/button';
import { addToCart } from '@/lib/storefrontCart';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { Minus, Package, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const US_SIZES = ['7', '8', '9', '10', '11', '12'] as const;
type UsSize = (typeof US_SIZES)[number];

export interface SizePickerProduct {
    id: number | string;
    name: string;
    brand?: string;
    price: number;
    image: string | null;
    image_url: string | null;
    /**
     * Stock keyed by US size, e.g. `{ '7': 3, '9': 0 }` (backend sends `size_stocks`).
     * When null or empty, `stock` is distributed across US sizes 7-12.
     */
    size_stocks?: Record<string, number> | null;
    /** Total units on hand; used to split per-size stock when `size_stocks` is absent. */
    stock?: number;
    available_stock?: number;
}

export interface SizePickerModalProps {
    product: SizePickerProduct;
    open: boolean;
    mode: 'cart' | 'buy';
    onClose: () => void;
}

function stockForSize(
    sizeStock: Record<string, number>,
    availableStock: number | undefined,
    size: UsSize,
): number {
    return sizeStock[size] ?? availableStock ?? 0;
}

/**
 * Distributes a total stock count across the US sizes so every size pill shows
 * an exact remaining stock count instead of sharing one pooled number.
 */
function distributeStock(total: number): Record<UsSize, number> {
    const counts: Record<UsSize, number> = {
        '7': 0,
        '8': 0,
        '9': 0,
        '10': 0,
        '11': 0,
        '12': 0,
    };
    const qty = Math.max(0, Math.trunc(total));
    const base = Math.floor(qty / US_SIZES.length);
    const remainder = qty % US_SIZES.length;
    US_SIZES.forEach((size, index) => {
        counts[size] = base + (index < remainder ? 1 : 0);
    });
    return counts;
}

export default function SizePickerModal({
    product,
    open,
    mode,
    onClose,
}: SizePickerModalProps) {
    const sizeStock = useMemo(() => {
        const explicit = product.size_stocks ?? {};
        if (Object.keys(explicit).length > 0) {
            return explicit;
        }
        return distributeStock(product.stock ?? product.available_stock ?? 0);
    }, [product.size_stocks, product.stock, product.available_stock]);
    const availableStock = product.available_stock;
    const [selectedSize, setSelectedSize] = useState<UsSize>('7');
    const [quantity, setQuantity] = useState(1);
    const [imageFailed, setImageFailed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const selectedStock = stockForSize(sizeStock, availableStock, selectedSize);

    useEffect(() => {
        const firstAvailable = US_SIZES.find(
            (size) => stockForSize(sizeStock, availableStock, size) > 0,
        );
        setSelectedSize(firstAvailable ?? US_SIZES[0]);
        setQuantity(1);
    }, [product.id, availableStock, sizeStock]);

    useEffect(() => {
        if (!open) {
            setSubmitting(false);
        }
    }, [open]);

    function selectSize(size: UsSize): void {
        const stock = stockForSize(sizeStock, availableStock, size);
        setSelectedSize(size);
        setQuantity((current) => (stock > 0 ? Math.min(Math.max(current, 1), stock) : 1));
    }

    function decrementQuantity(): void {
        if (quantity > 1) setQuantity(quantity - 1);
    }

    function incrementQuantity(): void {
        if (quantity < selectedStock) setQuantity(quantity + 1);
    }

    const addItem = useCallback(() => {
        addToCart(
            { id: Number(product.id), available_stock: selectedStock, size: selectedSize },
            quantity,
        );
    }, [product.id, selectedStock, selectedSize, quantity]);

    const handleAddToCart = useCallback(() => {
        if (submitting || selectedStock < 1) return;
        setSubmitting(true);
        addItem();
        onClose();
    }, [submitting, selectedStock, addItem, onClose]);

    const handleBuyNow = useCallback(() => {
        if (submitting || selectedStock < 1) return;
        setSubmitting(true);

        const buyNowItem = {
            product_id: Number(product.id),
            size: selectedSize,
            quantity,
        };

        try {
            window.localStorage.setItem('lsdolocab.buy_now', JSON.stringify(buyNowItem));
        } catch (error) {
            console.error('Unable to persist buy now item.', error);
            setSubmitting(false);
            return;
        }

        const query = new URLSearchParams({
            mode: 'buy_now',
            product_id: String(Number(product.id)),
            size: selectedSize,
            quantity: String(quantity),
        }).toString();

        router.visit(`/checkout?${query}`);
        onClose();
    }, [submitting, product.id, selectedSize, quantity, selectedStock, onClose]);

    const isOutOfStock = selectedStock < 1;
    const price = Number(product.price);
    const formattedPrice = Number.isFinite(price) ? price.toFixed(2) : '0.00';
    const imageUrl = product.image_url ?? product.image;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pick your size</DialogTitle>
                    <DialogDescription>{product.name}</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid gap-4 items-start sm:grid-cols-2 sm:items-center">
                        <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                            {imageUrl && !imageFailed ? (
                                <img
                                    className="size-full object-cover"
                                    src={imageUrl}
                                    alt={product.name}
                                    onError={() => setImageFailed(true)}
                                />
                            ) : (
                                <Package className="text-muted-foreground size-8" aria-hidden="true" />
                            )}
                        </div>
                        <div className="space-y-2">
                            {product.brand && (
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                    {product.brand}
                                </p>
                            )}
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <p className="text-lg font-bold">₱{formattedPrice}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Size (US)
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                            {US_SIZES.map((size) => {
                                const sizeStockCount = stockForSize(sizeStock, availableStock, size);
                                return (
                                    <Button
                                        key={size}
                                        type="button"
                                        size="sm"
                                        variant={selectedSize === size ? 'default' : 'outline'}
                                        disabled={sizeStockCount < 1 || submitting}
                                        onClick={() => selectSize(size)}
                                        aria-pressed={selectedSize === size}
                                        aria-label={`Size ${size} US — ${sizeStockCount < 1 ? 'out of stock' : `${sizeStockCount} pairs left`}`}
                                    >
                                        {size}
                                    </Button>
                                );
                            })}
                        </div>
                        <p className={`text-sm font-medium${isOutOfStock ? ' text-destructive' : ''}`}>
                            {isOutOfStock ? 'Out of stock' : `${selectedStock} pairs left`}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Quantity
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                disabled={isOutOfStock || quantity <= 1 || submitting}
                                onClick={decrementQuantity}
                                aria-label="Decrease quantity"
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="w-5 text-center text-sm font-medium">{quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                disabled={isOutOfStock || quantity >= selectedStock || submitting}
                                onClick={incrementQuantity}
                                aria-label="Increase quantity"
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        variant={mode === 'buy' ? 'outline' : 'default'}
                        className="w-full"
                        disabled={isOutOfStock || submitting}
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className="mr-2 size-4" />
                        Add to Cart
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'buy' ? 'default' : 'outline'}
                        className="w-full"
                        disabled={isOutOfStock || submitting}
                        onClick={handleBuyNow}
                    >
                        <Truck className="mr-2 size-4" />
                        Proceed to Checkout
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
