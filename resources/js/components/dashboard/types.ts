export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface DashboardProps {
    userName: string;
    canManage: boolean;
    staffs: { id: number; name: string; email: string }[];
    overview: { products: number; categories: number; orders: number; customers: number };
    inventory: {
        totalUnits: number;
        statuses: { status: StockStatus; products: number; units: number }[];
        lowStock: { id: number; status: string; quantity: number; product: { id: number; name: string } | null }[];
    };
    recentOrders: {
        id: number;
        order_number: string;
        customer_name: string;
        status: string;
        total: number | string;
        order_date: string | null;
    }[];
}
