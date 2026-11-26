<?php

namespace App\Actions;

use App\Dtos\StockMovementData;
use App\Models\Stock;
use App\Models\StockLog;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CreateStockMovementAction
{
    public function execute(StockMovementData $data, User $user, bool $autoApprove = false): Model
    {
        return DB::transaction(function () use ($data, $user, $autoApprove) {
            $movement = StockMovement::create([
                'product_id' => $data->product_id,
                'movement_id' => $data->movement_id,
                'quantity_change' => $data->quantity_change,
                'user_id' => $user->id,
            ]);

            $status = $autoApprove ? 'approved' : 'pending';

            StockLog::create([
                'user_id' => $user->id,
                'stock_movement_id' => $movement->id,
                'status' => $status,
            ]);

            if ($autoApprove) {
                $this->incrementStock($data->product_id, $data->quantity_change);
            }

            return $movement->fresh();
        });
    }

    private function incrementStock(int $productId, int $quantity): void
    {
        $stock = Stock::lockForProduct($productId);

        if (! $stock) {
            return;
        }

        $newQuantity = (int) $stock->quantity + $quantity;
        $newStatus = $newQuantity === 0
            ? 'out_of_stock'
            : ($stock->status === 'out_of_stock' ? 'in_stock' : $stock->status);

        $stock->update([
            'quantity' => $newQuantity,
            'status' => $newStatus,
        ]);
    }
}
