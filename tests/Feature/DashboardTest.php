<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\SizeCategory;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_staff_users_are_redirected_to_stocks_from_dashboard(): void
    {
        $user = User::factory()->create();
        $staffRole = Role::query()->firstOrCreate(['name' => Role::STAFF, 'guard_name' => 'web']);
        $user->assignRole($staffRole);

        $this->actingAs($user);

        $this->get('/dashboard')->assertRedirect('/stocks');
    }

    public function test_the_dashboard_displays_live_store_and_inventory_data(): void
    {
        $this->actingAsAdmin(['name' => 'Dashboard User']);
        $staffRole = Role::factory()->create(['role_name' => 'Staff']);
        $staff = User::factory()->create([
            'name' => 'Store Staff',
            'email' => 'staff@example.com',
        ]);
        $staff->assignRole($staffRole);

        $category = SizeCategory::factory()->create();
        $variant = ProductVariant::factory()->create(['category_id' => $category->id]);
        $product = Product::factory()->create(['product_var_id' => $variant->id]);
        Stock::factory()->create([
            'product_id' => $product->id,
            'status' => 'low_stock',
            'quantity' => 2,
        ]);
        Order::factory()->create([
            'customer_name' => 'Dashboard Customer',
            'order_number' => 'ORD-DASH-001',
            'total' => 125.50,
        ]);

        $this->get('/dashboard')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('userName', 'Dashboard User')
            ->where('canManage', true)
            ->where('overview.products', 1)
            ->where('overview.categories', 1)
            ->where('overview.orders', 1)
            ->where('overview.customers', 1)
            ->has('staffs', 1)
            ->where('staffs.0.name', 'Store Staff')
            ->where('staffs.0.email', 'staff@example.com')
            ->where('inventory.totalUnits', 2)
            ->where('inventory.statuses.1.status', 'low_stock')
            ->where('inventory.statuses.1.products', 1)
            ->where('inventory.lowStock.0.quantity', 2)
            ->where('recentOrders.0.order_number', 'ORD-DASH-001'));
    }
}
