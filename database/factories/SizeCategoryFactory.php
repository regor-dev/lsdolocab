<?php

namespace Database\Factories;

use App\Models\SizeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SizeCategory>
 */
class SizeCategoryFactory extends Factory
{
    protected $model = SizeCategory::class;

    public function definition(): array
    {
        return [
            'category_name' => $this->faker->unique()->randomElement([
                'Men Footwear', 'Women Apparel', 'Unisex Gear', 'Accessories', 'Kids Wear'
            ]),
        ];
    }
}
