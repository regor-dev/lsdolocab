<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class ProductVariantOptionsTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_searches_variants_by_sku_color_size(): void
    {
        $this->actingAsAdmin();

        ProductVariant::factory()->create(['sku' => 'RED-42', 'color' => 'Red', 'size' => '42']);
        ProductVariant::factory()->create(['sku' => 'BLU-43', 'color' => 'Blue', 'size' => '43']);

        $this->getJson(route('productvariant.options', ['q' => 'Red']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'RED-42');
    }
}
