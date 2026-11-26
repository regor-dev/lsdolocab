<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable(['order_id', 'product_id', 'quantity', 'size', 'sub_total'])]
class OrderItem extends Model
{
    /** @use HasFactory<\Database\Factories\OrderItemFactory> */
    use HasFactory;

    protected $casts = [
        'sub_total' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderLogs(): HasMany
    {
        return $this->hasMany(OrderLog::class);
    }

    public static function productIdForOrderItem(int|string $orderItemId): ?int
    {
        return static::query()->whereKey($orderItemId)->value('product_id');
    }

    public static function orderLogOptions(): Collection
    {
        return static::query()
            ->with(['order:id,order_number', 'product:id,name'])
            ->latest('created_at')
            ->get();
    }
}
