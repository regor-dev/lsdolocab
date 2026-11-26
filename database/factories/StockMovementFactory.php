<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\MovementType;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    protected $model = StockMovement::class;

    public function definition(): array
    {
        return [
            'product_id'      => Product::factory(),
            'movement_id'     => MovementType::factory(),
            'quantity_change' => $this->faker->numberBetween(-50, 100),
        ];
    }
}
