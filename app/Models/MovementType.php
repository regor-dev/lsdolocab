<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable(['movement_status'])]
class MovementType extends Model
{
    /** @use HasFactory<\Database\Factories\MovementTypeFactory> */
    use HasFactory;


    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'movement_id');
    }

    public static function formOptions(): array
    {
        return static::query()
            ->orderBy('movement_status')
            ->get(['id', 'movement_status'])
            ->map(fn (MovementType $type) => [
                'value' => $type->id,
                'label' => ucfirst($type->movement_status),
            ])
            ->all();
    }
}

