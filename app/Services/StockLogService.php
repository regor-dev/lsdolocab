<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\User;

class StockLogService
{
    public function getFormOptions(): array
    {
        return [
            'user_id' => User::formOptions(),
            'stock_movement_id' => StockMovement::stockLogOptions()
                ->map(fn (StockMovement $movement) => [
                    'value' => $movement->id,
                    'label' => '#'.$movement->id.' · '.($movement->product?->name ?? 'Unknown product'),
                ])
                ->all(),
        ];
    }
}
