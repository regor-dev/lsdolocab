<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\SizeCategory;

class ProductVariantService
{
    public function getCategoryOptions(): array
    {
        return [
            'category_id' => SizeCategory::formOptions(),
        ];
    }

    public function searchVariants(?string $q): array
    {
        return ProductVariant::searchOptions($q);
    }
}
