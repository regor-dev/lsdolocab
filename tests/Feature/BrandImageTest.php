<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class BrandImageTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_serves_a_brand_image_with_cache_headers(): void
    {
        $this->actingAsAdmin();

        $brand = Brand::factory()->create([
            'img' => 'data:image/png;base64,'.base64_encode("\x89PNG\r\n\x1a\nfake"),
        ]);

        $res = $this->get(route('brand.image', ['brand' => $brand->id]));

        $res->assertOk();
        $this->assertSame('image/png', $res->headers->get('Content-Type'));
        $this->assertStringContainsString('max-age=86400', $res->headers->get('Cache-Control'));
        $this->assertNotNull($res->headers->get('ETag'));
    }

    public function test_returns_304_on_matching_etag(): void
    {
        $this->actingAsAdmin();

        $brand = Brand::factory()->create([
            'img' => 'data:image/png;base64,'.base64_encode('x'),
        ]);

        $res = $this->get(route('brand.image', ['brand' => $brand->id]));
        $etag = $res->headers->get('ETag');

        $this->get(route('brand.image', ['brand' => $brand->id]), ['If-None-Match' => $etag])
            ->assertStatus(304);
    }

    public function test_does_not_ship_the_raw_img_blob_to_the_index_page(): void
    {
        $user = $this->actingAsAdmin();
        $user->update([
            'birth_date' => '2000-01-01',
            'address' => '123 Main Street',
            'cellphone_number' => '09123456789',
        ]);
        Brand::factory()->create(['img' => 'data:image/png;base64,'.base64_encode('x')]);

        $this->get('/admin/brand')
            ->assertInertia(fn ($page) => $page
                ->component('brand/index')
                ->has('brands.data.0.image_url')
                ->missing('brands.data.0.img'));
    }
}
