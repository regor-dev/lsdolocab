<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

class OrderItemService
{
    public function getFormOptions(): array
    {
        return [
            'order_id' => Order::formOptions(),
            'product_id' => Product::formOptions(),
        ];
    }

    public function prepareResourceAttributes(array $attributes): array
    {
        if (isset($attributes['product_id'], $attributes['quantity'])) {
            $product = Product::findWithVariant($attributes['product_id']);
            $attributes['sub_total'] = round((float) $product->variant->price * (int) $attributes['quantity'], 2);
        }

        return $attributes;
    }

    public function afterSave(OrderItem $record, ?Model $previous): void
    {
        if ($previous instanceof OrderItem && $previous->order_id !== $record->order_id) {
            $this->updateOrderTotal((int) $previous->order_id);
        }

        $this->updateOrderTotal((int) $record->order_id);
    }

    public function afterDelete(OrderItem $record): void
    {
        $this->updateOrderTotal((int) $record->order_id);
    }

    private function updateOrderTotal(int $orderId): void
    {
        Order::recomputeTotal($orderId);
    }
}
