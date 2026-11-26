<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function placeOrder(User $customer, array $checkout): Order
    {
        return DB::transaction(function () use ($customer, $checkout): Order {
            $items = $checkout['items'];
            $billing = $checkout['billing'] ?? [];
            $items = collect($items)->sortBy('product_id')->values();
            $products = Product::findMultipleWithVariant($items->pluck('product_id')->all());
            $stocks = Stock::lockBatchForProducts($products->keys()->all());

            $orderedItems = [];
            $totalCents = 0;

            foreach ($items as $item) {
                $product = $products->get((int) $item['product_id']);

                if ($product === null || $product->variant === null) {
                    throw ValidationException::withMessages([
                        'items' => 'A selected shoe is no longer available.',
                    ]);
                }

                $stock = $stocks->get((int) $product->id);
                $quantity = (int) $item['quantity'];

                if ($stock === null || (int) $stock->quantity < $quantity) {
                    $available = (int) ($stock?->quantity ?? 0);
                    throw ValidationException::withMessages([
                        'items' => "{$product->name} has only {$available} pair(s) available.",
                    ]);
                }

                $unitPriceCents = (int) round((float) $product->variant->price * 100);
                $subtotalCents = $unitPriceCents * $quantity;
                $totalCents += $subtotalCents;
                $orderedItems[] = [
                    'product' => $product,
                    'stock' => $stock,
                    'quantity' => $quantity,
                    'subtotal_cents' => $subtotalCents,
                ];
            }

            $paymentMethod = $checkout['payment_method'] ?? $customer->payment_method;
            if (! in_array($paymentMethod, ['gcash', 'cod', 'counter'], true)) {
                $paymentMethod = 'gcash';
            }

            $order = null;
            for ($attempt = 0; $attempt < 5; $attempt++) {
                $orderNumber = 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
                if (Order::orderNumberExists($orderNumber)) {
                    continue;
                }
                try {
                    $order = Order::create([
                'user_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => $billing['phone'] ?? $customer->cellphone_number ?? $customer->phone,
                'order_number' => $orderNumber,
                'order_date' => now()->toDateString(),
                'status' => 'pending',
                'total' => number_format($totalCents / 100, 2, '.', ''),
                'billing_name' => $billing['name'] ?? ($customer->billing_name ?: $customer->name),
                'billing_address' => $billing['address'] ?? ($customer->billing_address ?: $customer->address),
                'billing_city' => $billing['city'] ?? $customer->billing_city,
                'billing_postal_code' => array_key_exists('postal_code', $billing)
                    ? $billing['postal_code']
                    : $customer->billing_postal_code,
                'billing_country' => $billing['country'] ?? ($customer->billing_country ?: 'Philippines'),
                'payment_method' => $paymentMethod,
                'payment_reference' => $checkout['payment_reference'] ?? null,
            ]);
                    break;
                } catch (QueryException $e) {
                    if (! self::isUniqueOrderNumberViolation($e) || $attempt === 4) {
                        throw $e;
                    }
                }
            }
            if (! $order) {
                throw new \RuntimeException('Unable to generate a unique order number.');
            }

            foreach ($orderedItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'size' => $item['size'],
                    'sub_total' => number_format($item['subtotal_cents'] / 100, 2, '.', ''),
                ]);
            }

            // Remove only the purchased cart items so unselected items stay intact.
            // Keys off the checked-out cart_item_ids when provided, otherwise
            // matches the purchased product IDs against the customer's cart items.
            if (class_exists(\App\Models\CartItem::class)
                && DB::getSchemaBuilder()->hasTable('cart_items')) {
                $cartItemIds = $checkout['cart_item_ids'] ?? null;
                if (is_array($cartItemIds) && $cartItemIds !== []) {
                    \App\Models\CartItem::whereIn('id',
                        array_unique(array_filter(array_map('intval', $cartItemIds))))
                        ->delete();
                } else {
                    $productIds = $items->pluck('product_id')->unique()->all();
                    \App\Models\CartItem::where('user_id', $customer->id)
                        ->whereIn('product_id', $productIds)
                        ->delete();
                }

                if (class_exists(\App\Models\Cart::class)
                    && DB::getSchemaBuilder()->hasTable('carts')) {
                    \App\Models\Cart::where('user_id', $customer->id)
                        ->whereDoesntHave('items')
                        ->delete();
                }
            }

            // Persist billing details to the customer profile so future checkouts
            // are pre-filled and profile settings reflect the latest data.
            $customerBilling = [];
            if (! empty($billing['name'])) {
                $customerBilling['billing_name'] = $billing['name'];
            }
            if (! empty($billing['address'])) {
                $customerBilling['billing_address'] = $billing['address'];
            }
            if (! empty($billing['city'])) {
                $customerBilling['billing_city'] = $billing['city'];
            }
            if (array_key_exists('postal_code', $billing)) {
                $customerBilling['billing_postal_code'] = $billing['postal_code'];
            }
            if (! empty($billing['country'])) {
                $customerBilling['billing_country'] = $billing['country'];
            }
            if (array_key_exists('phone', $billing) && ! empty($billing['phone'])) {
                $customerBilling['cellphone_number'] = $billing['phone'];
                $customerBilling['phone'] = $billing['phone'];
            }
            $customerBilling['payment_method'] = $paymentMethod;
            if (! empty($customerBilling)) {
                $customer->update($customerBilling);
            }

            return $order->load(['orderItems.product.brand', 'orderItems.product.variant']);
        });
    }

    /** @return \Illuminate\Contracts\Pagination\LengthAwarePaginator<int, Order> */
    public function customerOrderHistory(User $customer): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Order::customerHistory($customer)->paginate(15);
    }

    /**
     * @return array<string, mixed>
     */
    public function transformOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_date' => optional($order->order_date)->toDateString(),
            'status' => $order->status,
            'total' => (float) $order->total,
            'payment_method' => $order->payment_method,
            'payment_reference' => $order->payment_reference,
            'billing' => [
                'name' => $order->billing_name,
                'phone' => $order->customer_phone,
                'address' => $order->billing_address,
                'city' => $order->billing_city,
                'postal_code' => $order->billing_postal_code,
                'country' => $order->billing_country,
            ],
            'items' => $order->orderItems->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'quantity' => (int) $item->quantity,
                'sub_total' => (float) $item->sub_total,
                'product' => $item->product ? [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'description' => $item->product->description,
                    'image' => $item->product->image_url,
                    'brand' => $item->product->brand?->brand_name ?? 'LS Dolocab',
                    'variant' => $item->product->variant ? [
                        'color' => $item->product->variant->color,
                        'size' => $item->product->variant->size,
                        'price' => (float) $item->product->variant->price,
                    ] : null,
                ] : null,
            ])->values(),
            'transaction_log' => $this->transactionLog($order),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    public function transactionLog(Order $order): array
    {
        $placedAt = $order->created_at?->toIso8601String() ?? optional($order->order_date)->toIso8601String();
        $updatedAt = $order->updated_at?->toIso8601String() ?? $placedAt;
        $status = $order->status;
        $events = [
            [
                'status' => 'placed',
                'label' => 'Order placed',
                'description' => "Order {$order->order_number} was created.",
                'date' => $placedAt,
            ],
            [
                'status' => 'payment',
                'label' => $order->payment_reference
                    ? 'Payment reference submitted'
                    : ($order->payment_method === 'gcash' ? 'GCash payment pending' : 'Cash on delivery selected'),
                'description' => $order->payment_reference
                    ? "Reference: {$order->payment_reference}. Awaiting store verification."
                    : ($order->payment_method === 'gcash'
                        ? 'GCash was selected. Payment remains pending until the store verifies it.'
                        : 'Payment is due upon delivery.'),
                'date' => $placedAt,
            ],
        ];

        if (in_array($status, ['processing', 'completed', 'cancelled'], true)) {
            $events[] = [
                'status' => 'processing',
                'label' => 'Order processing',
                'description' => 'The order moved to processing.',
                'date' => $updatedAt,
            ];
        }

        if ($status === 'completed') {
            $events[] = [
                'status' => 'completed',
                'label' => 'Order completed',
                'description' => 'The order has been completed.',
                'date' => $updatedAt,
            ];
        }

        if ($status === 'cancelled') {
            $events[] = [
                'status' => 'cancelled',
                'label' => 'Order cancelled',
                'description' => 'The order was cancelled.',
                'date' => $updatedAt,
            ];
        }

        return $events;
    }

    private static function isUniqueOrderNumberViolation(QueryException $e): bool
    {
        return $e->getCode() === '23000'
            && Str::contains($e->getMessage(), ['orders_order_number_unique', 'order_number']);
    }
}
