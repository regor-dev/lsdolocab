<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;

class DashboardService
{
    public function __construct(
        private CheckoutService $checkoutService,
        private ProductService $productService,
        private AdminDashboardService $adminDashboard,
    ) {}

    /**
     * @return array{component: string, props: array<string, mixed>}
     */
    public function dataFor(User $user): array
    {
        $isAdmin = $user->hasRole('Admin');

        if ($user->isCustomer() && ! $isAdmin) {
            return $this->customerDashboard($user);
        }

        // Previously any authenticated user without a role fell through to the
        // admin dashboard. Be explicit instead.
        abort_unless($isAdmin || $user->hasRole('Staff'), 403);

        return $this->staffDashboard($user, $isAdmin);
    }

    /**
     * @return array{component: string, props: array<string, mixed>}
     */
    private function staffDashboard(User $user, bool $canManage): array
    {
        $data = $this->adminDashboard->summary();

        return [
            'component' => 'dashboard',
            'props' => [
                'userName' => $user->name,
                'canManage' => $canManage,
                'overview' => $data->overview,
                'inventory' => $data->inventory,
                // Cached globally, so role filtering happens here, never in the cache.
                'staffs' => $canManage ? $data->staffs : [],
                'recentOrders' => $canManage ? $data->recentOrders : [],
            ],
        ];
    }

    /**
     * @return array{component: string, props: array<string, mixed>}
     */
    private function customerDashboard(User $user): array
    {
        return [
            'component' => 'storefront/index',
            'props' => [
                'products' => $this->productService->getStorefrontProducts(),
                'orders' => collect($this->checkoutService->customerOrderHistory($user)->items())
                    ->map(fn (Order $order) => $this->checkoutService->transformOrder($order))
                    ->all(),
                'billing' => $user->toCustomerProfile(),
            ],
        ];
    }
}
