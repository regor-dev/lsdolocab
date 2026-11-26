import { router } from '@inertiajs/react';

const CART_KEY = 'lsdolocab.customer-cart';

export interface StorefrontCartItem {
    product_id: number;
    quantity: number;
    size: string;
}

function cartStorageKey(userId: number | null | undefined): string {
    return userId ? `${CART_KEY}-${userId}` : CART_KEY;
}

function isCartItem(value: unknown): value is StorefrontCartItem {
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

export function getCartItems(userId: number | null | undefined = null): StorefrontCartItem[] {
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

        return value.filter(isCartItem);
    } catch {
        return [];
    }
}

export function getTotalCartCount(userId: number | null | undefined = null): number {
    return getCartItems(userId).reduce((total, item) => total + item.quantity, 0);
}

export function addToCart(
    product: { id: number; available_stock: number; size?: string },
    qty: number = 1,
    userId: number | null | undefined = null,
): void {
    if (typeof window === 'undefined') {
        return;
    }

    const quantity = Math.max(0, Math.trunc(qty));

    if (quantity === 0 || product.available_stock < 1) {
        return;
    }

    const key = cartStorageKey(userId);
    const cart = getCartItems(userId);
    const size = product.size ?? '';
    const existingIndex = cart.findIndex(
        (item) => item.product_id === product.id && item.size === size,
    );

    let nextCart: StorefrontCartItem[];

    if (existingIndex >= 0) {
        nextCart = cart.map((item, index) => {
            if (index !== existingIndex) {
                return item;
            }

            return {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.available_stock),
            };
        });
    } else {
        nextCart = [
            ...cart,
            {
                product_id: product.id,
                quantity: Math.min(quantity, product.available_stock),
                size,
            },
        ];
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(nextCart));
    } catch (error) {
        console.error('Unable to persist cart to localStorage.', error);
        return;
    }

    window.dispatchEvent(new Event('storefront-cart-updated'));
}

export function buyNowProduct(
    product: { id: number; available_stock: number; size?: string },
    userId: number | null | undefined = null,
): void {
    addToCart(product, 1, userId);
    router.visit('/checkout');
}

export function goToCheckout(): void {
    router.visit('/checkout');
}
