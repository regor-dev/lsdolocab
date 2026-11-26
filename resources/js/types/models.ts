// ==========================================
// Base & Generic Utilities
// ==========================================

export type Id = number;

/**
 * Generic Laravel LengthAwarePaginator response structure.
 */
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/**
 * Standard API Response envelope wrapper.
 */
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
}

// ==========================================
// Enums & Literals
// ==========================================

export type MovementTypeStatus = 'stock_in' | 'stock_out';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type StockLogStatus = 'pending' | 'approved' | 'rejected';

// ==========================================
// Domain Models
// ==========================================

export interface User {
    id: Id;
    name: string;
    email: string;
    email_verified_at?: string | null;
    age?: number | null;
    address?: string | null;
    img?: string | null;
    roles?: Role[];
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: Id;
    role_name: string;
    users?: User[];
    created_at: string;
    updated_at: string;
}

export interface Brand {
    id: Id;
    brand_name: string;
    products_count?: number;
    img?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SizeCategory {
    id: Id;
    category_name: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: Id;
    brand_id: Id;
    name: string;
    description?: string | null;
    img?: string | null;
    brand?: Brand;
    variants?: ProductVariant[];
    stocks?: Stock[];
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    id: Id;
    product_id: Id;
    category_id: Id;
    color: string;
    size: string;
    sku: string;
    price: number;
    product?: Product;
    category?: SizeCategory;
    stocks?: Stock[];
    created_at: string;
    updated_at: string;
}

export interface Stock {
    id: Id;
    product_id: Id;
    variant_id?: Id | null;
    status: StockStatus;
    quantity: number;
    product?: Product;
    variant?: ProductVariant;
    created_at: string;
    updated_at: string;
}

export interface MovementType {
    id: Id;
    movement_status: MovementTypeStatus;
    created_at: string;
    updated_at: string;
}

export interface StockMovement {
    id: Id;
    product_id: Id;
    movement_id: Id;
    quantity_change: number;
    product?: Product;
    movement_type?: MovementType;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: Id;
    customer_name: string;
    order_number: string;
    order_date: string;
    status: OrderStatus;
    total: number;
    order_items?: OrderItem[];
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: Id;
    order_id: Id;
    product_id: Id;
    quantity: number;
    unit_price: number;
    sub_total: number;
    order?: Order;
    product?: Product;
    created_at: string;
    updated_at: string;
}

export interface StockLog {
    id: Id;
    user_id: Id;
    stock_movement_id: Id;
    status: StockLogStatus;
    user?: User;
    stock_movement?: StockMovement;
    created_at: string;
    updated_at: string;
}

export interface OrderLog {
    id: Id;
    order_item_id: Id;
    stock_movement_id: Id;
    order_item?: OrderItem;
    stock_movement?: StockMovement;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Paginated Resource Type Aliases for UI
// ==========================================

export type PaginatedUsers = PaginatedResponse<User>;
export type PaginatedProducts = PaginatedResponse<Product>;
export type PaginatedOrders = PaginatedResponse<Order>;
export type PaginatedStocks = PaginatedResponse<Stock>;
export type PaginatedStockLogs = PaginatedResponse<StockLog>;

// ==========================================
// UI Query Parameters & Filtering State
// ==========================================

export interface QueryParams {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    [key: string]: string | number | boolean | undefined;
}

export interface ProductFilters extends QueryParams {
    brand_id?: Id;
    category_id?: Id;
    min_price?: number;
    max_price?: number;
}

export interface OrderFilters extends QueryParams {
    status?: OrderStatus;
    start_date?: string;
    end_date?: string;
}

// ==========================================
// Form / Mutation Payloads (DTOs)
// ==========================================

export interface CreateProductPayload {
    brand_id: Id;
    name: string;
    description?: string;
    image?: File;
    variants?: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
}

export interface CreateOrderPayload {
    customer_name: string;
    order_date: string;
    items: {
        product_id: Id;
        quantity: number;
    }[];
}

export interface UpdateStockPayload {
    product_id: Id;
    quantity_change: number;
    movement_type: MovementTypeStatus;
    reason?: string;
}
