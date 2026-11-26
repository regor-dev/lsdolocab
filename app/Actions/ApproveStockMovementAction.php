<?php

namespace App\Actions;

use App\Models\Stock;
use App\Models\StockLog;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ApproveStockMovementAction
{
    public const LOW_STOCK_THRESHOLD = 10;

    public function execute(StockMovement $movement, User $admin): Model
    {
        return DB::transaction(function () use ($movement, $admin) {
            $pendingLog = $movement->stockLogs()->where('status', 'pending')->first();

            if (! $pendingLog) {
                throw new \Exception('Stock movement is not pending.');
            }

            $productId = $movement->product_id;
            $quantityChange = (int) $movement->quantity_change;

            // Lock the existing stock row if one exists so concurrent approvals are serialized.
            $stock = Stock::query()
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if (! $stock) {
                // No stock record exists yet for this product: create one and start from zero.
                $stock = Stock::create([
                    'product_id' => $productId,
                    'quantity' => 0,
                    'status' => 'out_of_stock',
                ]);
            }

            $newQuantity = (int) $stock->quantity + $quantityChange;
            $newStatus = self::statusForQuantity($newQuantity);

            $stock->update([
                'quantity' => $newQuantity,
                'status' => $newStatus,
            ]);

            // Preserve the original submitter (user_id). Record the approver separately.
            $logData = ['status' => 'approved'];
            if (\Illuminate\Support\Facades\Schema::hasColumn('stock_logs', 'approved_by')) {
                $logData['approved_by'] = $admin->id;
            }
            $pendingLog->update($logData);

            if (\Illuminate\Support\Facades\Schema::hasColumn('stock_movements', 'status')) {
                $movement->update(['status' => 'approved']);
            }

            return $movement->fresh();
        });
    }

    public static function statusForQuantity(int $quantity): string
    {
        if ($quantity <= 0) {
            return 'out_of_stock';
        }

        if ($quantity <= self::LOW_STOCK_THRESHOLD) {
            return 'low_stock';
        }

        return 'in_stock';
    }
}
