<?php

namespace App\Services;

use App\Models\Product;

class StockService
{
    public function getProductOptions(): array
    {
        return [
            'product_id' => Product::formOptions(),
        ];
    }
}
