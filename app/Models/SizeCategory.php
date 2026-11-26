<?php

namespace App\Models;

use App\Models\Concerns\FlushesDashboardCache;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable(['category_name'])]
class SizeCategory extends Model
{
    /** @use HasFactory<\Database\Factories\SizeCategoryFactory> */
    use HasFactory, FlushesDashboardCache;


    public function productVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'category_id');
    }

    public static function formOptions(): array
    {
        return static::query()
            ->orderBy('category_name')
            ->get(['id', 'category_name'])
            ->map(fn (SizeCategory $category) => [
                'value' => $category->id,
                'label' => $category->category_name,
            ])
            ->all();
    }
}

