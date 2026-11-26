<?php

namespace Database\Factories;

use App\Models\SizeCategory;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'category_id' => SizeCategory::factory(),
            'color'       => $this->faker->safeColorName(),
            'size'        => $this->faker->randomElement(['S', 'M', 'L', 'XL', 'US 8', 'US 9', 'US 10']),
            'sku'         => strtoupper($this->faker->unique()->bothify('SKU-???-#####')),
            'price'       => $this->faker->randomFloat(2, 10, 500),
        ];
    }
}
