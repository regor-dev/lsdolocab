<?php

namespace App\Dtos;

class StockMovementData
{
    public function __construct(
        public int $product_id,
        public int $movement_id,
        public int $quantity_change,
    ) {}
}
