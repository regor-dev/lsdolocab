<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Stock;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private CheckoutService $checkoutService) {}

    public function prepareResourceAttributes(array $attributes, ?Model $record): array
    {
        if ($record === null) {
            $attributes['total'] = 0;
        }

        return $attributes;
    }

    /** Cancel a pending order and reverse reserved stock. */
    public function cancelOrder(Order $order): void
    {
        $order->loadMissing('orderItems');

        DB::transaction(function () use ($order): void {
            $stocks = collect();

            if ($order->orderItems->isNotEmpty()) {
                $stocks = Stock::lockBatchForProducts(
                    $order->orderItems->pluck('product_id')->unique()->values()->all()
                );
            }

            foreach ($order->orderItems as $item) {
                $stock = $stocks->get((int) $item->product_id);

                if ($stock) {
                    $newQuantity = (int) $stock->quantity + (int)$item->quantity;
                    $stock->update([
                        'quantity' => $newQuantity,
                        'status' => \App\Actions\ApproveStockMovementAction::statusForQuantity($newQuantity),
                    ]);
                }
            }

            $order->update(['status' => 'cancelled']);
        });
    }

    public function getAllOrdersWithDetails()
    {
        return Order::with(['user:id,name,email', 'orderItems.product:id,name', 'orderLogs'])
            ->latest()
            ->get();
    }
}
