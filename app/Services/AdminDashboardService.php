<?php

namespace App\Services;

use App\Dtos\AdminDashboardData;
use App\Models\Order;
use App\Models\Product;
use App\Models\SizeCategory;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class AdminDashboardService
{
    public const CACHE_KEY = 'dashboard:admin:v1';

    /** Safety net for writes that bypass model events (bulk ->update()). */
    private const TTL_SECONDS = 60;

    private const STATUSES = ['in_stock', 'low_stock', 'out_of_stock'];

    public function summary(): AdminDashboardData
    {
        $payload = Cache::remember(
            self::CACHE_KEY,
            self::TTL_SECONDS,
            fn () => $this->build()->toArray(),
        );

        return AdminDashboardData::fromArray($payload);
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    private function build(): AdminDashboardData
    {
        $byStatus = Stock::inventoryByStatus(); // 1 grouped query (index-only)

        return new AdminDashboardData(
            overview: $this->overview(),
            inventory: [
                // Derived from the grouped result: no extra SUM(quantity) query.
                'totalUnits' => (int) $byStatus->sum('units'),
                'statuses' => collect(self::STATUSES)
                    ->map(fn (string $status) => [
                        'status' => $status,
                        'products' => (int) ($byStatus->get($status)->product_count ?? 0),
                        'units' => (int) ($byStatus->get($status)->units ?? 0),
                    ])
                    ->all(),
                'lowStock' => Stock::lowStock()
                    ->map(fn (Stock $stock) => [
                        'id' => $stock->id,
                        'status' => $stock->status,
                        'quantity' => (int) $stock->quantity,
                        'product' => $stock->product
                            ? ['id' => $stock->product->id, 'name' => $stock->product->name]
                            : null,
                    ])
                    ->all(),
            ],
            recentOrders: Order::recentOrders()
                ->map(fn (Order $order) => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->user?->name ?? $order->customer_name,
                    'status' => $order->status,
                    'total' => (float) $order->total,
                    'order_date' => $order->order_date?->toDateString(),
                ])
                ->all(),
            staffs: User::staffs()->map->only(['id', 'name', 'email'])->all(),
        );
    }

    /** @return array{products: int, categories: int, orders: int, customers: int} */
    private function overview(): array
    {
        // One scan of `orders` instead of COUNT(*) + a non-sargable
        // COUNT(DISTINCT COALESCE(CAST(user_id AS CHAR), ...)).
        $orders = Order::query()->toBase()->selectRaw(
            'COUNT(*) AS orders,
             COUNT(DISTINCT user_id) AS registered,
             COUNT(DISTINCT CASE WHEN user_id IS NULL THEN COALESCE(customer_email, customer_name) END) AS guests'
        )->first();

        return [
            'products' => Product::query()->count(),
            'categories' => SizeCategory::query()->count(),
            'orders' => (int) $orders->orders,
            'customers' => (int) $orders->registered + (int) $orders->guests,
        ];
    }
}
