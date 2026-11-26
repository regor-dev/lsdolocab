<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'brand_id'       => Brand::factory(),
            'product_var_id' => ProductVariant::factory(),
            'name'           => $this->faker->words(3, true),
            'description'    => $this->faker->sentence(),
        ];
    }
}
