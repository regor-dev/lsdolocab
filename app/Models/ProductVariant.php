<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable(['category_id', 'color', 'size', 'sku', 'price'])]
class ProductVariant extends Model
{
    /** @use HasFactory<\Database\Factories\ProductVariantFactory> */
    use HasFactory;
  

    public function category(): BelongsTo
    {
        return $this->belongsTo(SizeCategory::class, 'category_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'product_var_id');
    }

    public static function formOptions(): Collection
    {
        return static::query()->get(['id', 'sku', 'color', 'price']);
    }

    public static function searchOptions(?string $q, int $limit = 20): array
    {
        return static::query()
            ->when($q, fn ($query) => $query->where(function ($w) use ($q) {
                $w->where('sku', 'like', "%{$q}%")
                  ->orWhere('color', 'like', "%{$q}%")
                  ->orWhere('size', 'like', "%{$q}%");
            }))
            ->orderBy('sku')
            ->limit($limit)
            ->get(['id', 'sku', 'color', 'price'])
            ->map(fn (self $v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'color' => $v->color,
                'price' => (float) $v->price,
            ])
            ->all();
    }
}
