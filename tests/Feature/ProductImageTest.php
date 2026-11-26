<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_a_product_image_is_validated_and_stored_in_the_database(): void
    {
        $this->actingAsAdmin();

        $file = $this->pngFile();
        $this->post('/admin/product', [
            'brand_id' => Brand::factory()->create()->id,
            'product_var_id' => ProductVariant::factory()->create()->id,
            'name' => 'Test product',
            'image' => $file,
        ])->assertRedirect('/admin/product');

        $product = Product::query()->firstOrFail();
        $this->assertStringStartsWith('data:image/png;base64,', $product->img);
        $this->assertSame(
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'),
            base64_decode(substr($product->img, strlen('data:image/png;base64,'))),
        );
    }

    public function test_non_image_files_are_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/product', [
            'brand_id' => Brand::factory()->create()->id,
            'product_var_id' => ProductVariant::factory()->create()->id,
            'name' => 'Test product',
            'image' => UploadedFile::fake()->createWithContent('not-an-image.png', 'not an image'),
        ])->assertSessionHasErrors('image');

        $this->assertDatabaseCount('products', 0);
    }

    public function test_an_existing_product_image_can_be_removed(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['img' => 'data:image/png;base64,old-image']);

        $this->post("/admin/product/{$product->id}", [
            '_method' => 'put',
            'brand_id' => $product->brand_id,
            'product_var_id' => $product->product_var_id,
            'name' => $product->name,
            'description' => $product->description,
            'remove_image' => '1',
        ])->assertRedirect('/admin/product');

        $this->assertNull($product->fresh()->img);
    }

    public function test_the_product_index_query_includes_the_stored_image(): void
    {
        $this->actingAsAdmin();
        $brand = Brand::factory()->create(['img' => 'data:image/png;base64,brand-image']);
        $product = Product::factory()->create([
            'brand_id' => $brand->id,
            'img' => 'data:image/png;base64,stored-image',
        ]);

        $this->get('/admin/product')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('product/index')
            ->has('products.data.0.image_url')
            ->missing('products.data.0.img')
            ->where('products.data.0.brand.image_url', $brand->image_url));
    }

    private function pngFile(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'product.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'),
        );
    }
}
