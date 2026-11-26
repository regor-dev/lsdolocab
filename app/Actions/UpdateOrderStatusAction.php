<?php

namespace App\Actions;

use App\Dtos\UpdateOrderStatusData;
use App\Models\MovementType;
use App\Models\Order;
use App\Models\OrderLog;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class UpdateOrderStatusAction
{
    public function execute(Order $order, UpdateOrderStatusData $data): Model
    {
        return DB::transaction(function () use ($order, $data) {
            $previousStatus = $order->status;

            $order->update([
                'status' => $data->status,
            ]);

            // order_logs is a junction table: both order_item_id and
            // stock_movement_id are NOT NULL. Only write to it when a real
            // StockMovement is created per order item, i.e. on stock
            // deduction when transitioning to a stock-deducting state.
            if ($previousStatus === 'pending' && in_array($data->status, ['processing', 'completed'], true)) {
                $movementTypeId = MovementType::where('movement_status', 'stock out')->value('id');

                if ($movementTypeId) {
                    $order->loadMissing('orderItems');

                    $loggedItemIds = OrderLog::whereIn('order_item_id', $order->orderItems->pluck('id'))
                        ->pluck('order_item_id')
                        ->toArray();

                    foreach ($order->orderItems as $item) {
                        if (in_array($item->id, $loggedItemIds, true)) {
                            continue;
                        }

                        $movement = StockMovement::create([
                            'product_id'      => $item->product_id,
                            'movement_id'     => $movementTypeId,
                            'quantity_change' => - (int) $item->quantity,
                        ]);

                        OrderLog::create([
                            'order_item_id'     => $item->id,
                            'stock_movement_id' => $movement->id,
                        ]);
                    }
                }
            }

            return $order->fresh();
        });
    }
}
