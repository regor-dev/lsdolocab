import { Button } from '@/components/ui/button';
import { Eye, Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface StorefrontProduct {
    id: number | string;
    name: string;
    brand: string;
    color: string;
    size: string;
    description: string | null;
    price: number;
    selling_price?: number;
    unit_price?: number;
    available_stock: number;
    stock?: number;
    image: string | null;
    image_url: string | null;
}

export interface ProductCardProps {
    product: StorefrontProduct;
    inCartQty: number;
    onAddToCart: (product: StorefrontProduct) => void;
    onBuyNow: (product: StorefrontProduct) => void;
    onViewDetails?: (product: StorefrontProduct) => void;
    buyingNow?: boolean;
}

function cleanText(value: string | null | undefined): string {
    return (value ?? '').replace(/Â·/g, '·').replace(/Â/g, '').trim();
}

export default function ProductCard({
    product,
    inCartQty,
    onAddToCart,
    onBuyNow,
    onViewDetails,
    buyingNow,
}: ProductCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageSrc = product.image_url || product.image;
    const stock = product.available_stock ?? product.stock ?? 0;
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 10;
    const numericPrice = Number(product.price ?? product.selling_price ?? product.unit_price ?? 0);
    const formattedPrice = Number.isFinite(numericPrice) ? numericPrice.toFixed(2) : '0.00';
    const cleanColor = cleanText(product.color);
    const cleanSize = cleanText(product.size);

    return (
        <article className={`bg-card group overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-lg${isOutOfStock ? ' opacity-70' : ''}`}>
            <div className={`bg-muted relative aspect-[4/3] overflow-hidden${isOutOfStock ? ' grayscale opacity-50' : ''}`}>
                {imageSrc && !imageFailed ? (
                    <img
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                        src={imageSrc}
                        alt={product.name}
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-neutral-900 text-neutral-400">
                        <Package className="size-16" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                )}
                {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-black/80 border border-red-500/40 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </span>
                )}
                {!isOutOfStock && (
                    <span className={`bg-background/90 absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium${isLowStock ? ' bg-amber-500/15 border-amber-500/40 text-amber-300' : ''}`}>
                        {isLowStock ? `Only ${stock} left` : `${stock} in stock`}
                    </span>
                )}
            </div>
            <div className="flex min-h-56 flex-col space-y-4 p-5">
                <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {product.brand}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {[cleanColor, cleanSize].filter(Boolean).join(' · ')}
                    </p>
                    {product.description && (
                        <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm">
                            {product.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">₱{formattedPrice}</span>
                    {inCartQty > 0 && (
                        <span className="text-muted-foreground text-xs">{inCartQty} in cart</span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="link"
                    className="h-auto justify-start p-0 text-sm"
                    onClick={() => onViewDetails?.(product)}
                >
                    <Eye className="size-4" />
                    View product information
                </Button>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                    {isOutOfStock ? (
                        <Button
                            type="button"
                            className="col-span-full w-full cursor-not-allowed bg-white/5 text-white/40 border border-white/10"
                            disabled
                        >
                            Out of Stock
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="px-2"
                                disabled={isOutOfStock}
                                onClick={() => onAddToCart(product)}
                            >
                                <ShoppingCart className="size-4" />
                                Add to cart
                            </Button>
                            <Button
                                type="button"
                                className="px-2"
                                disabled={isOutOfStock || buyingNow}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onBuyNow(product);
                                }}
                            >
                                Buy now
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}
