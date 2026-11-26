<?php

namespace Database\Factories;

use App\Models\Stock;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stock>
 */
class StockFactory extends Factory
{
    protected $model = Stock::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'status'     => $this->faker->randomElement(['in_stock', 'low_stock', 'out_of_stock']),
            'quantity'   => $this->faker->numberBetween(0, 200),
        ];
    }
}
