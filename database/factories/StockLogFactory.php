<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\StockLog;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockLog>
 */
class StockLogFactory extends Factory
{
    protected $model = StockLog::class;

    public function definition(): array
    {
        return [
            'user_id'           => User::factory(),
            'stock_movement_id' => StockMovement::factory(),
            'status'            => $this->faker->randomElement(['pending', 'approved', 'rejected']),
        ];
    }
}
