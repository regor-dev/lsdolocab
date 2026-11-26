<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MovementType;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\SizeCategory;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class ResourceCrudTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_hidden_module_screens_redirect_while_other_resource_screens_remain_available(): void
    {
        $this->actingAsAdmin();

        foreach ([
            ['/admin/stock', 'stocks/index'],
            ['/admin/orders', 'orders/index'],
        ] as [$uri, $component]) {
            $this->get($uri)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
                ->component($component));
        }

        foreach (['stocklog', 'orderlog', 'role'] as $resource) {
            $this->get("/admin/{$resource}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
                ->component('resource-manager')
                ->where('resource.key', $resource)
                ->where('mode', 'index'));
        }

        foreach ([
            'productvariant' => '/product',
            'sizecategory' => '/product',
            'stockmovement' => '/stock',
            'movementtype' => '/stock',
        ] as $resource => $fallback) {
            $this->get("/admin/{$resource}")->assertRedirect($fallback);
            $this->get("/admin/{$resource}/create")->assertRedirect($fallback);
            $this->get("/admin/{$resource}/1")->assertRedirect($fallback);
            $this->get("/admin/{$resource}/1/edit")->assertRedirect($fallback);
        }
    }

    public function test_order_creation_sanitizes_text_and_ignores_client_supplied_totals(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/order', [
            'order_number' => 'ORD-SECURE-001',
            'customer_name' => ' <b>Alice Customer</b> ',
            'order_date' => '2026-11-16',
            'status' => 'pending',
            'total' => 99999,
        ])->assertRedirect('/order')->assertSessionHasNoErrors();

        $order = Order::query()->where('order_number', 'ORD-SECURE-001')->firstOrFail();
        $this->assertSame('Alice Customer', $order->customer_name);
        $this->assertEquals(0, $order->total);
    }

    public function test_order_fields_are_validated_before_writing(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/order', [
            'order_number' => '',
            'customer_name' => '<i>Customer</i>',
            'order_date' => 'not-a-date',
            'status' => 'unknown',
        ])->assertSessionHasErrors(['order_number', 'order_date', 'status']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_role_crud_sanitizes_names_and_rejects_duplicate_values(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/role', ['role_name' => '<b>Cashier</b>'])
            ->assertRedirect('/role')
            ->assertSessionHasNoErrors();

        $role = Role::query()->where('name', 'Cashier')->firstOrFail();
        $this->assertSame('Cashier', $role->role_name);
        $this->get('/admin/user/create')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('user/create')
            ->has('roles', 2)
            ->where('roles.1.role_name', 'Cashier'));

        $this->put('/admin/role/'.$role->id, ['role_name' => 'Cashier'])
            ->assertRedirect('/role')
            ->assertSessionHasNoErrors();
        $this->post('/admin/role', ['role_name' => 'Cashier'])->assertSessionHasErrors(['role_name']);
        $this->delete('/admin/role/'.$role->id)->assertRedirect('/role');
        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_product_form_still_receives_variants_when_variant_screen_is_hidden(): void
    {
        $this->actingAsAdmin();
        $category = SizeCategory::factory()->create();
        $variant = ProductVariant::factory()->create(['category_id' => $category->id]);

        $this->get('/admin/product/create')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('product/create'));
    }

    public function test_stock_movements_update_stock_and_reverse_when_edited_or_deleted(): void
    {
        $this->actingAsAdmin();

        $product = Product::factory()->create();
        $stock = Stock::factory()->create([
            'product_id' => $product->id,
            'quantity' => 5,
            'status' => 'in_stock',
        ]);
        $stockIn = MovementType::query()->create(['movement_status' => 'stock in']);
        $stockOut = MovementType::query()->create(['movement_status' => 'stock out']);

        $this->post('/stock-movements', [
            'product_id' => $product->id,
            'movement_id' => $stockIn->id,
            'quantity_change' => 3,
        ])->assertSessionHasNoErrors();

        $movement = StockMovement::query()->firstOrFail();
        $this->assertSame(8, $stock->fresh()->quantity);

        $this->put('/admin/stockmovement/'.$movement->id, [
            'product_id' => $product->id,
            'movement_id' => $stockOut->id,
            'quantity_change' => 2,
        ])->assertRedirect('/stockmovement')->assertSessionHasNoErrors();
        $this->assertSame(3, $stock->fresh()->quantity);

        $this->delete('/admin/stockmovement/'.$movement->id)->assertRedirect('/stockmovement');
        $this->assertSame(5, $stock->fresh()->quantity);

        $this->post('/stock-movements', [
            'product_id' => $product->id,
            'movement_id' => $stockOut->id,
            'quantity_change' => 0,
        ])->assertSessionHasErrors(['quantity_change']);
        $this->assertSame(5, $stock->fresh()->quantity);
        $this->assertDatabaseCount('stock_movements', 0);
    }
}
