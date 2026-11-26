<?php

namespace App\Actions;

use App\Models\StockLog;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class RejectStockMovementAction
{
    public function execute(StockMovement $movement, User $admin): Model
    {
        return DB::transaction(function () use ($movement, $admin) {
            $pendingLog = $movement->stockLogs()->where('status', 'pending')->first();

            if (! $pendingLog) {
                throw new \Exception('Stock movement is not pending.');
            }

            // Rejecting must not modify stock quantity. Preserve the original submitter
            // (user_id); record the rejecter separately.
            $logData = ['status' => 'rejected'];
            if (\Illuminate\Support\Facades\Schema::hasColumn('stock_logs', 'rejected_by')) {
                $logData['rejected_by'] = $admin->id;
            }
            $pendingLog->update($logData);

            if (\Illuminate\Support\Facades\Schema::hasColumn('stock_movements', 'status')) {
                $movement->update(['status' => 'rejected']);
            }

            return $movement->fresh();
        });
    }
}
