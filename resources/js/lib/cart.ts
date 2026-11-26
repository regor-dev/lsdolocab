const CART_KEY = 'lsdolocab.customer-cart';
const BUY_NOW_KEY = 'lsdolocab.buy-now';

export interface CartItem {
    productId: number;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    maxStock: number;
    selected: boolean;
}

interface CartItemInput {
    productId: number;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    maxStock: number;
}

function cartItemKey(productId: number, size: string): string {
    return `${productId}:${size}`;
}

function isCartItem(value: unknown): value is CartItem {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const entry = value as {
        productId?: unknown;
        name?: unknown;
        price?: unknown;
        image?: unknown;
        size?: unknown;
        quantity?: unknown;
        maxStock?: unknown;
        selected?: unknown;
    };

    return (
        typeof entry.productId === 'number' &&
        Number.isInteger(entry.productId) &&
        typeof entry.name === 'string' &&
        entry.name.length > 0 &&
        typeof entry.price === 'number' &&
        Number.isFinite(entry.price) &&
        typeof entry.image === 'string' &&
        typeof entry.size === 'string' &&
        entry.size.length > 0 &&
        typeof entry.quantity === 'number' &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        typeof entry.maxStock === 'number' &&
        Number.isInteger(entry.maxStock) &&
        entry.maxStock >= 0 &&
        typeof entry.selected === 'boolean'
    );
}

function getStoredCart(): CartItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = window.localStorage.getItem(CART_KEY);

        if (!stored) {
            return [];
        }

        const value: unknown = JSON.parse(stored);

        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(isCartItem);
    } catch (error) {
        console.error('Unable to restore the saved shopping cart.', error);
        return [];
    }
}

function persistCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Unable to persist the saved shopping cart.', error);
        return;
    }

    window.dispatchEvent(new Event('storefront-cart-updated'));
}

export function getCartItems(): CartItem[] {
    return getStoredCart();
}

export function addToCart(item: CartItemInput): void {
    const size = String(item.size ?? '').trim();

    if (size.length === 0) {
        // Unsized items are strictly rejected; they never enter the cart.
        return;
    }

    const quantity = Math.max(0, Math.trunc(item.quantity));
    const maxStock = Math.max(0, Math.trunc(item.maxStock));

    if (quantity === 0 || maxStock < 1) {
        return;
    }

    const cart = getStoredCart();
    const key = cartItemKey(item.productId, size);
    const existingIndex = cart.findIndex(
        (entry) => cartItemKey(entry.productId, entry.size) === key,
    );

    const next: CartItem = {
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        size,
        quantity: Math.min(quantity, maxStock),
        maxStock,
        selected: true,
    };

    let nextCart: CartItem[];

    if (existingIndex >= 0) {
        nextCart = cart.map((entry, index) => {
            if (index !== existingIndex) {
                return entry;
            }

            return {
                ...entry,
                ...next,
                quantity: Math.min(entry.quantity + next.quantity, maxStock),
            };
        });
    } else {
        nextCart = [...cart, next];
    }

    persistCart(nextCart);
}

export function updateCartItemSize(
    oldKey: string,
    newSize: string,
    newMaxStock: number,
): void {
    const size = String(newSize ?? '').trim();

    if (size.length === 0) {
        return;
    }

    const maxStock = Math.max(0, Math.trunc(newMaxStock));

    if (maxStock < 1) {
        return;
    }

    const [productIdPart, oldSizePart] = oldKey.split(':');
    const productId = Number(productIdPart);

    if (!Number.isInteger(productId) || oldSizePart === undefined) {
        return;
    }

    const cart = getStoredCart();
    const existingIndex = cart.findIndex(
        (entry) => cartItemKey(entry.productId, entry.size) === oldKey,
    );

    if (existingIndex < 0) {
        return;
    }

    const existing = cart[existingIndex];
    const newKey = cartItemKey(productId, size);
    const mergeIndex = cart.findIndex(
        (entry, index) =>
            index !== existingIndex &&
            cartItemKey(entry.productId, entry.size) === newKey,
    );

    let nextCart: CartItem[];

    if (mergeIndex >= 0) {
        const merged = {
            ...cart[mergeIndex],
            quantity: Math.min(cart[mergeIndex].quantity + existing.quantity, maxStock),
            maxStock,
            selected: true,
        };
        nextCart = cart.filter(
            (_entry, index) => index !== existingIndex && index !== mergeIndex,
        );
        nextCart.push(merged);
    } else {
        nextCart = cart.map((entry, index) => {
            if (index !== existingIndex) {
                return entry;
            }

            return {
                ...entry,
                size,
                maxStock,
                quantity: Math.min(entry.quantity, maxStock),
                selected: true,
            };
        });
    }

    persistCart(nextCart);
}

export function removeCartItem(key: string): void {
    const [productIdPart, sizePart] = key.split(':');
    const productId = Number(productIdPart);

    if (!Number.isInteger(productId) || sizePart === undefined) {
        return;
    }

    const cart = getStoredCart();
    const nextCart = cart.filter(
        (entry) => cartItemKey(entry.productId, entry.size) !== key,
    );

    if (nextCart.length === cart.length) {
        return;
    }

    persistCart(nextCart);
}

export function setBuyNowItem(item: CartItemInput): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item));
    } catch (error) {
        console.error('Unable to persist the buy now item.', error);
    }
}

export function getBuyNowItem(): CartItem | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.sessionStorage.getItem(BUY_NOW_KEY);

        if (!stored) {
            return null;
        }

        const value: unknown = JSON.parse(stored);

        return isCartItem(value) ? value : null;
    } catch (error) {
        console.error('Unable to restore the buy now item.', error);
        return null;
    }
}

export function clearBuyNowItem(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(BUY_NOW_KEY);
    } catch (error) {
        console.error('Unable to clear the buy now item.', error);
    }
}
