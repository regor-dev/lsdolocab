<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\StockMovement;
use Illuminate\Database\Query\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class OrderLogService
{
    public function getFormOptions(): array
    {
        return [
            'order_item_id' => OrderItem::orderLogOptions()
                ->map(fn (OrderItem $item) => [
                    'value' => $item->id,
                    'label' => ($item->order?->order_number ?? 'Order').' · '.($item->product?->name ?? 'Product'),
                ])
                ->all(),
            'stock_movement_id' => StockMovement::stockLogOptions()
                ->map(fn (StockMovement $movement) => [
                    'value' => $movement->id,
                    'label' => '#'.$movement->id.' · '.($movement->product?->name ?? 'Unknown product'),
                ])
                ->all(),
        ];
    }

    public function stockMovementRuleForOrderItem(int|string|null $orderItemId): Exists
    {
        $productId = OrderItem::productIdForOrderItem($orderItemId);

        return Rule::exists('stock_movements', 'id')
            ->where(fn (Builder $query) => $query->where('product_id', $productId));
    }
}
