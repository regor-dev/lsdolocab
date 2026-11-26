<?php

namespace Database\Factories;

use App\Models\MovementType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MovementType>
 */
class MovementTypeFactory extends Factory
{
    protected $model = MovementType::class;

    public function definition(): array
    {
        return [
            'movement_status' => $this->faker->randomElement([
                'stock in', 'stock out'
            ]),
        ];
    }
}
