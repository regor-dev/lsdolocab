<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct()
    {
    }

    public function getPaginatedProducts(array $filters = []): LengthAwarePaginator
    {
        return Product::paginated($filters);
    }

    /** @return array<int, array<string, mixed>> */
    public function getStorefrontProducts(): array
    {
        return Product::query()
            ->with([
                'brand:id,brand_name',
                'variant:id,color,size,price',
                'stocks:id,product_id,quantity',
            ])
            ->whereHas('variant')
            ->withSum('stocks as stock', 'quantity')
            ->orderBy('name', 'asc')
            ->get(['id', 'brand_id', 'product_var_id', 'name', 'description', 'img'])
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => is_string($product->name)
                    ? str_replace('Â·', '·', $product->name)
                    : $product->name,
                'description' => is_string($product->description)
                    ? str_replace('Â·', '·', $product->description)
                    : $product->description,
                'image' => $product->image_url,
                'image_url' => $product->image_url,
                'price' => (float) ($product->variant->price ?? 0),
                'selling_price' => (float) ($product->variant->price ?? 0),
                'brand' => $product->brand?->brand_name ?? 'LS Dolocab',
                'variant' => [
                    'color' => is_string($product->variant->color)
                        ? str_replace('Â·', '·', $product->variant->color)
                        : $product->variant->color,
                    'size' => is_string($product->variant->size)
                        ? str_replace('Â·', '·', $product->variant->size)
                        : $product->variant->size,
                    'price' => (float) $product->variant->price,
                ],
                'available_stock' => (int) $product->stocks->sum('quantity'),
                'size_stocks' => is_array($product->size_stocks) ? $product->size_stocks : [],
            ])
            ->sortBy(fn (array $item) => ($item['available_stock'] ?? 0) > 0 ? 0 : 1)
            ->values()
            ->all();
    }

    public function getAllBrands(): Collection
    {
        return Brand::formOptions();
    }

    public function getFormOptions(): array
    {
        return [
            'brands' => $this->getAllBrands(),
            // 'variants' removed — served async from /productvariant/options
        ];
    }

    /** For the async SearchableSelect. */
    public function searchVariants(?string $q): array
    {
        return ProductVariant::searchOptions($q);
    }

    public function getProductDetails(Product $product): Product
    {
        return $product->load(['brand', 'variant.category', 'stocks', 'stockMovements']);
    }

    public function getProductForEdit(Product $product): Product
    {
        return $product->load(['brand', 'variant']);
    }

    public function createProduct(array $data): Product
    {
        $data = $this->sanitize($data);

        return DB::transaction(function () use ($data) {
            return Product::create($data);
        });
    }

    public function updateProduct(Product $product, array $data): bool
    {
        $data = $this->sanitize($data);

        return DB::transaction(function () use ($product, $data) {
            return $product->update($data);
        });
    }

    public function deleteProduct(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            return $product->delete();
        });
    }

    private function sanitize(array $data): array
    {
        $sanitized = [];

        if (($data['image'] ?? null) instanceof UploadedFile) {
            $image = $data['image'];
            $sanitized['img'] = 'data:'.$image->getMimeType().';base64,'.base64_encode($image->get());
        } elseif (in_array($data['remove_image'] ?? false, [true, 1, '1'], true)) {
            $sanitized['img'] = null;
        }

        $sanitized['brand_id'] = (int) ($data['brand_id'] ?? 0);
        $sanitized['product_var_id'] = (int) ($data['product_var_id'] ?? 0);

        $sanitized['name'] = is_string($data['name'])
            ? trim(strip_tags($data['name']))
            : $data['name'];

        $sanitized['description'] = (is_string($data['description'] ?? null) && $data['description'] !== '')
            ? trim(strip_tags($data['description']))
            : null;

        return $sanitized;
    }
}
