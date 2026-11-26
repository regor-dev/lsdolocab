<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;

class BrandService
{
    public function getPaginatedBrands(array $filters): LengthAwarePaginator
    {
        return Brand::paginated($filters);
    }

    public function getBrandWithProductCount(Brand $brand): Brand
    {
        return $brand->loadCount('products');
    }

    public function createBrand(array $data): Brand
    {
        return Brand::create($this->sanitizeBrandData($data));
    }

    public function updateBrand(Brand $brand, array $data): bool
    {
        return $brand->update($this->sanitizeBrandData($data));
    }

    public function deleteBrand(Brand $brand): bool
    {
        return $brand->delete();
    }

    private function sanitizeBrandData(array $data): array
    {
        if (($data['image'] ?? null) instanceof UploadedFile) {
            $image = $data['image'];
            $data['img'] = 'data:'.$image->getMimeType().';base64,'.base64_encode($image->get());
        } elseif (in_array($data['remove_image'] ?? false, [true, 1, '1'], true)) {
            $data['img'] = null;
        }

        unset($data['image'], $data['remove_image']);

        if (isset($data['brand_name'])) {
            $data['brand_name'] = trim(strip_tags($data['brand_name']));
        }

        return $data;
    }
}
