<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\SizeCategory;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CustomerStorefrontTest extends TestCase
{
    use RefreshDatabase;

    public function test_customers_see_the_storefront_and_can_place_a_pending_order(): void
    {
        $category = SizeCategory::factory()->create();
        $variant = ProductVariant::factory()->create([
            'category_id' => $category->id,
            'price' => 29.95,
        ]);
        $product = Product::factory()->create(['product_var_id' => $variant->id]);
        $stock = Stock::factory()->create([
            'product_id' => $product->id,
            'quantity' => 4,
            'status' => 'in_stock',
        ]);
        $customer = User::factory()->create([
            'birth_date' => '1995-01-02',
            'address' => '123 Market Street',
            'cellphone_number' => '09171234567',
        ]);
        $customer->assignRole(Role::findOrCreate('Customer'));

        $this->actingAs($customer)
            ->get('/dashboard')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/index')
                ->where('products.0.id', $product->id)
                ->where('products.0.available_stock', 4)
                ->has('orders')
                ->has('billing'));

        $this->post('/checkout', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
            'billing' => [
                'name' => 'Jamie Customer',
                'phone' => '09171234567',
                'address' => '456 Delivery Road',
                'city' => 'Cebu City',
                'postal_code' => '6000',
                'country' => 'Philippines',
            ],
            'payment_method' => 'gcash',
            'payment_reference' => 'GCASH-REF-123',
        ])->assertRedirect('/dashboard')->assertSessionHas('success');

        $this->assertDatabaseHas('orders', [
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'status' => 'pending',
            'total' => '59.90',
            'billing_name' => 'Jamie Customer',
            'customer_phone' => '09171234567',
            'billing_address' => '456 Delivery Road',
            'billing_city' => 'Cebu City',
            'billing_postal_code' => '6000',
            'billing_country' => 'Philippines',
            'payment_method' => 'gcash',
            'payment_reference' => 'GCASH-REF-123',
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'sub_total' => '59.90',
        ]);
        $this->assertSame(2, (int) $stock->fresh()->quantity);

        $this->get('/dashboard')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('orders.0.payment_method', 'gcash')
                ->where('orders.0.payment_reference', 'GCASH-REF-123')
                ->where('orders.0.billing.phone', '09171234567')
                ->where('orders.0.transaction_log.1.label', 'Payment reference submitted')
                ->where('orders.0.transaction_log.1.description', 'Reference: GCASH-REF-123. Awaiting store verification.'));
    }

    public function test_checkout_rejects_quantities_above_available_stock(): void
    {
        $product = Product::factory()->create();
        Stock::factory()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'status' => 'in_stock',
        ]);
        $customer = User::factory()->create([
            'birth_date' => '1995-01-02',
            'address' => '123 Market Street',
            'cellphone_number' => '09171234567',
        ]);
        $customer->assignRole(Role::findOrCreate('Customer'));

        $this->actingAs($customer)
            ->post('/checkout', [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
            ])
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('stocks', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);
    }
}
