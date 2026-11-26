<?php

namespace App\Services;

use App\Models\MovementType;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class StockMovementService
{
    public function getFormOptions(): array
    {
        return [
            'product_id' => Product::formOptions(),
            'movement_id' => MovementType::formOptions(),
        ];
    }

    public function afterSave(StockMovement $record, ?Model $previous): void
    {
        if ($previous instanceof StockMovement) {
            $this->applyMovement($previous, -1);
        }

        $this->applyMovement($record, 1);
    }

    public function beforeDelete(StockMovement $record): void
    {
        $this->applyMovement($record, -1);
    }

    private function applyMovement(StockMovement $movement, int $multiplier): void
    {
        $movementType = MovementType::findOrFail($movement->movement_id);
        $stock = Stock::lockForProduct($movement->product_id);

        if ($stock === null) {
            throw ValidationException::withMessages([
                'product_id' => 'Create a stock record for this product before recording a movement.',
            ]);
        }

        $direction = $movementType->movement_status === 'stock in' ? 1 : -1;
        $newQuantity = (int) $stock->quantity + ($direction * $multiplier * abs((int) $movement->quantity_change));

        if ($newQuantity < 0) {
            throw ValidationException::withMessages([
                'quantity_change' => 'This movement would reduce available stock below zero.',
            ]);
        }

        $status = $newQuantity === 0
            ? 'out_of_stock'
            : ($stock->status === 'out_of_stock' ? 'in_stock' : $stock->status);

        $stock->update([
            'quantity' => $newQuantity,
            'status' => $status,
        ]);
    }
}
