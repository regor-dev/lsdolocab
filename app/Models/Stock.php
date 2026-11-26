<?php

namespace App\Models;

use App\Models\Concerns\FlushesDashboardCache;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


#[Fillable(['product_id', 'status', 'quantity'])]
class Stock extends Model
{
    /** @use HasFactory<\Database\Factories\StockFactory> */
    use HasFactory, FlushesDashboardCache;

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public static function lockBatchForProducts(array $productIds): Collection
    {
        return static::query()
            ->whereIn('product_id', $productIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('product_id');
    }

    public static function inventoryByStatus(): Collection
    {
        return static::query()
            ->selectRaw('status, COUNT(*) as product_count, COALESCE(SUM(quantity), 0) as units')
            ->groupBy('status')
            ->get()
            ->keyBy('status');
    }

    public static function lowStock(): Collection
    {
        return static::query()
            ->with('product:id,name')
            ->whereIn('status', ['low_stock', 'out_of_stock'])
            ->orderBy('quantity')
            ->limit(5)
            ->get(['id', 'product_id', 'status', 'quantity']);
    }

    public static function lockForProduct(int $productId): ?Stock
    {
        return static::query()
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();
    }
}
