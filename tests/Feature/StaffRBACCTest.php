<?php

namespace Tests\Feature;

use App\Models\MovementType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderLog;
use App\Models\Product;
use App\Models\Role;
use App\Models\Stock;
use App\Models\StockLog;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class StaffRBACCTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    protected function actingAsStaff(array $attributes = []): User
    {
        $role = Role::query()->firstOrCreate(['name' => 'Staff', 'guard_name' => 'web']);
        $user = User::factory()->create($attributes);
        $user->assignRole($role);

        $this->actingAs($user);

        return $user;
    }

    public function test_staff_can_view_orders_and_update_order_status(): void
    {
        $staff = $this->actingAsStaff();

        $order = Order::factory()->create([
            'order_number' => 'ORD-STAFF-001',
            'status' => 'pending',
            'total' => '99.99',
        ]);
        OrderItem::factory()->create(['order_id' => $order->id]);

        // The status-transition action only writes order_logs when a
        // 'stock out' MovementType exists (see UpdateOrderStatusAction).
        MovementType::factory()->create(['movement_status' => 'stock out']);

        // Staff can view the orders list
        $this->get('/staff-orders')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('staff-orders')
                ->where('auth.user.roles.0.name', 'Staff'));

        // Staff cannot access the admin-only orders index
        $this->get('/admin/orders')->assertForbidden();

        // Staff can view a single order
        $this->get("/staff-orders/{$order->id}")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('staff-orders')
                ->where('order.id', $order->id));

        // Staff can update order status
        $this->patch("/staff-orders/{$order->id}/status", [
            'status' => 'processing',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
        ]);

        // order_logs is recorded for the status transition
        $this->assertDatabaseHas('order_logs', [
            'order_item_id' => $order->orderItems()->first()->id,
        ]);
    }

    public function test_staff_receives_403_when_attempting_to_edit_order_items_or_delete_order(): void
    {
        $this->actingAsStaff();

        $order = Order::factory()->create(['status' => 'pending']);

        // Staff cannot perform full order update (modifying items, prices, billing)
        $this->patch("/admin/order/{$order->id}", [
            'customer_name' => 'Hacked Name',
            'total' => '0.01',
        ])->assertForbidden();

        // Staff cannot delete an order
        $this->delete("/admin/order/{$order->id}")->assertForbidden();
    }

    public function test_staff_stock_addition_creates_pending_movement_without_incrementing_stocks(): void
    {
        $staff = $this->actingAsStaff();

        $product = Product::factory()->create();
        $movementType = MovementType::firstOrCreate(['movement_status' => 'stock in']);
        Stock::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
            'status' => 'in_stock',
        ]);

        $this->post('/stock-movements', [
            'product_id' => $product->id,
            'movement_id' => $movementType->id,
            'quantity_change' => 5,
        ])->assertRedirect()->assertSessionHas('success');

        // Stock movement is created as pending
        $movement = StockMovement::where('product_id', $product->id)->first();
        $this->assertNotNull($movement);
        $this->assertDatabaseHas('stock_logs', [
            'stock_movement_id' => $movement->id,
            'status' => 'pending',
            'user_id' => $staff->id,
        ]);

        // Stocks is NOT incremented for pending movements
        $this->assertDatabaseHas('stocks', [
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
    }

    public function test_staff_receives_403_when_attempting_to_approve_or_reject_pending_stock_movement(): void
    {
        $this->actingAsStaff();

        $movement = StockMovement::factory()->create([
            'product_id' => Product::factory()->create()->id,
            'movement_id' => MovementType::factory()->create()->id,
            'quantity_change' => 5,
        ]);
        StockLog::factory()->create([
            'stock_movement_id' => $movement->id,
            'status' => 'pending',
        ]);

        // Staff cannot approve a pending stock movement
        $this->patch("/admin/stockmovement/{$movement->id}/approve")->assertForbidden();

        // Staff cannot reject a pending stock movement
        $this->patch("/admin/stockmovement/{$movement->id}/reject")->assertForbidden();

        // Movement remains pending
        $this->assertDatabaseHas('stock_logs', [
            'stock_movement_id' => $movement->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_approving_pending_stock_movement_increments_stocks_and_creates_stock_log(): void
    {
        $admin = $this->actingAsAdmin();

        // The staff member who originally submitted the request (not the admin).
        $staff = User::factory()->create();

        $product = Product::factory()->create();
        $movementType = MovementType::factory()->create();
        Stock::factory()->create([
            'product_id' => $product->id,
            'quantity' => 10,
            'status' => 'in_stock',
        ]);

        $movement = StockMovement::factory()->create([
            'product_id' => $product->id,
            'movement_id' => $movementType->id,
            'quantity_change' => 5,
            'user_id' => $staff->id,
        ]);
        StockLog::factory()->create([
            'stock_movement_id' => $movement->id,
            'status' => 'pending',
            'user_id' => $staff->id,
        ]);

        // Admin approves the pending stock movement
        $this->patch("/admin/stockmovement/{$movement->id}/approve")
            ->assertRedirect()
            ->assertSessionHas('success');

        // Stock log is updated to approved; original submitter preserved, approver recorded separately.
        $this->assertDatabaseHas('stock_logs', [
            'stock_movement_id' => $movement->id,
            'status' => 'approved',
            'user_id' => $staff->id,
            'approved_by' => $admin->id,
        ]);

        // Stocks quantity is incremented
        $this->assertDatabaseHas('stocks', [
            'product_id' => $product->id,
            'quantity' => 15,
        ]);
    }

public function test_admin_approving_pending_stock_movement_creates_stock_record_when_missing(): void
{
    $admin = $this->actingAsAdmin();

    $staff = User::factory()->create();

    $product = Product::factory()->create();
    $movementType = MovementType::factory()->create();
    // No stock record exists for this product yet.

    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'movement_id' => $movementType->id,
        'quantity_change' => 7,
        'user_id' => $staff->id,
    ]);
    StockLog::factory()->create([
        'stock_movement_id' => $movement->id,
        'status' => 'pending',
        'user_id' => $staff->id,
    ]);

    $this->patch("/admin/stockmovement/{$movement->id}/approve")
        ->assertRedirect()
        ->assertSessionHas('success');

    // A stock record is created for the product with the approved quantity.
    $this->assertDatabaseHas('stocks', [
        'product_id' => $product->id,
        'quantity' => 7,
        'status' => 'low_stock',
    ]);
}

public function test_admin_rejecting_pending_stock_movement_does_not_modify_stock_and_preserves_submitter(): void
{
    $admin = $this->actingAsAdmin();

    $staff = User::factory()->create();

    $product = Product::factory()->create();
    $movementType = MovementType::factory()->create();
    Stock::factory()->create([
        'product_id' => $product->id,
        'quantity' => 10,
        'status' => 'in_stock',
    ]);

    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'movement_id' => $movementType->id,
        'quantity_change' => 5,
        'user_id' => $staff->id,
    ]);
    StockLog::factory()->create([
        'stock_movement_id' => $movement->id,
        'status' => 'pending',
        'user_id' => $staff->id,
    ]);

    $this->patch("/admin/stockmovement/{$movement->id}/reject")
        ->assertRedirect()
        ->assertSessionHas('success');

    // Stock log is updated to rejected; original submitter preserved, rejecter recorded separately.
    $this->assertDatabaseHas('stock_logs', [
        'stock_movement_id' => $movement->id,
        'status' => 'rejected',
        'user_id' => $staff->id,
        'rejected_by' => $admin->id,
    ]);

    // Stocks quantity is NOT modified by a rejection.
    $this->assertDatabaseHas('stocks', [
        'product_id' => $product->id,
        'quantity' => 10,
    ]);
}

public function test_staff_can_view_stocks_with_product_quantities_and_statuses(): void
{
    $this->actingAsStaff();

    $alpha = Product::factory()->create(['name' => 'Alpha Widget']);
    $beta = Product::factory()->create(['name' => 'Beta Gadget']);

    Stock::factory()->create([
        'product_id' => $alpha->id,
        'quantity' => 25,
        'status' => 'in_stock',
    ]);
    Stock::factory()->create([
        'product_id' => $beta->id,
        'quantity' => 3,
        'status' => 'low_stock',
    ]);

    // StockController indexes stocks latest('updated_at') first; created_at has
    // second precision so ties are possible, assert on the set rather than order.
    $this->get('/stocks')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('stocks/index')
            ->has('stocks.data', 2)
            ->where('stocks.data', function ($stocks) {
                $names = collect($stocks)->pluck('product.name')->sort()->values()->all();
                $this->assertSame(['Alpha Widget', 'Beta Gadget'], $names);

                $this->assertSame([3, 25], collect($stocks)->pluck('quantity')->sort()->values()->all());
                $this->assertSame(['in_stock', 'low_stock'], collect($stocks)->pluck('status')->sort()->values()->all());

                return true;
            })
            ->has('products', 2));
}
}
